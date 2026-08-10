# 印度Dobara 设计规范文档

> 本文档基于"印度Dobara"设计系统生成，供开发者在 Code 模式下按此风格进行前端开发。

---

## 1. 色彩系统

### 1.1 品牌色 — Green（主色）

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-green-50` | `#e8f8f1` | 最浅背景 / 悬停高亮 |
| `--dobara-green-100` | `#c6efdc` | 浅背景 |
| `--dobara-green-200` | `#9de3c3` | 标签 / Badge 背景 |
| `--dobara-green-300` | `#6ed4a7` | 辅助色 |
| `--dobara-green-400` | `#3fc68b` | Hover 状态 |
| `--dobara-green-500` | `#00b86e` | **主色 (Primary)** — 按钮、链接、强调色 |
| `--dobara-green-600` | `#009b5c` | Pressed 状态 |
| `--dobara-green-700` | `#007e4a` | 深色强调 |
| `--dobara-green-800` | `#006138` | 深色背景文字 |
| `--dobara-green-900` | `#004426` | 最深色 / 文本 |

### 1.2 强调色 — Orange

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-orange-50` | `#fff3eb` | 最浅背景 |
| `--dobara-orange-100` | `#ffe0cc` | 浅背景 |
| `--dobara-orange-200` | `#ffc9a3` | 标签背景 |
| `--dobara-orange-300` | `#ffaf75` | 辅助色 |
| `--dobara-orange-400` | `#ff9547` | Hover 状态 |
| `--dobara-orange-500` | `#ff7b1a` | **强调主色** — CTA 按钮、促销标签、重要提示 |
| `--dobara-orange-600` | `#e0680f` | Pressed 状态 |
| `--dobara-orange-700` | `#bf5508` | 深色强调 |
| `--dobara-orange-800` | `#9e4204` | 深色背景文字 |
| `--dobara-orange-900` | `#7d3000` | 最深色 |

### 1.3 语义色

**Success（成功）**

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-success-50` | `#ecfdf5` | 成功背景 |
| `--dobara-success-500` | `#10b981` | 成功主色 |
| `--dobara-success-900` | `#064e3b` | 成功深色文字 |

完整色阶：`50` → `100` → `200` → `300` → `400` → `500` → `600` → `700` → `800` → `900`

**Info（信息）**

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-info-50` | `#eff6ff` | 信息背景 |
| `--dobara-info-500` | `#3b82f6` | 信息主色 |
| `--dobara-info-900` | `#1e3a8a` | 信息深色文字 |

**Warning（警告）**

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-warning-50` | `#fffbeb` | 警告背景 |
| `--dobara-warning-500` | `#f59e0b` | 警告主色 |
| `--dobara-warning-900` | `#78350f` | 警告深色文字 |

**Error（错误）**

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-error-50` | `#fef2f2` | 错误背景 |
| `--dobara-error-500` | `#ef4444` | 错误主色 |
| `--dobara-error-900` | `#7f1d1d` | 错误深色文字 |

### 1.4 文本色

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-text-50` | `#f9fafb` | 深色背景下文本 |
| `--dobara-text-100` | `#f3f4f6` | 深色背景下辅助文本 |
| `--dobara-text-200` | `#e5e7eb` | Disabled 文本 |
| `--dobara-text-300` | `#d1d5db` | 占位符文本 |
| `--dobara-text-400` | `#9ca3af` | 次要文本 |
| `--dobara-text-500` | `#6b7280` | 正文文本 |
| `--dobara-text-600` | `#4b5563` | 强调正文 |
| `--dobara-text-700` | `#374151` | 小标题 |
| `--dobara-text-800` | `#1f2937` | 标题 |
| `--dobara-text-900` | `#111827` | 主标题 / 高强调文本 |

### 1.5 表面色（Surface）

| Token | Hex | 用途 |
|---|---|---|
| `--dobara-surface-50` | `#fafbf9` | 页面背景 (Surface) |
| `--dobara-surface-100` | `#f5f7f3` | 低层级容器背景 |
| `--dobara-surface-200` | `#edf0ea` | 卡片 / 容器背景 |
| `--dobara-surface-300` | `#e0e4dc` | 高亮容器背景 |
| `--dobara-surface-400` | `#cdd3c7` | 边框 / 分割线 |
| `--dobara-surface-500` | `#b8bfb0` | 强分割线 |

