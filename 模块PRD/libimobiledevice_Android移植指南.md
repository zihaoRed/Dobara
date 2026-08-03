# libimobiledevice Android 移植实现指南

> 目标：在 Android 质检平板上通过 OTG 连接 iPhone，读取 IMEI、电池健康度、激活锁状态等数据

---

## 一、架构总览

```
┌─────────────────────────────────────────┐
│              质检 App (Kotlin/Java)       │
│  ┌───────────────────────────────────┐  │
│  │      JNI / kotlin-native 桥接      │  │
│  └──────────────┬────────────────────┘  │
│                 │                       │
│  ┌──────────────▼────────────────────┐  │
│  │   libimobiledevice-jni.so         │  │
│  │   (自研 JNI 封装层，约 500 行 C)    │  │
│  └──────────────┬────────────────────┘  │
│                 │                       │
│  ┌──────────────▼────────────────────┐  │
│  │   libimobiledevice-1.0.so         │  │
│  │   (核心库：lockdown/diagnostics/  │  │
│  │    mobilebackup/syslog_relay 等)   │  │
│  └──────────────┬────────────────────┘  │
│                 │                       │
│  ┌──────────────▼────────────────────┐  │
│  │  依赖链：                          │  │
│  │  libusb-1.0.so (USB 通信)         │  │
│  │  libplist-2.0.so (plist 解析)     │  │
│  │  libssl.so / libcrypto.so (加密)   │  │
│  └────────────────────────────────────┘  │
│                 │                       │
│  ┌──────────────▼────────────────────┐  │
│  │   Android USB Host API             │  │
│  │   (UsbManager / UsbDeviceConnection)│  │
│  └──────────────┬────────────────────┘  │
│                 │                       │
│              OTG 线                      │
│                 │                       │
│            ┌────▼────┐                  │
│            │  iPhone  │                  │
│            └─────────┘                  │
└─────────────────────────────────────────┘
```

关键点：libimobiledevice 底层走的是 **libusb**，而 libusb 在 Android 上需要通过 **UsbManager API** 与 USB 设备通信，不能直接操作内核 usbfs。这是整个移植的核心难点。

---

## 二、依赖库交叉编译

### 2.1 环境准备

```bash
# 安装 Android NDK
export ANDROID_NDK_HOME=$HOME/Android/Sdk/ndk/26.1.10909125
export TOOLCHAIN=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64

# 目标架构（arm64-v8a 是主流）
export TARGET=aarch64-linux-android
export API=26  # Android 8.0+
export CC=$TOOLCHAIN/bin/$TARGET$API-clang
export CXX=$TOOLCHAIN/bin/$TARGET$API-clang++
```

### 2.2 编译顺序和关键参数

按依赖顺序编译 4 个库，总工程量约 **3-5 天**（含踩坑）：

#### ① libusb（USB 通信层）

这是最关键的步骤。Android 版 libusb 需要通过 `UsbManager` 而非直接操作 `/dev/bus/usb`：

```bash
git clone https://github.com/libusb/libusb.git
cd libusb
./configure \
  --host=$TARGET \
  --prefix=/tmp/ios-inspect/install \
  --disable-udev \
  --enable-shared \
  --disable-static
make -j$(nproc) && make install
```

**注意**：标准 libusb 在 Android 上调用 `open("/dev/bus/usb/001/003")` 会因为没有 root 权限失败。需要在 JNI 层拦截 libusb 的设备打开操作，在初始化时注入 Android `UsbDeviceConnection` 的文件描述符：

```c
// JNI 层关键代码：注入已打开的 USB 设备 fd
int fd = connection.getFileDescriptor();  // UsbDeviceConnection
// 让 libusb 使用这个 fd 而非自己 open()
libusb_set_device_fd(ctx, fd);
```

这部分需要修改 libusb 源码或自实现一个 thin wrapper，是整个移植中最容易出 bug 的地方。

#### ② libplist（Apple Property List 解析）

```bash
git clone https://github.com/libimobiledevice/libplist.git
cd libplist
./autogen.sh
./configure \
  --host=$TARGET \
  --prefix=/tmp/ios-inspect/install \
  --without-cython
make -j$(nproc) && make install
```

#### ③ OpenSSL（加密，lockdown 配对需要）

