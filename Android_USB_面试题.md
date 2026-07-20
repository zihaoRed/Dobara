# Android USB 相关面试题（20 题 · 含答案）

> 适用场景：二手设备回收平台 Android 平板应用开发  
> 核心场景：OTG 连接被检手机 → 读取硬件数据 → 发送 ADB 指令 → 上传云端

---

## 基础篇（1-7 题）

### 1. Android 设备作为 USB Host 需要满足哪些条件？

**答案：**

1. **硬件支持**：设备芯片必须支持 USB Host 或 OTG 模式
2. **OS 版本**：Android 3.1（API 12）及以上原生支持 USB Host
3. **OTG 线缆**：需要 OTG 转接线将 micro-USB/USB-C 转为标准 USB-A 母口
4. **供电能力**：Host 端需提供至少 5V/100mA 的 Vbus 供电
5. **权限声明**：`AndroidManifest.xml` 中声明 `<uses-feature android:name="android.hardware.usb.host" android:required="true"/>`
6. **驱动支持**：系统内核需包含对应设备类型的驱动（如 CDC-ACM、HID 等）

```xml
<uses-feature android:name="android.hardware.usb.host" android:required="true" />
```

---

### 2. `UsbManager`、`UsbDevice`、`UsbInterface`、`UsbEndpoint` 之间的关系是什么？

**答案：**

```
UsbManager（管理者）
  └── 发现并枚举设备 → UsbDevice（被连接的物理设备）
        └── 包含多个 → UsbInterface（设备功能分组，如 ADB 接口、MTP 接口）
              └── 包含多个 → UsbEndpoint（数据传输端点）
                    ├── TYPE_BULK（批量传输，数据量大）
                    ├── TYPE_INTERRUPT（中断传输，少量数据）
                    ├── TYPE_ISOCHRONOUS（同步传输，音视频）
                    └── TYPE_CONTROL（控制传输，设备配置）
```

| 概念 | 类比 | 说明 |
|------|------|------|
| UsbManager | 物业公司 | 管理所有 USB 连接 |
| UsbDevice | 一栋楼 | 一个物理 USB 设备 |
| UsbInterface | 一层楼 | 设备的一个功能（一个设备可有多功能） |
| UsbEndpoint | 一间房 | 数据传输的通道，有方向（IN/OUT） |

---

### 3. 如何让 App 在被检手机连接时自动唤醒？写出 Intent Filter 和权限请求的关键代码。

**答案：**

**步骤 1**：`AndroidManifest.xml` 声明：

```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
    </intent-filter>
    <meta-data
        android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
        android:resource="@xml/device_filter" />
</activity>
```

**步骤 2**：`res/xml/device_filter.xml`：

```xml
<resources>
    <!-- 匹配所有 ADB 设备 Vendor ID 18D1 = Google -->
    <usb-device vendor-id="6353" />
</resources>
```

**步骤 3**：请求权限：

```kotlin
private fun requestUsbPermission(device: UsbDevice) {
    val intent = PendingIntent.getBroadcast(
        context, 0, Intent(ACTION_USB_PERMISSION), 
        PendingIntent.FLAG_IMMUTABLE
    )
    usbManager.requestPermission(device, intent)
}
```

---

### 4. 如何枚举所有已连接的 USB 设备并筛选目标？

**答案：**

```kotlin
val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
val connectedDevices: HashMap<String, UsbDevice> = usbManager.deviceList

for ((key, device) in connectedDevices) {
    // 筛选 ADB 设备 Google VID = 0x18D1 = 6353
    if (device.vendorId == 6353) {
        connectToDevice(device)
    }
    // 筛选 iPhone Apple VID = 0x05AC = 1452
    if (device.vendorId == 1452) {
        connectToiOSDevice(device)
    }
}
```

**加分项**：拔掉设备后 `UsbDevice` 引用仍然存在但 `openDevice` 会失败。必须每次从 `deviceList` 重新获取。

---

### 5. 平板同时需要 OTG 给手机供电 + USB-C 给自己充电。技术上怎么实现？

**答案：**

| 方案 | 原理 | 成本 | 稳定性 |
|------|------|------|:---:|
| **OTG Y 线缆** | Y 型线：USB-C 公头→平板 + USB-A 母头→设备 + Micro-USB 母头→充电器 | ₹200 | 中 |
| **USB-C DRP 模式** | USB-C 原生 Dual Role Power，同时 Host（数据）+ Sink（充电），需 SoC 支持 | 无 | 高 |
| **带供电的 USB Hub** | 有源 Hub → 手机 + 充电器，Hub 自供电，平板从 Hub 取电 | ₹1000 | 高 |

