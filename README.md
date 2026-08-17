# Scout System · Photo Edit Toolkit

整合圖像工具的統一工作台，由 **Scout System** 開發維護。

## 工具一覽

| 工具 | 路徑 | 說明 |
|------|------|------|
| **DPI 列印** ⭐ | `/dpi` | AI 圖 → DPI / 實際 cm、品質診斷、pHYs PNG、批次 |
| **馬賽克** | `/mosaic` | 框選臉部打碼（馬賽克／模糊／黑塊），保護小朋友私隱 |
| **去背換底** | `/background` | 去背、靈敏度／柔邊、純色／漸層／背景圖 |
| **裁切縮放** | `/resize` | 比例裁切、旋轉翻轉 |
| **浮水印** | `/watermark` | **自訂文字**版權浮水印（不強制品牌字） |
| **邊框出血** | `/bleed` | 出血線、安全區、裁切標記、裝飾邊框 |
| **拼圖九宮格** | `/collage` | 2×2／3×3 等多圖拼版 |
| **SVG 向量** | `/svg` | PNG → SVG |
| **QR / 條碼** | `/qrcode` | 自訂 QR 與條碼 |

## 建議工作流

**活動相上網：** 馬賽克 → 裁切／拼圖 → 自訂浮水印  

**AI 圖印刷：** 去背／裁切 → 邊框出血 → DPI 300 匯出  

## 開發

```bash
npm install
npm run dev
```

## Copyright

```
© 2026 Scout System. All rights reserved.
```