```bash
git clone https://github.com/openssl/openssl.git
cd openssl
./Configure android-arm64 \
  -D__ANDROID_API__=$API \
  --prefix=/tmp/ios-inspect/install \
  shared
make -j$(nproc) && make install
```

#### ④ libimobiledevice（核心库）

```bash
git clone https://github.com/libimobiledevice/libimobiledevice.git
cd libimobiledevice
./autogen.sh
./configure \
  --host=$TARGET \
  --prefix=/tmp/ios-inspect/install \
  PKG_CONFIG_PATH=/tmp/ios-inspect/install/lib/pkgconfig
make -j$(nproc) && make install
```

---

## 三、JNI 封装层

编译完成后，需要写一个 JNI 封装层（约 500 行 C 代码），暴露以下函数给 Kotlin 调用：

```kotlin
object IosInspector {
    init {
        System.loadLibrary("imobiledevice-jni")
    }

    // 配对（首次连接）
    external fun pairDevice(udid: String): PairingResult
    
    // 验证配对状态
    external fun validatePairing(udid: String): Boolean
    
    // 读取设备信息（IMEI/序列号/型号/颜色/存储/iOS版本）
    external fun getDeviceInfo(udid: String): IosDeviceInfo
    
    // 读取电池健康度 + 充电循环次数
    external fun getBatteryHealth(udid: String): IosBatteryInfo
    
    // 检查激活锁状态（Find My / iCloud）
    external fun getActivationLockStatus(udid: String): Boolean
    
    // 获取设备列表（已连接且配对的设备 UDID）
    external fun getConnectedDevices(): Array<String>
}
```

JNI 实现的核心逻辑（C 侧）：

```c
// 读取电池信息（最关键的函数）
JNIEXPORT jobject JNICALL
Java_com_bott_inspector_IosInspector_getBatteryHealth(
    JNIEnv *env, jclass clazz, jstring udid) {
    
    const char *c_udid = (*env)->GetStringUTFChars(env, udid, NULL);
    
    // 1. 创建 lockdown 客户端
    lockdownd_client_t client = NULL;
    idevice_t device = NULL;
    idevice_new_with_options(&device, c_udid, IDEVICE_LOOKUP_USBMUX);
    lockdownd_client_new_with_handshake(device, &client, "ios-inspector");
    
    // 2. 请求诊断数据
    plist_t diagnostics = NULL;
    lockdownd_get_value(client, "com.apple.mobile.diagnostics", NULL, &diagnostics);
    
    // 3. 调用 MobileGestalt 查询
    CFStringRef keys[] = {
        CFSTR("BatteryCurrentCapacity"),   // 当前满充容量 mAh
        CFSTR("BatteryDesignCapacity"),    // 设计容量 mAh
        CFSTR("BatteryCycleCount")         // 循环次数
    };
    // 获取并解析返回的 plist...
    
    // 4. 计算健康度
    int current = /* 从 plist 解析 */;
    int design = /* 从 plist 解析 */;
    float health = (float)current / design * 100.0f;
    
    // 5. 构造返回的 Java 对象
    // ...
    
    lockdownd_client_free(client);
    idevice_free(device);
    (*env)->ReleaseStringUTFChars(env, udid, c_udid);
    return result;
}
```

---

## 四、Android App 集成

### 4.1 项目结构

```
app/
├── src/main/
│   ├── java/com/bott/inspector/
│   │   ├── IosInspector.kt          # Kotlin 接口
│   │   ├── UsbDeviceManager.kt      # USB 权限 + 设备发现
│   │   └── IosInspectionStep.kt     # iOS 检测步骤
│   └── jniLibs/
│       ├── arm64-v8a/
│       │   ├── libimobiledevice-jni.so   # 自研 JNI
│       │   ├── libimobiledevice-1.0.so
│       │   ├── libplist-2.0.so
│       │   ├── libusb-1.0.so
│       │   ├── libssl.so
│       │   └── libcrypto.so
│       └── armeabi-v7a/              # 如需 32 位
│           └── (同上)
```

### 4.2 USB 设备检测 + 权限请求