**Surface 语义映射**

| Token | Hex | 说明 |
|---|---|---|
| `--color-surface` | `#fafbf9` | 最外层页面背景 |
| `--color-surface-container-low` | `#f5f7f3` | 低浮雕容器 |
| `--color-surface-container` | `#edf0ea` | 标准容器（Card / Sheet） |
| `--color-surface-container-high` | `#e0e4dc` | 高浮雕容器（Dialog / Popover） |
| `--color-on-surface` | `#111827` | 表面上的文本色 |

### 1.6 暗色模式

| Token | Hex | 用途 |
|---|---|---|
| `--dark-bg` | `#1a1f19` | 暗色模式页面背景 |
| `--dark-color-primary` | `#ff9547` | 暗色模式主色（Orange） |
| `--dark-color-primary-hover` | `#ffaf75` | 暗色模式主色悬停 |
| `--dark-primary-hover` | `#3fc68b` | 暗色模式辅助悬停 |
| `--dark-color-primary-container` | `#0a2e1a` | 暗色模式主色容器背景 |
| `--dark-color-on-primary-container` | `#6ed4a7` | 暗色模式主色容器文字 |
| `--dark-color-foreground` | `#f0f2ee` | 暗色模式前景文字 |
| `--dark-muted` | `#8a9385` | 暗色模式次要文字 |
| `--dark-color-border` | `#3a3f38` | 暗色模式边框 |
| `--dark-error-container` | `#3b1818` | 暗色模式错误容器 |

---

## 2. 字体系统

### 2.1 字体族

| Token | 值 | 适用场景 |
|---|---|---|
| `--font-display` | `'Poppins', sans-serif` | Hero 大标题、首页核心文案 |
| `--font-heading` | `'Poppins', sans-serif` | H1-H4 标题 |
| `--font-body` | `'Inter', sans-serif` | 正文、段落、表单 |
| `--font-mono` | `'JetBrains Mono', monospace` | 代码块、技术数据 |
| `--font-family-base` | `'Inter', sans-serif` | 全局默认字体 |

### 2.2 字号

| Token | 值 | 用途 |
|---|---|---|
| `--font-size-display` | `56px` | 超大标题（Hero） |
| `--font-size-h1` | `40px` | 一级标题 |
| `--font-size-h2` | `32px` | 二级标题 |
| `--font-size-h3` | `24px` | 三级标题 |
| `--font-size-h4` | `20px` | 四级标题 |
| `--font-size-lead` | `18px` | 引导段落 |
| `--font-size-body` | `16px` | 正文 |
| `--font-size-caption` | `12px` | 说明文字 / 脚注 |
| `--font-size-eyebrow` | `11px` | 标签 / 眉题（全大写） |
| `--font-size-mono` | `14px` | 代码文字 |

### 2.3 字重

| Token | 值 |
|---|---|
| `--font-weight-display` | `700` |
| `--font-weight-h1` | `700` |
| `--font-weight-h2` | `600` |
| `--font-weight-h3` | `600` |
| `--font-weight-h4` | `600` |
| `--font-weight-body` | `400` |
| `--font-weight-lead` | `400` |
| `--font-weight-caption` | `400` |
| `--font-weight-eyebrow` | `600` |
| `--font-weight-mono` | `400` |

### 2.4 行高

| Token | 值 |
|---|---|
| `--line-height-display` | `1.1` |
| `--line-height-h1` | `1.2` |
| `--line-height-h2` | `1.25` |
| `--line-height-h3` | `1.3` |
| `--line-height-h4` | `1.4` |
| `--line-height-lead` | `1.7` |
| `--line-height-body` | `1.6` |
| `--line-height-caption` | `1.5` |
| `--line-height-eyebrow` | `1.4` |
| `--line-height-mono` | `1.6` |

---

## 3. 间距系统

