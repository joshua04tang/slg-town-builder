import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { buildingsData } from '../config/buildingsData';
import { strings } from '../config/strings';
import { PlacedBuilding, BuildingType, Resources } from '../types';

const GRID_SIZE = 11;
const TILE_SIZE = 80;
const TILE_SPACING = 10;

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private buildingSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;
  private resourceTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private buildMenu: Phaser.GameObjects.Container | null = null;
  private buildingInfoPanel: Phaser.GameObjects.Container | null = null;
  private questPanel: Phaser.GameObjects.Container | null = null;
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  private selectedPlot: { x: number; y: number } | null = null;
  private lastPinchDistance: number = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.gameState = new GameState();
    
    this.camera = this.cameras.main;
    this.camera.setBounds(-1000, -1000, 3000, 3000);
    
    this.createGrid();
    this.createBuildings();
    this.createUI();
    this.setupInput();
    
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateGame(),
      loop: true,
    });
  }

  private createGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(-1);
    this.drawGrid();
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    
    const centerX = this.scale.width / 2;
    const centerY = (this.scale.height - 80 - 80) / 2 + 80;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;

    const state = this.gameState.getState();
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const px = startX + x * (TILE_SIZE + TILE_SPACING);
        const py = startY + y * (TILE_SIZE + TILE_SPACING);
        
        const hasBuilding = state.buildings.some(b => b.x === x && b.y === y);
        
        if (hasBuilding) {
          continue;
        }
        
        this.gridGraphics.fillStyle(0x1e293b, 0.6);
        this.gridGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        this.gridGraphics.lineStyle(2, 0x475569, 0.8);
        this.gridGraphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        
        this.gridGraphics.lineStyle(2, 0x64748b, 0.5);
        const centerPx = px + TILE_SIZE / 2;
        const centerPy = py + TILE_SIZE / 2;
        const crossSize = 15;
        this.gridGraphics.beginPath();
        this.gridGraphics.moveTo(centerPx - crossSize, centerPy);
        this.gridGraphics.lineTo(centerPx + crossSize, centerPy);
        this.gridGraphics.moveTo(centerPx, centerPy - crossSize);
        this.gridGraphics.lineTo(centerPx, centerPy + crossSize);
        this.gridGraphics.strokePath();
      }
    }
  }

  private getPlotPosition(x: number, y: number): { px: number; py: number } {
    const centerX = this.scale.width / 2;
    const centerY = (this.scale.height - 80 - 80) / 2 + 80;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    
    return {
      px: startX + x * (TILE_SIZE + TILE_SPACING) + TILE_SIZE / 2,
      py: startY + y * (TILE_SIZE + TILE_SPACING) + TILE_SIZE / 2,
    };
  }

  private getPlotFromPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    const centerX = this.scale.width / 2;
    const centerY = (this.scale.height - 80 - 80) / 2 + 80;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    
    const x = Math.floor((worldX - startX) / (TILE_SIZE + TILE_SPACING));
    const y = Math.floor((worldY - startY) / (TILE_SIZE + TILE_SPACING));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  }

  private createBuildings(): void {
    const state = this.gameState.getState();
    state.buildings.forEach(building => {
      this.createBuildingSprite(building);
    });
    this.drawGrid();
  }

  private createBuildingSprite(building: PlacedBuilding): void {
    const pos = this.getPlotPosition(building.x, building.y);
    const container = this.add.container(pos.px, pos.py);
    container.setDepth(10);
    
    const buildingRect = this.add.rectangle(0, 0, TILE_SIZE - 10, TILE_SIZE - 10);
    const buildingColor = this.getBuildingColor(building.type);
    buildingRect.setFillStyle(buildingColor, 1);
    buildingRect.setStrokeStyle(3, 0xffffff, 1);
    container.add(buildingRect);
    
    const emoji = this.getBuildingEmoji(building.type);
    const icon = this.add.text(0, -10, emoji, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(icon);
    
    const levelText = this.add.text(0, 20, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(levelText);
    
    container.setInteractive(
      new Phaser.Geom.Rectangle(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.onBuildingClick(building);
    });
    
    this.buildingSprites.set(building.id, container);
    this.updateBuildingSprite(building);
  }

  private getBuildingColor(type: BuildingType): number {
    const colors: Record<BuildingType, number> = {
      headquarters: 0x3b82f6,
      farm: 0x10b981,
      lumberMill: 0x92400e,
      steelMine: 0x64748b,
      powerPlant: 0xfbbf24,
      warehouse: 0x8b5cf6,
      barracks: 0xef4444,
    };
    return colors[type] || 0x6b7280;
  }

  private getBuildingEmoji(type: BuildingType): string {
    const emojis: Record<BuildingType, string> = {
      headquarters: '🏛️',
      farm: '🌾',
      lumberMill: '🪵',
      steelMine: '⛏️',
      powerPlant: '⚡',
      warehouse: '📦',
      barracks: '⚔️',
    };
    return emojis[type] || '🏗️';
  }

  private updateBuildingSprite(building: PlacedBuilding): void {
    const container = this.buildingSprites.get(building.id);
    if (!container) return;
    
    const levelText = container.getAt(2) as Phaser.GameObjects.Text;
    if (building.isBuilding) {
      const remaining = building.buildEndTime ? Math.ceil((building.buildEndTime - Date.now()) / 1000) : 0;
      levelText.setText(`${this.formatTime(remaining)}`);
      levelText.setColor('#fbbf24');
    } else {
      levelText.setText(`Lv.${building.level}`);
      levelText.setColor('#ffffff');
    }
    
    const data = buildingsData[building.type];
    const levelData = data.levels[building.level - 1];
    
    if (levelData?.production && !building.isBuilding && building.accumulatedResources > 0) {
      let collectIcon = container.getAt(3) as Phaser.GameObjects.Text;
      if (!collectIcon) {
        collectIcon = this.add.text(25, -25, '💰', {
          fontSize: '24px',
        }).setOrigin(0.5);
        container.add(collectIcon);
      }
      collectIcon.setVisible(true);
    } else {
      const collectIcon = container.getAt(3) as Phaser.GameObjects.Text;
      if (collectIcon) {
        collectIcon.setVisible(false);
      }
    }
  }

  private createUI(): void {
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);
    this.uiContainer.setDepth(1000);
    
    this.createResourceBar();
    this.createQuestButton();
    this.createSettingsButton();
  }

  private createResourceBar(): void {
    const barHeight = 80;
    const bg = this.add.rectangle(
      this.scale.width / 2,
      barHeight / 2,
      this.scale.width,
      barHeight,
      0x1f2937,
      0.98
    );
    bg.setScrollFactor(0);
    bg.setDepth(1000);
    
    const resources = [
      { key: 'food', emoji: '🌾', color: '#10b981' },
      { key: 'wood', emoji: '🪵', color: '#92400e' },
      { key: 'steel', emoji: '⛏️', color: '#64748b' },
      { key: 'electricity', emoji: '⚡', color: '#fbbf24' },
    ];
    
    const startX = 15;
    const spacing = (this.scale.width - 30) / resources.length;
    
    resources.forEach((res, i) => {
      const x = startX + i * spacing;
      
      const icon = this.add.text(x, 25, res.emoji, {
        fontSize: '20px',
      });
      icon.setScrollFactor(0);
      icon.setDepth(1001);
      
      const text = this.add.text(x + 30, 25, '0', {
        fontSize: '16px',
        color: res.color,
        fontStyle: 'bold',
      });
      text.setScrollFactor(0);
      text.setDepth(1001);
      this.resourceTexts.set(res.key, text);
    });
    
    const bottomBarBg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 40,
      this.scale.width,
      80,
      0x1f2937,
      0.98
    );
    bottomBarBg.setScrollFactor(0);
    bottomBarBg.setDepth(1000);
  }

  private createQuestButton(): void {
    const btnX = this.scale.width / 4;
    const btnY = this.scale.height - 40;
    
    const btn = this.add.rectangle(btnX, btnY, 70, 60, 0x3b82f6, 1);
    btn.setScrollFactor(0);
    btn.setDepth(1001);
    btn.setStrokeStyle(2, 0xffffff);
    btn.setInteractive();
    btn.on('pointerdown', () => {
      this.toggleQuestPanel();
    });
    
    const icon = this.add.text(btnX, btnY - 8, '📋', {
      fontSize: '28px',
    }).setOrigin(0.5);
    icon.setScrollFactor(0);
    icon.setDepth(1002);
    
    const label = this.add.text(btnX, btnY + 18, '任務', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
    label.setScrollFactor(0);
    label.setDepth(1002);
  }

  private createSettingsButton(): void {
    const btnX = (this.scale.width / 4) * 3;
    const btnY = this.scale.height - 40;
    
    const btn = this.add.rectangle(btnX, btnY, 70, 60, 0x6b7280, 1);
    btn.setScrollFactor(0);
    btn.setDepth(1001);
    btn.setStrokeStyle(2, 0xffffff);
    btn.setInteractive();
    btn.on('pointerdown', () => {
      this.toggleSettingsPanel();
    });
    
    const icon = this.add.text(btnX, btnY - 8, '⚙️', {
      fontSize: '28px',
    }).setOrigin(0.5);
    icon.setScrollFactor(0);
    icon.setDepth(1002);
    
    const label = this.add.text(btnX, btnY + 18, '設定', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
    label.setScrollFactor(0);
    label.setDepth(1002);
  }

  private setupInput(): void {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('wheel', this.onWheel, this);
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.downElement.nodeName === 'CANVAS') {
        this.isDragging = false;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });
  }

  private onPointerDown(_pointer: Phaser.Input.Pointer): void {
    if (this.input.pointer1 && this.input.pointer2 && this.input.pointer2.isDown) {
      const distance = Phaser.Math.Distance.Between(
        this.input.pointer1.x,
        this.input.pointer1.y,
        this.input.pointer2.x,
        this.input.pointer2.y
      );
      this.lastPinchDistance = distance;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.isDown) {
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true;
      }
      
      if (this.isDragging && !(this.input.pointer2 && this.input.pointer2.isDown)) {
        this.camera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
        this.camera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.camera.zoom;
      }
    }
    
    if (this.input.pointer1 && this.input.pointer2 && this.input.pointer1.isDown && this.input.pointer2.isDown) {
      const distance = Phaser.Math.Distance.Between(
        this.input.pointer1.x,
        this.input.pointer1.y,
        this.input.pointer2.x,
        this.input.pointer2.y
      );
      
      if (this.lastPinchDistance > 0) {
        const delta = distance - this.lastPinchDistance;
        const newZoom = Phaser.Math.Clamp(this.camera.zoom + delta * 0.005, 0.5, 2);
        this.camera.setZoom(newZoom);
      }
      
      this.lastPinchDistance = distance;
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging && !this.buildMenu && !this.buildingInfoPanel) {
      const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
      const plot = this.getPlotFromPosition(worldPoint.x, worldPoint.y);
      
      if (plot) {
        this.onPlotClick(plot.x, plot.y);
      }
    }
    
    this.isDragging = false;
    this.lastPinchDistance = 0;
  }

  private onWheel(_pointer: Phaser.Input.Pointer, _currentlyOver: Phaser.GameObjects.GameObject[], _dx: number, dy: number): void {
    const zoomAmount = dy > 0 ? -0.1 : 0.1;
    const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomAmount, 0.5, 2);
    this.camera.setZoom(newZoom);
  }

  private onPlotClick(x: number, y: number): void {
    const state = this.gameState.getState();
    const building = state.buildings.find(b => b.x === x && b.y === y);
    
    if (building) {
      this.showBuildingInfo(building);
    } else {
      this.selectedPlot = { x, y };
      this.showBuildMenu();
    }
  }

  private onBuildingClick(building: PlacedBuilding): void {
    this.showBuildingInfo(building);
  }

  private showBuildMenu(): void {
    this.closeBuildMenu();
    this.closeBuildingInfo();
    
    if (!this.selectedPlot) return;
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.buildMenu = this.add.container(menuX, menuY);
    this.buildMenu.setScrollFactor(0);
    this.buildMenu.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1f2937, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.buildMenu.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, strings.buildingMenu, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buildMenu.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.closeBuildMenu());
    this.buildMenu.add(closeBtn);
    
    const buildableTypes: BuildingType[] = ['farm', 'lumberMill', 'steelMine', 'powerPlant', 'warehouse', 'barracks'];
    const gameState = this.gameState.getState();
    
    buildableTypes.forEach((type, i) => {
      const data = buildingsData[type];
      const levelData = data.levels[0];
      const y = -menuHeight / 2 + 80 + i * 70;
      
      const isLocked = levelData.requiredHQLevel && gameState.hqLevel < levelData.requiredHQLevel;
      const canAfford = this.gameState.canAfford(levelData.cost);
      
      const itemBg = this.add.rectangle(0, y, menuWidth - 40, 60, isLocked ? 0x374151 : (canAfford ? 0x059669 : 0x991b1b), 1);
      itemBg.setStrokeStyle(2, 0xffffff);
      if (!isLocked) {
        itemBg.setInteractive();
        itemBg.on('pointerdown', () => this.onBuildSelect(type));
      }
      this.buildMenu!.add(itemBg);
      
      const nameText = this.add.text(-menuWidth / 2 + 30, y, `${this.getBuildingEmoji(type)} ${data.name}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.buildMenu!.add(nameText);
      
      const costText = this.formatCost(levelData.cost);
      const cost = this.add.text(menuWidth / 2 - 30, y, costText, {
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(1, 0.5);
      this.buildMenu!.add(cost);
      
      if (isLocked) {
        const lockText = this.add.text(0, y + 20, `${strings.requirements}: HQ Lv.${levelData.requiredHQLevel}`, {
          fontSize: '12px',
          color: '#fbbf24',
        }).setOrigin(0.5, 0.5);
        this.buildMenu!.add(lockText);
      }
    });
  }

  private onBuildSelect(type: BuildingType): void {
    if (!this.selectedPlot) return;
    
    const success = this.gameState.buildBuilding(type, this.selectedPlot.x, this.selectedPlot.y);
    if (success) {
      const state = this.gameState.getState();
      const building = state.buildings.find(
        b => b.x === this.selectedPlot!.x && b.y === this.selectedPlot!.y
      );
      if (building) {
        this.createBuildingSprite(building);
        this.drawGrid();
      }
      this.closeBuildMenu();
      this.selectedPlot = null;
    }
  }

  private closeBuildMenu(): void {
    if (this.buildMenu) {
      this.buildMenu.destroy();
      this.buildMenu = null;
    }
  }

  private showBuildingInfo(building: PlacedBuilding): void {
    this.closeBuildingInfo();
    this.closeBuildMenu();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 450;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.buildingInfoPanel = this.add.container(menuX, menuY);
    this.buildingInfoPanel.setScrollFactor(0);
    this.buildingInfoPanel.setDepth(3000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1f2937, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    bg.setInteractive(new Phaser.Geom.Rectangle(-menuWidth/2, -menuHeight/2, menuWidth, menuHeight), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.event) pointer.event.stopPropagation();
    });
    this.buildingInfoPanel.add(bg);
    
    const data = buildingsData[building.type];
    const title = this.add.text(
      0,
      -menuHeight / 2 + 30,
      `${this.getBuildingEmoji(building.type)} ${data.name}`,
      { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.buildingInfoPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.event) pointer.event.stopPropagation();
      this.closeBuildingInfo();
    });
    this.buildingInfoPanel.add(closeBtn);
    
    let yOffset = -menuHeight / 2 + 80;
    
    if (building.isBuilding) {
      const remaining = building.buildEndTime ? Math.ceil((building.buildEndTime - Date.now()) / 1000) : 0;
      const statusText = this.add.text(
        0,
        yOffset,
        `${strings.buildingInProgress}: ${this.formatTime(remaining)}`,
        { fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.buildingInfoPanel.add(statusText);
      yOffset += 40;
      
      if (remaining <= 180 && remaining > 0) {
        const speedUpBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x10b981, 1);
        speedUpBtn.setStrokeStyle(2, 0xffffff);
        speedUpBtn.setInteractive();
        speedUpBtn.on('pointerdown', () => {
          if (this.gameState.speedUpBuilding(building.id)) {
            this.closeBuildingInfo();
          }
        });
        this.buildingInfoPanel.add(speedUpBtn);
        
        const speedUpText = this.add.text(0, yOffset, strings.instantFinish, {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.buildingInfoPanel.add(speedUpText);
        yOffset += 60;
      }
    } else {
      const levelText = this.add.text(0, yOffset, `${strings.level}: ${building.level}`, {
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.buildingInfoPanel.add(levelText);
      yOffset += 40;
      
      const levelData = data.levels[building.level - 1];
      if (levelData?.production) {
        const productionText = this.add.text(
          0,
          yOffset,
          `${strings.production}: ${levelData.production.amount}/${this.formatTime(levelData.production.interval)}`,
          { fontSize: '16px', color: '#10b981' }
        ).setOrigin(0.5);
        this.buildingInfoPanel.add(productionText);
        yOffset += 30;
        
        const accumulated = Math.floor(building.accumulatedResources);
        const accText = this.add.text(0, yOffset, `${strings.storage}: ${accumulated}`, {
          fontSize: '16px',
          color: '#fbbf24',
        }).setOrigin(0.5);
        this.buildingInfoPanel.add(accText);
        yOffset += 40;
        
        if (accumulated > 0) {
          const collectBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x059669, 1);
          collectBtn.setStrokeStyle(2, 0xffffff);
          collectBtn.setInteractive();
          collectBtn.on('pointerdown', () => {
            const collected = this.gameState.collectFromBuilding(building.id);
            if (collected > 0) {
              this.closeBuildingInfo();
            }
          });
          this.buildingInfoPanel.add(collectBtn);
          
          const collectText = this.add.text(0, yOffset, `${strings.collect} (${accumulated})`, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          this.buildingInfoPanel.add(collectText);
          yOffset += 60;
        }
      }
      
      if (building.level < data.maxLevel) {
        const nextLevelData = data.levels[building.level];
        const upgradeCheck = this.gameState.canUpgradeBuilding(building.id);
        
        const upgradeBg = this.add.rectangle(
          0,
          yOffset,
          menuWidth - 60,
          80,
          upgradeCheck.canUpgrade ? 0x3b82f6 : 0x991b1b,
          1
        );
        upgradeBg.setStrokeStyle(2, 0xffffff);
        if (upgradeCheck.canUpgrade) {
          upgradeBg.setInteractive();
          upgradeBg.on('pointerdown', () => {
            if (this.gameState.upgradeBuilding(building.id)) {
              this.closeBuildingInfo();
            }
          });
        }
        this.buildingInfoPanel.add(upgradeBg);
        
        const upgradeText = this.add.text(
          0,
          yOffset - 20,
          `${strings.upgrade} → Lv.${building.level + 1}`,
          { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.buildingInfoPanel.add(upgradeText);
        
        const costText = this.add.text(
          0,
          yOffset + 5,
          this.formatCost(nextLevelData.cost),
          { fontSize: '14px', color: '#ffffff' }
        ).setOrigin(0.5);
        this.buildingInfoPanel.add(costText);
        
        const timeText = this.add.text(
          0,
          yOffset + 25,
          `${strings.time}: ${this.formatTime(nextLevelData.buildTime)}`,
          { fontSize: '14px', color: '#fbbf24' }
        ).setOrigin(0.5);
        this.buildingInfoPanel.add(timeText);
        
        if (!upgradeCheck.canUpgrade) {
          const reasonText = this.add.text(
            0,
            yOffset + 50,
            upgradeCheck.reason || '',
            { fontSize: '12px', color: '#fca5a5' }
          ).setOrigin(0.5);
          this.buildingInfoPanel.add(reasonText);
        }
      } else {
        const maxText = this.add.text(0, yOffset, strings.maxLevel, {
          fontSize: '18px',
          color: '#fbbf24',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.buildingInfoPanel.add(maxText);
      }
    }
  }

  private closeBuildingInfo(): void {
    if (this.buildingInfoPanel) {
      this.buildingInfoPanel.destroy();
      this.buildingInfoPanel = null;
    }
  }

  private toggleQuestPanel(): void {
    if (this.questPanel) {
      this.questPanel.destroy();
      this.questPanel = null;
      return;
    }
    
    this.closeBuildMenu();
    this.closeBuildingInfo();
    this.closeSettingsPanel();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.questPanel = this.add.container(menuX, menuY);
    this.questPanel.setScrollFactor(0);
    this.questPanel.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1f2937, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.questPanel.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, strings.tutorial, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.questPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.questPanel!.destroy();
      this.questPanel = null;
    });
    this.questPanel.add(closeBtn);
    
    const state = this.gameState.getState();
    state.quests.forEach((quest, i) => {
      if (!this.questPanel) return;
      
      const y = -menuHeight / 2 + 80 + i * 80;
      
      const itemBg = this.add.rectangle(
        0,
        y,
        menuWidth - 40,
        70,
        quest.claimed ? 0x374151 : (quest.completed ? 0x059669 : 0x1e40af),
        1
      );
      itemBg.setStrokeStyle(2, 0xffffff);
      this.questPanel.add(itemBg);
      
      const questTitle = this.add.text(-menuWidth / 2 + 30, y - 15, quest.title, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.questPanel.add(questTitle);
      
      const questDesc = this.add.text(-menuWidth / 2 + 30, y + 5, quest.description, {
        fontSize: '12px',
        color: '#d1d5db',
      }).setOrigin(0, 0.5);
      this.questPanel.add(questDesc);
      
      if (quest.completed && !quest.claimed) {
        const claimBtn = this.add.rectangle(menuWidth / 2 - 60, y + 10, 80, 35, 0xfbbf24, 1);
        claimBtn.setStrokeStyle(2, 0xffffff);
        claimBtn.setInteractive();
        claimBtn.on('pointerdown', () => {
          if (this.gameState.claimQuestReward(quest.id)) {
            this.toggleQuestPanel();
            this.toggleQuestPanel();
          }
        });
        if (this.questPanel) this.questPanel.add(claimBtn);
        
        const claimText = this.add.text(menuWidth / 2 - 60, y + 10, strings.claim, {
          fontSize: '14px',
          color: '#000000',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        if (this.questPanel) this.questPanel.add(claimText);
      }
      
      const rewardText = this.add.text(
        -menuWidth / 2 + 30,
        y + 25,
        `${strings.reward}: ${this.formatCost(quest.reward)}`,
        { fontSize: '12px', color: '#10b981' }
      ).setOrigin(0, 0.5);
      if (this.questPanel) this.questPanel.add(rewardText);
      
      if (quest.claimed) {
        const checkmark = this.add.text(menuWidth / 2 - 40, y, '✓', {
          fontSize: '32px',
          color: '#10b981',
        }).setOrigin(0.5);
        if (this.questPanel) this.questPanel.add(checkmark);
      }
    });
  }

  private toggleSettingsPanel(): void {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
      return;
    }
    
    this.closeBuildMenu();
    this.closeBuildingInfo();
    if (this.questPanel) {
      this.questPanel.destroy();
      this.questPanel = null;
    }
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 300;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.settingsPanel = this.add.container(menuX, menuY);
    this.settingsPanel.setScrollFactor(0);
    this.settingsPanel.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1f2937, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.settingsPanel.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, strings.settings, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.settingsPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.closeSettingsPanel());
    this.settingsPanel.add(closeBtn);
    
    const resetBtn = this.add.rectangle(0, 0, menuWidth - 80, 60, 0xef4444, 1);
    resetBtn.setStrokeStyle(2, 0xffffff);
    resetBtn.setInteractive();
    resetBtn.on('pointerdown', () => this.confirmReset());
    this.settingsPanel.add(resetBtn);
    
    const resetText = this.add.text(0, 0, strings.resetProgress, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.settingsPanel.add(resetText);
  }

  private closeSettingsPanel(): void {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }
  }

  private confirmReset(): void {
    this.closeSettingsPanel();
    
    const menuWidth = Math.min(this.scale.width - 40, 350);
    const menuHeight = 200;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    const confirmPanel = this.add.container(menuX, menuY);
    confirmPanel.setScrollFactor(0);
    confirmPanel.setDepth(3000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1f2937, 0.98);
    bg.setStrokeStyle(3, 0xef4444);
    confirmPanel.add(bg);
    
    const text = this.add.text(0, -30, strings.confirmReset, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
    confirmPanel.add(text);
    
    const yesBtn = this.add.rectangle(-80, 40, 120, 50, 0xef4444, 1);
    yesBtn.setStrokeStyle(2, 0xffffff);
    yesBtn.setInteractive();
    yesBtn.on('pointerdown', () => {
      this.gameState.resetProgress();
      this.scene.restart();
    });
    confirmPanel.add(yesBtn);
    
    const yesText = this.add.text(-80, 40, strings.yes, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmPanel.add(yesText);
    
    const noBtn = this.add.rectangle(80, 40, 120, 50, 0x6b7280, 1);
    noBtn.setStrokeStyle(2, 0xffffff);
    noBtn.setInteractive();
    noBtn.on('pointerdown', () => confirmPanel.destroy());
    confirmPanel.add(noBtn);
    
    const noText = this.add.text(80, 40, strings.no, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmPanel.add(noText);
  }

  private formatCost(cost: Resources | { food?: number; wood?: number; steel?: number; electricity?: number }): string {
    const parts: string[] = [];
    if (cost.food) parts.push(`🌾${cost.food}`);
    if (cost.wood) parts.push(`🪵${cost.wood}`);
    if (cost.steel) parts.push(`⛏️${cost.steel}`);
    if (cost.electricity) parts.push(`⚡${cost.electricity}`);
    return parts.join(' ');
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}${strings.seconds}`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${strings.minutes}`;
    return `${Math.floor(seconds / 3600)}${strings.hours}`;
  }

  private updateGame(): void {
    this.gameState.update();
    this.gameState.updateWarehouseCapacity();
    
    const state = this.gameState.getState();
    
    this.resourceTexts.get('food')?.setText(Math.floor(state.resources.food).toString());
    this.resourceTexts.get('wood')?.setText(Math.floor(state.resources.wood).toString());
    this.resourceTexts.get('steel')?.setText(Math.floor(state.resources.steel).toString());
    this.resourceTexts.get('electricity')?.setText(Math.floor(state.resources.electricity).toString());
    
    state.buildings.forEach(building => {
      this.updateBuildingSprite(building);
      
      const data = buildingsData[building.type];
      const levelData = data.levels[building.level - 1];
      
      if (levelData?.production && !building.isBuilding) {
        const productionPerSecond = levelData.production.amount / levelData.production.interval;
        building.accumulatedResources += productionPerSecond;
      }
    });
  }

  update(): void {
  }
}
