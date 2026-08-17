# Scout System · Photo Edit Toolkit

整合多個圖像工具的統一工作台，由 **Scout System** 開發維護。

## 內建工具

| 工具 | 路徑 | 說明 |
|------|------|------|
| **SVG 向量轉換** | `/svg` | PNG/JPEG → SVG，中心線 / 輪廓提取 |
| **去背 + 換背景** | `/background` | 一鍵去背，透明 / 純色 / 漸層 / 背景圖 |
| **QR Code / 條碼** | `/qrcode` | 高度自訂 QR 與條碼，多模板、SVG/PNG 導出 |
| **DPI / 列印尺寸** | `/dpi` | 設定 DPI 與實際列印尺寸，匯出含 pHYs 的 PNG |

## 來源專案

本倉庫整合自：

- [SVG-converter](https://github.com/playerkousas-rgb/SVG-converter)
- [backgound](https://github.com/playerkousas-rgb/backgound)
- [Qrcode](https://github.com/playerkousas-rgb/Qrcode)
- DPI Maker（原 `dpi_maker` 倉庫無法存取，已於本專案重新實作）

## 開發

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 技術棧

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Framer Motion
- react-router-dom
- qr-code-styling / jsbarcode

## Copyright

```
© 2026 Scout System. All rights reserved.
```

本工具集由 Scout System 開發與維護，僅供童軍及相關教育用途使用。
