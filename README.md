# 🏗️ SLG 城鎮建設遊戲

一個以手機為優先的策略模擬遊戲原型，靈感來自 Travian、Dark War: Survival 和三國志戰略版。

🎮 **試玩連結：** https://joshua04tang.github.io/slg-town-builder/

## 📱 遊戲特色

- **手機優先設計**：直向螢幕、觸控操作、響應式設計
- **建設系統**：在網格地圖上建造和升級建築
- **資源管理**：收集食物、木材、鋼鐵和電力
- **離線生產**：即使離線，資源建築也會持續生產
- **建造隊列**：管理多個同時進行的建設項目
- **新手教學**：引導玩家完成初期任務並獲得獎勵
- **自動儲存**：進度自動保存到本地儲存空間

## 🎯 遊戲玩法

### 基本操作

- **平移地圖**：拖曳螢幕移動視野
- **縮放**：
  - 手機：雙指捏合縮放
  - 電腦：滾輪縮放
- **建造建築**：點擊空地格，從建築選單中選擇
- **建築互動**：點擊已建造的建築查看詳情、升級或收集資源
- **查看任務**：點擊右上角的 📋 按鈕
- **設定選項**：點擊右上角的 ⚙️ 按鈕

### 資源類型

| 資源 | 圖示 | 用途 |
|------|------|------|
| 食物 | 🌾 | 建造和升級大部分建築 |
| 木材 | 🪵 | 建造和升級大部分建築 |
| 鋼鐵 | ⛏️ | 升級高級建築 |
| 電力 | ⚡ | 最高級建築的需求 |

### 建築類型

#### 核心建築
- **指揮部（HQ）** 🏛️
  - 基地的核心建築
  - 升級後解鎖更高級的建築
  - 限制其他建築的最高等級

#### 資源建築
- **農場** 🌾 - 生產食物
- **伐木場** 🪵 - 生產木材
- **鋼鐵廠** ⛏️ - 生產鋼鐵（需要 HQ 等級 2）
- **發電站** ⚡ - 生產電力（需要 HQ 等級 3）

#### 功能建築
- **倉庫** 📦 - 增加資源儲存上限
- **兵營** ⚔️ - 軍事建築（功能待實裝）

### 遊戲流程

1. **建造資源建築**
   - 點擊空地格開啟建築選單
   - 選擇要建造的建築類型
   - 等待建造完成（或使用加速）

2. **收集資源**
   - 資源建築會隨時間自動生產資源
   - 點擊建築查看累積的資源
   - 點擊「收集」按鈕將資源加入總量

3. **升級建築**
   - 點擊建築開啟資訊面板
   - 查看升級所需資源和時間
   - 點擊「升級」按鈕開始升級

4. **升級指揮部**
   - 定期升級 HQ 解鎖新建築類型
   - 提高其他建築的等級上限

5. **完成任務**
   - 點擊 📋 查看可用任務
   - 完成任務條件後領取獎勵

### 建造隊列

- 初始有 **2 個建造隊列**
- 每個隊列一次只能處理一個建設項目
- 隊列忙碌時無法開始新的建造或升級
- 建設時間少於 3 分鐘時可免費加速完成

## 🚀 本地運行

### 需求

- Node.js 18 或更高版本
- npm 或 yarn

### 安裝步驟

```bash
# 複製專案
git clone https://github.com/joshua04tang/slg-town-builder.git
cd slg-town-builder

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 在瀏覽器開啟
# http://localhost:3000/slg-town-builder/
```

### 建置生產版本

```bash
npm run build
```

建置後的檔案會輸出到 `dist/` 目錄。

## ⚙️ 遊戲平衡調整

### 修改建築數值

所有建築的數值都在 `src/config/buildingsData.ts` 檔案中定義。

#### 建築屬性說明

```typescript
{
  cost: {
    food: 100,      // 建造/升級所需食物
    wood: 100,      // 建造/升級所需木材
    steel: 50,      // 建造/升級所需鋼鐵
    electricity: 0  // 建造/升級所需電力
  },
  buildTime: 60,    // 建造/升級時間（秒）
  production: {
    type: 'food',   // 生產的資源類型
    amount: 50,     // 每次生產量
    interval: 60    // 生產間隔（秒）
  },
  storageIncrease: 5000,  // 倉庫增加的儲存容量
  requiredHQLevel: 1      // 需要的指揮部等級
}
```