**关键**：选型阶段向方案商确认 **"是否支持 USB Host + Charging simultaneously"**。MTK 平台通常支持，高通部分低端芯片不支持。

---

### 6. `bulkTransfer()` vs `controlTransfer()` 有什么区别？

**答案：**

| 特性 | `bulkTransfer()` | `controlTransfer()` |
|------|-------------------|---------------------|
| 用途 | 大量数据传输 | 设备配置、命令、状态查询 |
| 速度 | 快 | 慢 |
| 可靠性 | CRC 校验 + 自动重试 | 握手确认 |
| 端点方向 | 仅 IN 或 OUT | 双向（SETUP + DATA + STATUS） |
| 超时 | 必填（毫秒） | 必填（毫秒） |

ADB 协议使用 bulk 传输通道，`A_WRTE` / `A_OKAY` 消息对。

---

### 7. USB 设备热插拔时系统如何通知应用？有哪些注册方式？

**答案：**

**动态注册**（推荐，能收 ATTACH + DETACH）：

```kotlin
val filter = IntentFilter().apply {
    addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
    addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
}
context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
```

**静态注册**（仅能收 ATTACHED，用于 App 未启动时自动唤醒）：

```xml
<receiver android:name=".UsbEventReceiver">
    <intent-filter>
        <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
    </intent-filter>
    <meta-data android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
        android:resource="@xml/device_filter" />
</receiver>
```

**关键差异**：静态注册只能收到 ATTACHED，DETACHED 必须动态注册。

---

## 进阶篇（8-14 题）

### 8. 如何通过 OTG 连接的 ADB 执行 Shell 命令？有几种实现方式？

**答案：**

**方式一**：ddmlib（推荐）

```kotlin
// implementation 'com.android.tools.ddms:ddmlib:31.4.2'
AndroidDebugBridge.initIfNeeded(false)
val bridge = AndroidDebugBridge.createBridge("adb", false)
val device = bridge.devices.first()
device.executeShellCommand("dumpsys batterystats", receiver)
```

优点：Java/Kotlin 原生调用，不依赖外部 adb 进程。缺点：依赖库 ~3MB，API 文档不全。

**方式二**：内嵌 adb 二进制 + ProcessBuilder

```kotlin
val process = ProcessBuilder(
    adbBinary.absolutePath, "shell", "dumpsys", "batterystats"
).start()
```

优点：完整的 adb 功能。缺点：架构兼容性（armv7/arm64/x86），阻塞式调用需要线程池。

**方式三**：自行实现 ADB 协议（高级，约 2000+ 行，仅在高度定制化时使用）。

---

### 9. 如何判断用户是否已在手机上点击"允许 USB 调试"？

**答案：**

```kotlin
when (device.state) {
    IDevice.DeviceState.ONLINE -> {
        // 已授权，可执行 shell 命令
    }
    IDevice.DeviceState.UNAUTHORIZED -> {
        // 手机正弹出授权对话框 → 平板 UI 提示"请在手机上点击允许"
        showAuthorizationPrompt()
    }
    IDevice.DeviceState.OFFLINE -> {
        // 设备离线或 ADB 服务未启动
    }
}
```

超时时间建议 30 秒，超时后提示重新插拔或检查 USB 调试开关。

---

### 10. 如何防止 App 在执行 USB 操作时因设备拔出而崩溃？

**答案：**

```kotlin
fun safeBulkTransfer(connection: UsbDeviceConnection, endpoint: UsbEndpoint, 
                      data: ByteArray, timeout: Int): Result<Int> {
    // 1. 每次操作前检查设备是否仍在 deviceList 中
    if (!usbManager.deviceList.containsKey(device.deviceName)) {
        cleanup()
        return Result.failure(UsbDisconnectedException())
    }
    // 2. 执行操作，捕获所有异常
    return try {
        val sent = connection.bulkTransfer(endpoint, data, data.size, timeout)
        if (sent >= 0) Result.success(sent)
        else Result.failure(UsbTransferException("Transfer returned $sent"))
    } catch (e: IOException) {
        cleanup()
        Result.failure(e)
    }
}
```

**核心防御**：每次操作前 `deviceList.containsKey()` 检查 + try-catch 包裹 + DETACHED 回调中清理资源 + 快速插拔的 debounce 处理。

---

### 11. 被检手机的 USB 调试关闭了，如何引导用户开启？不同品牌路径不同怎么办？

**答案：**