```kotlin
class UsbDeviceManager(private val usbManager: UsbManager) {
    
    fun findIosDevice(): UsbDevice? {
        return usbManager.deviceList.values.firstOrNull { device ->
            // Apple Vendor ID = 0x05AC = 1452
            device.vendorId == 1452
        }
    }
    
    fun requestPermission(device: UsbDevice) {
        val intent = PendingIntent.getBroadcast(
            context, 0,
            Intent(ACTION_USB_PERMISSION),
            PendingIntent.FLAG_IMMUTABLE
        )
        usbManager.requestPermission(device, intent)
    }
    
    fun getDeviceFd(device: UsbDevice): Int {
        val connection = usbManager.openDevice(device)
            ?: throw IOException("Cannot open USB device")
        val claimed = connection.claimInterface(
            device.getInterface(0), true
        )
        // 返回原生 fd 给 JNI 层
        return connection.fileDescriptor
    }
}
```

### 4.3 iOS 设备检测流程

```kotlin
fun inspectIosDevice(): IosInspectionResult {
    // 1. 检测设备
    val device = usbManager.findIosDevice() 
        ?: return IosInspectionResult.Error("未检测到 iOS 设备")
    
    // 2. 拿权限 + 获取 fd
    usbManager.requestPermission(device)
    val fd = usbManager.getDeviceFd(device)
    
    // 3. 获取 UDID + 配对
    val udid = IosInspector.getConnectedDevices().firstOrNull()
        ?: return IosInspectionResult.Error("设备未响应，请确认已解锁并点击'信任'")
    IosInspector.pairDevice(udid)
    
    // 4. 读取各项数据
    val deviceInfo = IosInspector.getDeviceInfo(udid)
    val battery = IosInspector.getBatteryHealth(udid)
    val iCloudLocked = IosInspector.getActivationLockStatus(udid)
    
    return IosInspectionResult(
        imei = deviceInfo.imei,
        model = deviceInfo.model,
        iosVersion = deviceInfo.iosVersion,
        storageTotal = deviceInfo.storageTotal,
        batteryHealth = battery.health,
        batteryCycleCount = battery.cycleCount,
        iCloudLocked = iCloudLocked,
        // 以下需要店员手动 + 拍照
        // screenStatus, sensors, camera, buttons...
    )
}
```

---

## 五、能获取的数据清单

| 数据 | 接口 | 可靠性 |
|------|------|:---:|
| UDID（设备唯一标识） | `idevice_get_udid()` | ✅ |
| 设备名称、型号 | `lockdownd_get_value("DeviceName")` | ✅ |
| IMEI | `lockdownd_get_value("InternationalMobileEquipmentIdentity")` | ✅ |
| 序列号 | `lockdownd_get_value("SerialNumber")` | ✅ |
| iOS 版本 | `lockdownd_get_value("ProductVersion")` | ✅ |
| 存储总容量/可用 | `lockdownd_get_value("TotalDiskUsage")` 等 | ✅ |
| 设备颜色 | `lockdownd_get_value("DeviceColor")` | ✅ |
| **电池当前容量** | `MobileGestalt.BatteryCurrentCapacity` | ✅ |
| **电池设计容量** | `MobileGestalt.BatteryDesignCapacity` | ✅ |
| **充电循环次数** | `MobileGestalt.BatteryCycleCount` | ✅ |
| **激活锁状态** | `lockdownd_get_value("ActivationState")` | ✅ |
| 是否为翻新机 | `lockdownd_get_value("RefurbishedDevice")` | ⚠️ 部分版本 |
| WiFi / 蓝牙 MAC | `lockdownd_get_value("WiFiAddress")` | ✅ |
| 已安装 App 列表 | `misagent` + `installation_proxy` | ✅ |
| 屏幕/摄像头/传感器 | — | ❌ |
| 非原厂检测 | — | ❌ |

---

## 六、分工边界：厂商做什么 vs 我们做什么

### 6.1 平板设备厂商（OEM/ODM）负责