#### 範例：提高農場產量

編輯 `src/config/buildingsData.ts`：

```typescript
farm: {
  // ... 其他設定
  levels: [
    {
      cost: { wood: 100 },
      buildTime: 30,
      production: { 
        type: 'food', 
        amount: 100,  // 從 50 改為 100
        interval: 60 
      },
      requiredHQLevel: 1,
    },
    // ... 其他等級
  ]
}
```

#### 範例：加快建造速度

```typescript
{
  cost: { food: 200, wood: 200 },
  buildTime: 30,  // 從 60 改為 30 秒
  // ...
}
```

### 修改初始資源

編輯 `src/state/GameState.ts` 中的 `createInitialState()` 方法：

```typescript
resources: {
  food: 2000,      // 預設 1000
  wood: 2000,      // 預設 1000
  steel: 500,      // 預設 100
  electricity: 100, // 預設 0
},
storageCapacity: 20000, // 預設 10000
```

### 修改建造隊列數量

編輯 `src/state/GameState.ts`：

```typescript
maxBuilders: 3,  // 預設 2
```

### 修改遊戲文字

所有遊戲文字都集中在 `src/config/strings.ts`，可輕鬆修改或翻譯成其他語言。

## 🛠️ 技術架構

- **遊戲引擎**：Phaser 3
- **開發語言**：TypeScript
- **建置工具**：Vite
- **部署**：GitHub Pages（自動部署）

### 專案結構

```
src/
├── config/
│   ├── buildingsData.ts  # 建築定義和數值
│   ├── gameConfig.ts     # Phaser 設定
│   └── strings.ts        # 遊戲文字（繁體中文）
├── scenes/
│   └── MainScene.ts      # 主要遊戲場景
├── state/
│   └── GameState.ts      # 遊戲狀態管理
├── types.ts              # TypeScript 型別定義
└── main.ts               # 程式進入點
```

### 遊戲架構特點

- **遊戲狀態與渲染分離**：`GameState` 類別管理所有遊戲邏輯和資料，與 Phaser 場景分離
- **易於擴展**：未來可輕鬆加入後端伺服器實現多人遊戲
- **自動儲存**：每 10 秒自動保存到 localStorage
- **離線進度**：遊戲載入時會計算離線期間的資源生產

## 📝 開發計劃

### 已完成 ✅
- [x] 基礎建造系統
- [x] 資源生產和收集
- [x] 建築升級
- [x] 建造隊列
- [x] 新手教學/任務系統
- [x] 離線進度計算
- [x] 自動儲存/載入
- [x] 手機觸控支援

### 未來功能 🚧
- [ ] 軍事系統（訓練單位）
- [ ] 玩家對戰
- [ ] 後端伺服器整合
- [ ] 聯盟/公會系統
- [ ] 世界地圖
- [ ] 更多建築類型
- [ ] 音效和背景音樂
- [ ] 多語言支援

## 📦 部署到 GitHub Pages

此專案已設定 GitHub Actions 自動部署：

1. **啟用 GitHub Pages**：
   - 前往儲存庫設定（Settings）
   - 點擊左側選單的「Pages」
   - 在「Source」下選擇「GitHub Actions」

2. **推送程式碼**：
   ```bash
   git add .
   git commit -m "更新遊戲"
   git push origin main
   ```

3. **自動部署**：
   - GitHub Actions 會自動建置並部署
   - 幾分鐘後可在 https://joshua04tang.github.io/slg-town-builder/ 存取

## 🎮 遊戲截圖

### 初始畫面
![遊戲初始視圖](/opt/cursor/artifacts/screenshots/game-initial-view.png)

### 建築選單
![建築選單](/opt/cursor/artifacts/screenshots/build-menu.png)

### 建築資訊面板
![建築資訊](/opt/cursor/artifacts/screenshots/hq-building-info-panel.png)

## 📄 授權

ISC License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📧 聯絡

如有問題或建議，請開啟 Issue 討論。

---

**祝遊戲愉快！** 🎮