| Token | 值 | 用途 |
|---|---|---|
| `--space-1` | `4px` | 图标与文字间距、紧凑内边距 |
| `--space-2` | `8px` | 组件内间距 |
| `--space-3` | `12px` | 列表项间距 |
| `--space-4` | `16px` | 标准内边距 / 卡片 padding |
| `--space-5` | `24px` | 段落间距 / Section 内间距 |
| `--space-6` | `32px` | 区块间距 |
| `--space-7` | `48px` | Section 间距 |
| `--space-8` | `64px` | 大区块间距 / 页面级留白 |

---

## 4. 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | `6px` | 小元素（Badge / Tag / 小按钮） |
| `--radius-md` | `8px` | 按钮 / 输入框 / 卡片 |
| `--radius-lg` | `12px` | 大卡片 / Modal |
| `--radius-xl` | `16px` | 大容器 / 图片 |
| `--radius-full` | `9999px` | 圆形元素 / Pill 按钮 / Avatar |

---

## 5. 阴影

| Token | 值 | 用途 |
|---|---|---|
| `--shadow-1` | `0px 1px 2px 0px rgba(0,0,0,0.06)` | 卡片 |
| `--shadow-2` | `0px 4px 8px 0px rgba(0,0,0,0.08)` | 卡片悬停 |
| `--shadow-3` | `0px 8px 24px 0px rgba(0,0,0,0.12)` | 浮动元素（Dropdown / Tooltip） |
| `--shadow-4` | `0px 16px 40px 0px rgba(0,0,0,0.16)` | 模态框 |
| `--shadow-5` | `0px 24px 60px 0px rgba(0,0,0,0.20)` | 覆盖层 / Drawer |

---

## 6. 尺寸规范

### 按钮

| Token | 值 | 用途 |
|---|---|---|
| `--size-button-sm` | `32px` | 小按钮 / 表格操作 |
| `--size-button-md` | `40px` | 标准按钮 |
| `--size-button-lg` | `48px` | 大按钮 / CTA |

### 输入框

| Token | 值 |
|---|---|
| `--size-input` | `40px` |

### 图标

| Token | 值 | 用途 |
|---|---|---|
| `--size-icon-sm` | `16px` | 行内图标 / 列表图标 |
| `--size-icon-md` | `20px` | 标准图标 |
| `--size-icon-lg` | `24px` | 大图标 / 导航图标 |

---

## 7. CSS 变量快速引用

将以下代码粘贴到项目的全局 CSS 文件中即可使用：

```css
:root {
  /* === 主色 Green === */
  --color-primary: #00b86e;
  --color-primary-hover: #3fc68b;
  --color-primary-pressed: #009b5c;
  --color-primary-light: #e8f8f1;

  /* === 强调色 Orange === */
  --color-accent: #ff7b1a;
  --color-accent-hover: #ff9547;
  --color-accent-light: #fff3eb;

  /* === 语义色 === */
  --color-success: #10b981;
  --color-success-light: #ecfdf5;
  --color-info: #3b82f6;
  --color-info-light: #eff6ff;
  --color-warning: #f59e0b;
  --color-warning-light: #fffbeb;
  --color-error: #ef4444;
  --color-error-light: #fef2f2;

  /* === 文本色 === */
  --color-text-primary: #111827;
  --color-text-secondary: #374151;
  --color-text-body: #6b7280;
  --color-text-muted: #9ca3af;
  --color-text-placeholder: #d1d5db;
  --color-text-disabled: #e5e7eb;
  --color-text-inverse: #f9fafb;

  /* === 表面色 === */
  --color-bg: #fafbf9;
  --color-surface: #fafbf9;
  --color-surface-low: #f5f7f3;
  --color-surface-container: #edf0ea;
  --color-surface-high: #e0e4dc;
  --color-border: #cdd3c7;
  --color-border-light: #b8bfb0;

  /* === 字体 === */
  --font-display: 'Poppins', sans-serif;
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === 字号 === */
  --text-display: 56px;
  --text-h1: 40px;
  --text-h2: 32px;
  --text-h3: 24px;
  --text-h4: 20px;
  --text-lead: 18px;
  --text-body: 16px;
  --text-caption: 12px;
  --text-eyebrow: 11px;
  --text-mono: 14px;

  /* === 字重 === */
  --weight-bold: 700;
  --weight-semibold: 600;
  --weight-regular: 400;

  /* === 行高 === */
  --leading-display: 1.1;
  --leading-heading: 1.2;
  --leading-body: 1.6;
  --leading-caption: 1.5;

  /* === 间距 === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* === 圆角 === */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* === 阴影 === */
  --shadow-card: 0px 1px 2px 0px rgba(0,0,0,0.06);
  --shadow-card-hover: 0px 4px 8px 0px rgba(0,0,0,0.08);
  --shadow-float: 0px 8px 24px 0px rgba(0,0,0,0.12);
  --shadow-modal: 0px 16px 40px 0px rgba(0,0,0,0.16);
  --shadow-overlay: 0px 24px 60px 0px rgba(0,0,0,0.20);

  /* === 尺寸 === */
  --button-sm: 32px;
  --button-md: 40px;
  --button-lg: 48px;
  --input-height: 40px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
}

/* === 暗色模式 === */
[data-theme="dark"],
.dark {
  --color-bg: #1a1f19;
  --color-primary: #ff9547;
  --color-primary-hover: #ffaf75;
  --color-accent: #3fc68b;
  --color-text-primary: #f0f2ee;
  --color-text-body: #8a9385;
  --color-border: #3a3f38;
}
```