| 类别 | 要求 | 验收标准 |
|------|------|----------|
| **USB Host 硬件** | 至少 1 个 USB-A Host 接口（或 USB-C 支持 OTG），支持对外 5V/500mA 供电 | 插上 iPhone/Android 手机能被平板识别到 USB 设备 |
| **OTG + 充电共存** | 要么 USB-C DRP 同时 Host+充电，要么提供 OTG Y 线方案 | 质检过程中平板电量不会因 OTG 供电被检设备而耗尽 |
| **系统版本** | Android 12+，**不需要 root** | App 可通过 `UsbManager` API 正常获取设备列表和权限 |
| **系统库** | 预置 libusb-1.0.so 或至少保证 `/dev/bus/usb` 可被 App 通过 UsbManager 访问 | JNI 能拿到 `UsbDeviceConnection.fileDescriptor` |
| **Kiosk Mode** | 支持单应用锁定模式，限制系统设置、通知栏、导航栏的访问 | 店员无法退出质检 App |
| **MDM 支持** | 支持远程应用更新、远程锁定、远程擦除 | 可通过 MDM 平台管理所有门店平板 |
| **存储加密** | 全盘加密（Android FBE） | 平板丢失后质检数据不可被读取 |
| **USB 口可靠性** | USB 母座插拔寿命 ≥ 30,000 次 | 日均 30 次插拔，使用 ≥ 3 年 |
| **兼容性测试** | 厂商提供至少 5 款主流 iPhone（12-16）+ 5 款主流 Android（Samsung/Xiaomi/OnePlus）的 OTG 连接兼容性报告 | 插上能识别、能通信 |

**总结：厂商提供硬件 + 标准 Android 系统，不需要定制 ROM，不需要 root。**

### 6.2 我们自己（软件开发团队）负责

| 类别 | 工作内容 | 产出 |
|------|----------|------|
| **libimobiledevice 编译** | 交叉编译 libusb + libplist + openssl + libimobiledevice 四个 C 库到 Android arm64-v8a | 5 个 .so 文件 |
| **JNI 封装层** | 写 ~500 行 C 代码，封装配对/设备信息/电池/激活锁等函数为 JNI 接口，解决 Android 上 libusb fd 注入问题 | `libimobiledevice-jni.so` |
| **Android App 集成** | 在质检 App 中新增 iOS 设备检测模块：USB 设备识别（Apple VID 0x05AC）→ 配对 → 读取数据 → 返回结果 | `IosInspector.kt` + `UsbDeviceManager.kt` |
| **异常处理** | 未解锁提示（"请在 iPhone 上点击'信任此电脑'"）、锁屏超时提示、设备拔出崩溃防御、快速插拔去抖 | 异常处理代码 |
| **端到端测试** | 至少覆盖：iPhone 12/13/14/15/16 × iOS 16/17/18 的 10 种组合 + 锁屏/不锁屏/Find My 开启/关闭场景 | 测试报告 |
| **CI/CD 集成** | .so 文件的版本管理、多架构打包（arm64-v8a + armeabi-v7a）、App Bundle 分发 | 构建脚本 |
| **持续适配** | 每个 iOS 大版本更新后回归测试，跟进 libimobiledevice 上游更新 | 维护计划 |

### 6.3 一句话分工

> **厂商：给我一台能插 OTG、能装 App 的标准 Android 12+ 平板，不用 root，不用定制 ROM。**
> **我们：剩下的所有软件层面的东西——交叉编译、JNI、App 集成、测试、维护——全是我们的活。**

---

## 七、工程时间估算（我们的工作量）

| 阶段 | 工作内容 | 预计时间 |
|------|----------|:---:|
| 交叉编译 | libusb + libplist + openssl + libimobiledevice 四个库 | 3-5 天 |
| USB fd 注入 | 解决 Android 上 libusb 不能直接 open /dev/bus/usb 的问题 | 1-2 天 |
| JNI 封装 | 写 Kotlin ↔ C 桥接层 | 2-3 天 |
| App 集成 | 质检 App 中 iOS 检测步骤 + UI | 2-3 天 |
| 兼容测试 | iPhone SE/12/13/14/15 + iOS 15/16/17/18 组合 | 3-5 天 |
| **总计** | | **11-18 天** |

前提：有一个熟悉 JNI/NDK 的工程师。如果团队没有 C/NDK 经验的新手，时间翻倍。

---

## 八、替代方案：不编译直接用 libimobiledevice

如果你的平板可以 root 或者接受用 adb 命令：

```bash
# 将预编译的 Linux arm64 二进制 push 到平板
adb push libimobiledevice-arm64 /data/local/tmp/
adb shell chmod +x /data/local/tmp/ideviceinfo
adb shell /data/local/tmp/ideviceinfo -s
```

但这条路在非 root 平板上几乎不可行——一是 `/data/local/tmp` 不保证可执行，二是 libusb 需要 root 才能访问 `/dev/bus/usb`。

**JNI + libusb fd 注入是唯一的 Production 级方案。**