```kotlin
fun getUsbDebuggingGuide(brand: String): String = when (brand.lowercase()) {
    "samsung" -> "Settings > About Phone > Software Info > Tap 'Build Number' 7 times > Back > Developer Options > USB Debugging"
    "xiaomi", "redmi" -> "Settings > About Phone > Tap 'MIUI Version' 7 times > Additional Settings > Developer Options > USB Debugging (also enable 'USB Debugging Security Settings')"
    "oppo", "realme" -> "Settings > About Phone > Version > Tap 'Build Number' 7 times > System Settings > Developer Options > USB Debugging"
    "oneplus" -> "Settings > About Phone > Tap 'Build Number' 7 times > System > Developer Options > USB Debugging"
    else -> "Settings > About Phone > Tap 'Build Number' 7 times > System > Developer Options > USB Debugging"
}
```

**加分项**：小米手机的"USB 调试（安全设置）"——小米在标准 USB 调试之上还有一层安全限制，如果不开这个，第三方应用无法使用 ADB。

---

### 12. 平板通过 OTG 连接手机，如何判断是 Android 还是 iOS？

**答案：**

```kotlin
fun detectDeviceType(device: UsbDevice): DeviceType = when (device.vendorId) {
    1452 -> DeviceType.iOS       // Apple Inc. (0x05AC)
    6353 -> DeviceType.Android   // Google Inc. (0x18D1) - ADB mode
    1004 -> DeviceType.Android   // LG (0x03EC)
    1118 -> DeviceType.Android   // Samsung (0x04E8)
    else -> probeADB(device)     // 尝试 ADB 握手判断
}
```

**加分项**：iOS 正常模式下不暴露通用数据传输接口（USB 受限模式），只有 Recovery/DFU 模式才能通信。Apple VID 且无法通信 = 正常模式 iPhone。

---

### 13. `requestWait()` 和 `bulkTransfer()` 在线程安全和性能上的区别？

**答案：**

| 特性 | `requestWait()` | `bulkTransfer()` |
|------|----------------|-----------------|
| 同步/异步 | 异步（需配合 `UsbRequest`） | 同步阻塞 |
| CPU 效率 | 高（驱动层原生异步通知） | 低（忙等轮询） |
| 适用场景 | 高频小数据（持续监听设备状态） | 一次性请求响应 |

持续监控设备状态用 `requestWait()` + 独立线程；一次性查询用 `bulkTransfer()`。

---

### 14. 如何设计平板同时连接多台手机的检测架构？

**答案：**

```kotlin
class MultiDeviceInspector(private val usbManager: UsbManager) {
    private val sessions = ConcurrentHashMap<String, InspectionSession>()
    private val executor = Executors.newFixedThreadPool(
        min(Runtime.getRuntime().availableProcessors(), 4)
    )

    fun onDeviceAttached(device: UsbDevice) {
        val serial = device.serialNumber ?: device.deviceName
        sessions[serial] = InspectionSession(device, usbManager)
        executor.submit { sessions[serial]?.runInspection() }
    }
}
```

**关键点**：每设备独立 Session + 独立线程 + 有源 USB Hub（总线供电不够 4 台手机同时用）+ RecyclerView 每 Item 绑定一个 Session 的 LiveData。

---

## 实战篇（15-20 题）

### 15. 质检过程中平板锁屏了，USB 连接会断吗？怎么处理？

**答案：**

**会断。** 锁屏后系统可能关闭 USB Host 电源、杀死后台 App、进入 Doze 模式。

**解决**：

```kotlin
// 1. WakeLock 防止 CPU 休眠
val wakeLock = powerManager.newWakeLock(
    PowerManager.PARTIAL_WAKE_LOCK, "Inspection:UsbLock"
).apply { acquire(30 * 60 * 1000L) }

// 2. 禁用自动锁屏
window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

// 3. 前台 Service 保持进程存活
startForegroundService(Intent(this, UsbForegroundService::class.java))

// 4. 请求忽略电池优化
Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
    data = Uri.parse("package:$packageName")
}
```

---

### 16. 不同厂商 Android 手机的电池健康度读取方式不同，怎么处理兼容性？

**答案：**

```kotlin
fun getBatteryHealth(device: IDevice): BatteryInfo {
    val output = device.executeShellCommand("dumpsys batterystats")
    return when {
        output.contains("mSavedBatteryLevel") -> parseSamsungBattery(output)
        output.contains("Level:") -> parseXiaomiBattery(output)
        else -> parseStockBattery(output)
    }
}
```

