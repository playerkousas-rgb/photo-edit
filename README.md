# Scout System · Photo Edit Toolkit

整合圖像工具的統一工作台，由 **Scout System** 開發維護。  
**DPI 列印** 為核心常用工具，專為 AI 生成圖轉實體印刷設計。

## 工具一覽

| 工具 | 路徑 | 說明 |
|------|------|------|
| **DPI 列印** ⭐ | `/dpi` | AI 圖 → 設定 DPI / 實際 cm，品質診斷，PNG pHYs 匯出、批次 |
| **去背換底** | `/background` | 四角取色去背、靈敏度／柔邊、純色／漸層／背景圖 |
| **裁切縮放** | `/resize` | 比例裁切、旋轉翻轉、像素輸出 |
| **SVG 向量** | `/svg` | PNG/JPEG → SVG，中心線／輪廓 |
| **QR / 條碼** | `/qrcode` | 自訂 QR 與條碼、多模板 |

## 建議工作流（AI 圖列印）

1. **去背** — 清掉雜亂背景  
2. **裁切** — 對齊目標比例（A4、1:1…）  
3. **DPI 列印** — 選「AI→A4 300」→ 看品質燈號 → 匯出 PNG  

## DPI 重點功能

- 工作模式：**依尺寸重採樣** / **只改 DPI 標籤**（不破壞像素）
- AI 快速預設：A4 直/橫 300、相紙 4×6、只改標籤
- 紙張預設：A3–A6、名片、相紙、徽章、貼紙
- **列印品質診斷**（有效 DPI ≥300 / 200 / 150）
- 放大輸出警告（避免軟體瞎放大）
- 批次上傳與批次匯出
- PNG **pHYs** 嵌入（Photoshop / 印刷流程可讀）
- JPEG 選項（提醒：JPEG 不適合可靠嵌 DPI）

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

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Framer Motion · react-router-dom

## Copyright

```
© 2026 Scout System. All rights reserved.
```