---

## 8. Tailwind CSS 配置

如果项目使用 Tailwind CSS，可将以下配置合并到 `tailwind.config.js`：

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f8f1',
          100: '#c6efdc',
          200: '#9de3c3',
          300: '#6ed4a7',
          400: '#3fc68b',
          500: '#00b86e',
          600: '#009b5c',
          700: '#007e4a',
          800: '#006138',
          900: '#004426',
        },
        accent: {
          50: '#fff3eb',
          100: '#ffe0cc',
          200: '#ffc9a3',
          300: '#ffaf75',
          400: '#ff9547',
          500: '#ff7b1a',
          600: '#e0680f',
          700: '#bf5508',
          800: '#9e4204',
          900: '#7d3000',
        },
        surface: {
          DEFAULT: '#fafbf9',
          low: '#f5f7f3',
          container: '#edf0ea',
          high: '#e0e4dc',
        },
      },
      fontFamily: {
        display: ["'Poppins'", 'sans-serif'],
        heading: ["'Poppins'", 'sans-serif'],
        body: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['32px', { lineHeight: '1.25', fontWeight: '600' }],
        h3: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        lead: ['18px', { lineHeight: '1.7' }],
        body: ['16px', { lineHeight: '1.6' }],
        caption: ['12px', { lineHeight: '1.5' }],
        eyebrow: ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
        mono: ['14px', { lineHeight: '1.6' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0px 1px 2px 0px rgba(0,0,0,0.06)',
        'card-hover': '0px 4px 8px 0px rgba(0,0,0,0.08)',
        float: '0px 8px 24px 0px rgba(0,0,0,0.12)',
        modal: '0px 16px 40px 0px rgba(0,0,0,0.16)',
        overlay: '0px 24px 60px 0px rgba(0,0,0,0.20)',
      },
    },
  },
};
```

---

## 9. Google Fonts 引入

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
```

或者通过 CSS `@import`：

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&family=Poppins:wght@400;600;700&display=swap');
```

---

## 10. 设计原则

1. **主色驱动**：以 Green (`#00b86e`) 为主色调，Orange (`#ff7b1a`) 作为强调 / CTA 色，两者形成自然-活力的对比
2. **温和表面**：Surface 色系带轻微暖绿底调，区别于纯灰，营造自然、有机的视觉感受
3. **现代字体**：Poppins 用于标题带来几何感与现代感，Inter 用于正文确保可读性
4. **层级阴影**：5 级阴影从浅到深对应不同的 UI 层级（卡片 → 浮动 → 模态 → 遮罩）
5. **暗色模式**：暗色模式下主色切换为 Orange，Green 退居辅助色，背景采用深绿色底调