**兼容性矩阵**：Google Pixel ✅ | Samsung ✅ | Xiaomi ⚠️ 部分限制权限 | OnePlus ✅ | vivo ⚠️ 返回值不完整 | iPhone ❌。

**加分项**：建立机型→dumpsys 格式映射表，灰度从 Top 10 机型开始覆盖。

---

### 17. USB Bulk Transfer 返回 -1 是什么原因？如何处理？

**答案：**

| 原因 | 触发条件 | 解决方案 |
|------|----------|----------|
| 设备拔出 | 中途拔掉 USB 线 | 监听 DETACHED，清理连接 |
| 端点忙 | 上次 transfer 没完成就发新请求 | 加同步锁 |
| 缓冲区溢出 | 数据超过 `endpoint.maxPacketSize` | 分包发送 |
| 设备无响应 | 手机卡死 | 超时后重试 1 次，仍失败提示重启 |
| 权限丢失 | 系统回收 USB 权限（极少） | 重新请求权限 |

---

### 18. 通过 ADB 如何获取被检手机的品牌、型号和 IMEI？

**答案：**

```kotlin
// 品牌型号
val brand = device.getProperty("ro.product.brand")       // "Samsung"
val model = device.getProperty("ro.product.model")       // "SM-S908B"
val manufacturer = device.getProperty("ro.product.manufacturer")
val androidVersion = device.getProperty("ro.build.version.release")

// IMEI
val output = device.executeShellCommand("dumpsys iphonesubinfo")
val imeiRegex = Regex("Device ID(?: is)?[=: ]*(\\d{15})")
val imeis = imeiRegex.findAll(output).map { it.groupValues[1] }.toList()
```

**加分项**：`ro.product.*` 可被 root 后修改（Magisk Hide Props），回收场景需交叉校验 `ro.product.model` + `ro.product.board` + `ro.boot.hardware`。

---

### 19. 如何通过 ADB 给被检手机发送触摸指令来测试屏幕？

**答案：**

```kotlin
class TouchScreenTester(private val device: IDevice) {
    fun tap(x: Int, y: Int) {
        device.executeShellCommand("input tap $x $y")
    }

    fun swipe(x1: Int, y1: Int, x2: Int, y2: Int, duration: Int = 300) {
        device.executeShellCommand("input swipe $x1 $y1 $x2 $y2 $duration")
    }

    fun gridTest(rows: Int = 4, cols: Int = 7): List<TouchResult> {
        // 读取屏幕分辨率 → 计算网格坐标 → 逐格点击 → 验证触摸事件
        val displayInfo = device.executeShellCommand("dumpsys window displays")
        val (width, height) = parseResolution(displayInfo)
        // ... 网格遍历点击测试
    }
}
```

**加分项**：`input tap` 只能做功能级测试，死区检测需通过 `getevent` 读取触摸驱动层原始上报事件做对比。

---

### 20. 设计质检 App 的 USB 通信层架构，画出关键类和职责。

**答案：**

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│  InspectionActivity / InspectionFragment         │
├─────────────────────────────────────────────────┤
│               ViewModel Layer                    │
│  InspectionViewModel                             │
│  └── StateFlow<InspectionState>                  │
├─────────────────────────────────────────────────┤
│              Use Case / Domain                   │
│  InspectionOrchestrator                          │
│  └── List<InspectionStep>                        │
│  InspectionStep (sealed): ReadIMEI, ReadBattery,  │
│    ReadStorage, TestTouch, TestCamera, etc.      │
├─────────────────────────────────────────────────┤
│            Device Communication Layer            │
│  DeviceConnector (interface)                     │
│  ├── AdbDeviceConnector (ddmlib)                 │
│  └── CustomUsbConnector (UsbManager)             │
├─────────────────────────────────────────────────┤
│              USB Monitor Layer                   │
│  UsbEventMonitor (ATTACH/DETACH)                 │
│  UsbPermissionManager                            │
└─────────────────────────────────────────────────┘
```

**关键设计原则**：设备抽象（接口屏蔽协议差异）、Step 隔离（单步失败不影响后续）、状态驱动（StateFlow 全流程可观测）、断点续传（每步完成后持久化检查点）、超时重试（每步独立超时，最多重试 1 次）。

---

## 面试评分参考

| 级别 | 达标线 | 评价 |
|:---:|:---:|------|
| 初级 | 1-7 题全对 | 能胜任基础 USB 功能开发 |
| 中级 | 8-14 题答出 5 题以上 | 能独立设计检测模块 |
| 高级 | 15-20 题答出 4 题以上 + 有真实踩坑经验 | 能主导架构设计 + 异常处理 |
