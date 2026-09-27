import Phaser from 'phaser';
import { SpaceGameState } from '../state/SpaceGameState';
import { spaceRooms } from '../config/spaceRooms';
import { spaceStrings } from '../config/spaceStrings';
import { PlacedRoom, RoomType, SpaceResources, RoomCost } from '../spaceTypes';

const GRID_SIZE = 5;
const TILE_SIZE = 100;
const TILE_SPACING = 8;
const TOP_BAR_HEIGHT = 80;
const BOTTOM_BAR_HEIGHT = 80;

export class SpaceMainScene extends Phaser.Scene {
  private gameState!: SpaceGameState;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private roomSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;
  private resourceTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private powerText!: Phaser.GameObjects.Text;
  private hullText!: Phaser.GameObjects.Text;
  private emergencyPowerText!: Phaser.GameObjects.Text;
  private dialogueBox: Phaser.GameObjects.Container | null = null;
  private roomInfoPanel: Phaser.GameObjects.Container | null = null;
  private checklistPanel: Phaser.GameObjects.Container | null = null;
  private fragmentsPanel: Phaser.GameObjects.Container | null = null;
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  private selectedPlot: { x: number; y: number } | null = null;
  private lastPinchDistance: number = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private evaSprite: Phaser.GameObjects.Container | null = null;
  private introSequence: Phaser.GameObjects.Container | null = null;
  private wakeSequence: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'SpaceMainScene' });
  }

  create(): void {
    this.gameState = new SpaceGameState();
    
    this.camera = this.cameras.main;
    this.camera.setBounds(-1000, -1000, 3000, 3000);
    
    const state = this.gameState.getState();
    
    if (!state.introSeen) {
      this.playIntroSequence();
    } else if (!state.wakeSeen) {
      this.playWakeSequence();
    } else {
      this.initializeGame();
    }
  }

  private playIntroSequence(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.introSequence = this.add.container(0, 0);
    this.introSequence.setScrollFactor(0);
    this.introSequence.setDepth(10000);

    const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 1);
    this.introSequence.add(bg);

    const skipBtn = this.add.text(this.scale.width - 20, 20, spaceStrings.skipIntro, {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(1, 0);
    skipBtn.setInteractive();
    skipBtn.on('pointerdown', () => this.skipIntro());
    this.introSequence.add(skipBtn);

    const timeline = this.tweens.createTimeline();

    const distantShips = this.add.text(centerX, centerY, '✦ ✦ ✦', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);
    this.introSequence.add(distantShips);

    timeline.add({
      targets: distantShips,
      alpha: { from: 0, to: 1 },
      duration: 2000,
      hold: 2000,
    });

    timeline.add({
      targets: distantShips,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        const oneShip = this.add.text(centerX, centerY, '🚀', {
          fontSize: '48px',
        }).setOrigin(0.5).setAlpha(0);
        this.introSequence!.add(oneShip);
        
        this.tweens.add({
          targets: oneShip,
          alpha: { from: 0, to: 1 },
          duration: 2000,
          hold: 2000,
          onComplete: () => {
            oneShip.setAlpha(0);
            
            const tvStatic = this.add.rectangle(centerX, centerY, 400, 300, 0x111111, 1);
            tvStatic.setStrokeStyle(2, 0x333333);
            this.introSequence!.add(tvStatic);
            
            const twinkleText = this.add.text(centerX, centerY - 40, spaceStrings.introTwinkle, {
              fontSize: '20px',
              color: '#aaaaaa',
              align: 'center',
              fontStyle: 'italic',
            }).setOrigin(0.5).setAlpha(0);
            this.introSequence!.add(twinkleText);
            
            this.tweens.add({
              targets: twinkleText,
              alpha: { from: 0, to: 1 },
              duration: 1500,
              hold: 2000,
              onComplete: () => {
                this.tweens.add({
                  targets: [tvStatic, twinkleText],
                  alpha: 0,
                  duration: 500,
                  onComplete: () => {
                    tvStatic.destroy();
                    twinkleText.destroy();
                    
                    this.time.delayedCall(2000, () => {
                      const whoAmI = this.add.text(centerX, centerY, spaceStrings.introWhoAmI, {
                        fontSize: '32px',
                        color: '#ffffff',
                        fontStyle: 'bold',
                      }).setOrigin(0.5).setAlpha(0);
                      this.introSequence!.add(whoAmI);
                      
                      this.tweens.add({
                        targets: whoAmI,
                        alpha: { from: 0, to: 1 },
                        duration: 2000,
                        hold: 2000,
                        onComplete: () => {
                          this.gameState.setIntroSeen();
                          this.introSequence!.destroy();
                          this.introSequence = null;
                          this.playWakeSequence();
                        },
                      });
                    });
                  },
                });
              },
            });
          },
        });
      },
    });

    timeline.play();
  }

  private skipIntro(): void {
    if (this.introSequence) {
      this.tweens.killAll();
      this.introSequence.destroy();
      this.introSequence = null;
      this.gameState.setIntroSeen();
      this.playWakeSequence();
    }
  }

  private playWakeSequence(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.wakeSequence = this.add.container(0, 0);
    this.wakeSequence.setScrollFactor(0);
    this.wakeSequence.setDepth(10000);

    const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 1);
    this.wakeSequence.add(bg);

    const hibernationLight = this.add.circle(centerX, centerY, 60, 0xff0000, 0.3);
    this.wakeSequence.add(hibernationLight);
    
    this.tweens.add({
      targets: hibernationLight,
      alpha: { from: 0.3, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    const emergencyMarker = this.add.text(centerX, centerY + 100, '緊急電源 ↓', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.wakeSequence.add(emergencyMarker);

    this.tweens.add({
      targets: emergencyMarker,
      alpha: { from: 0, to: 1 },
      duration: 1500,
      delay: 1000,
    });

    this.time.delayedCall(4000, () => {
      this.showDialogue(spaceStrings.wakeDialogue1);
      
      this.time.delayedCall(3000, () => {
        this.showDialogue(spaceStrings.wakeDialogue2);
        
        this.time.delayedCall(3000, () => {
          this.gameState.setWakeSeen();
          this.gameState.startEmergencyPower();
          
          if (this.wakeSequence) {
            this.tweens.add({
              targets: this.wakeSequence.list,
              alpha: 0,
              duration: 1000,
              onComplete: () => {
                this.wakeSequence!.destroy();
                this.wakeSequence = null;
                this.initializeGame();
                this.showGeneratorTutorial();
              },
            });
          }
        });
      });
    });
  }

  private showGeneratorTutorial(): void {
    const state = this.gameState.getState();
    const generatorExists = state.rooms.some(r => r.type === 'generator');
    
    if (!generatorExists) {
      const generatorSpot = { x: 2, y: 1 };
      
      this.time.delayedCall(1000, () => {
        const pos = this.getPlotPosition(generatorSpot.x, generatorSpot.y);
        
        const pointer = this.add.text(pos.px, pos.py - 80, '👇', {
          fontSize: '32px',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
        
        this.tweens.add({
          targets: pointer,
          y: pos.py - 60,
          duration: 500,
          yoyo: true,
          repeat: 5,
          onComplete: () => pointer.destroy(),
        });
        
        const buildSuccess = this.gameState.buildRoom('generator', generatorSpot.x, generatorSpot.y);
        if (buildSuccess) {
          const room = state.rooms.find(r => r.type === 'generator');
          if (room) {
            this.createRoomSprite(room);
            this.drawGrid();
            
            this.time.delayedCall(1000, () => {
              room.isBuilding = false;
              room.level = 1;
              this.updateRoomSprite(room);
              
              this.time.delayedCall(500, () => {
                this.gameState.activateRoom(room.id);
                this.updateRoomSprite(room);
                this.updatePowerDisplay();
                this.showDialogue(spaceStrings.powerDialogue1);
                
                this.time.delayedCall(3000, () => {
                  this.showDialogue(spaceStrings.powerDialogue2);
                });
              });
            });
          }
        }
      });
    }
  }

  private initializeGame(): void {
    this.createGrid();
    this.createRooms();
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
    const centerY = (this.scale.height - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT) / 2 + TOP_BAR_HEIGHT;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;

    const state = this.gameState.getState();
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const px = startX + x * (TILE_SIZE + TILE_SPACING);
        const py = startY + y * (TILE_SIZE + TILE_SPACING);
        
        const hasRoom = state.rooms.some(r => r.x === x && r.y === y);
        
        if (hasRoom) {
          continue;
        }
        
        this.gridGraphics.fillStyle(0x0a0a0a, 0.8);
        this.gridGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        this.gridGraphics.lineStyle(2, 0x1a1a2e, 1);
        this.gridGraphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        
        this.gridGraphics.lineStyle(1, 0x2a2a3e, 0.5);
        const crossSize = 10;
        const centerPx = px + TILE_SIZE / 2;
        const centerPy = py + TILE_SIZE / 2;
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
    const centerY = (this.scale.height - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT) / 2 + TOP_BAR_HEIGHT;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    
    return {
      px: startX + x * (TILE_SIZE + TILE_SPACING) + TILE_SIZE / 2,
      py: startY + y * (TILE_SIZE + TILE_SPACING) + TILE_SIZE / 2,
    };
  }

  private getPlotFromPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    const centerX = this.scale.width / 2;
    const centerY = (this.scale.height - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT) / 2 + TOP_BAR_HEIGHT;
    const startX = centerX - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    const startY = centerY - (GRID_SIZE * (TILE_SIZE + TILE_SPACING)) / 2;
    
    const x = Math.floor((worldX - startX) / (TILE_SIZE + TILE_SPACING));
    const y = Math.floor((worldY - startY) / (TILE_SIZE + TILE_SPACING));
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x, y };
    }
    return null;
  }

  private createRooms(): void {
    const state = this.gameState.getState();
    state.rooms.forEach(room => {
      this.createRoomSprite(room);
    });
    this.drawGrid();
  }

  private createRoomSprite(room: PlacedRoom): void {
    const pos = this.getPlotPosition(room.x, room.y);
    const container = this.add.container(pos.px, pos.py);
    container.setDepth(10);
    
    const isDark = !room.isActivated && room.level >= 1 && !room.isBuilding;
    const isHibernation = room.type === 'hibernation';
    
    const roomRect = this.add.rectangle(0, 0, TILE_SIZE - 10, TILE_SIZE - 10);
    if (isDark) {
      roomRect.setFillStyle(0x000000, 0.9);
      roomRect.setStrokeStyle(2, 0x333333, 0.8);
    } else if (isHibernation) {
      roomRect.setFillStyle(0x660000, 1);
      roomRect.setStrokeStyle(3, 0xff0000, 1);
    } else {
      const color = this.getRoomColor(room.type);
      roomRect.setFillStyle(color, 1);
      roomRect.setStrokeStyle(3, 0xffffff, 1);
    }
    container.add(roomRect);
    
    const data = spaceRooms[room.type];
    const icon = this.add.text(0, -15, this.getRoomIcon(room.type), {
      fontSize: isDark ? '24px' : '28px',
      color: isDark ? '#444444' : '#ffffff',
    }).setOrigin(0.5);
    container.add(icon);
    
    const nameText = this.add.text(0, 15, data.name, {
      fontSize: '11px',
      color: isDark ? '#555555' : '#ffffff',
      fontStyle: isDark ? 'normal' : 'bold',
    }).setOrigin(0.5);
    container.add(nameText);
    
    const statusText = this.add.text(0, 30, '', {
      fontSize: '10px',
      color: '#fbbf24',
    }).setOrigin(0.5);
    container.add(statusText);
    
    container.setInteractive(
      new Phaser.Geom.Rectangle(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.onRoomClick(room);
    });
    
    this.roomSprites.set(room.id, container);
    this.updateRoomSprite(room);
  }

  private getRoomColor(type: RoomType): number {
    const colors: Record<string, number> = {
      hibernation: 0x660000,
      generator: 0xfbbf24,
      bridge: 0x3b82f6,
      o2Recycler: 0x06b6d4,
      salvageWorkshop: 0x8b5cf6,
      warehouse: 0x64748b,
      airlock: 0x10b981,
      energyRefinery: 0xf59e0b,
      repairDock: 0xef4444,
      lifeSupport: 0x14b8a6,
      engineRoom: 0xdc2626,
      researchTerminal: 0x6366f1,
      crewQuarters: 0x84cc16,
    };
    return colors[type] || 0x6b7280;
  }

  private getRoomIcon(type: RoomType): string {
    const icons: Record<string, string> = {
      hibernation: '❄️',
      generator: '⚡',
      bridge: '🎛️',
      o2Recycler: '💨',
      salvageWorkshop: '🔧',
      warehouse: '📦',
      airlock: '🚪',
      energyRefinery: '🔋',
      repairDock: '🛠️',
      lifeSupport: '💚',
      engineRoom: '🚀',
      researchTerminal: '💻',
      crewQuarters: '🛏️',
    };
    return icons[type] || '❓';
  }

  private updateRoomSprite(room: PlacedRoom): void {
    const container = this.roomSprites.get(room.id);
    if (!container) return;

    const roomRect = container.getAt(0) as Phaser.GameObjects.Rectangle;
    const icon = container.getAt(1) as Phaser.GameObjects.Text;
    const nameText = container.getAt(2) as Phaser.GameObjects.Text;
    const statusText = container.getAt(3) as Phaser.GameObjects.Text;

    const isDark = !room.isActivated && room.level >= 1 && !room.isBuilding;
    const isHibernation = room.type === 'hibernation';

    if (isDark) {
      roomRect.setFillStyle(0x000000, 0.9);
      roomRect.setStrokeStyle(2, 0x333333, 0.8);
      icon.setColor('#444444');
      icon.setFontSize('24px');
      nameText.setColor('#555555');
      nameText.setFontStyle('normal');
    } else if (isHibernation) {
      roomRect.setFillStyle(0x660000, 1);
      roomRect.setStrokeStyle(3, 0xff0000, 1);
      icon.setColor('#ffffff');
      nameText.setColor('#ffffff');
    } else {
      const color = this.getRoomColor(room.type);
      roomRect.setFillStyle(color, 1);
      roomRect.setStrokeStyle(3, 0xffffff, 1);
      icon.setColor('#ffffff');
      icon.setFontSize('28px');
      nameText.setColor('#ffffff');
      nameText.setFontStyle('bold');
    }

    if (room.isBuilding) {
      const remaining = room.buildEndTime ? Math.ceil((room.buildEndTime - Date.now()) / 1000) : 0;
      statusText.setText(`${this.formatTime(remaining)}`);
      statusText.setVisible(true);
    } else if (room.level > 0) {
      statusText.setText(`Lv.${room.level}`);
      statusText.setVisible(!isDark);
    } else {
      statusText.setVisible(false);
    }

    const data = spaceRooms[room.type];
    const levelData = data.levels[room.level - 1];
    
    if (levelData?.production && room.isActivated && !room.isBuilding && room.accumulatedResources > 0) {
      let collectIcon = container.getAt(4) as Phaser.GameObjects.Text;
      if (!collectIcon) {
        collectIcon = this.add.text(30, -30, '💰', {
          fontSize: '20px',
        }).setOrigin(0.5);
        container.add(collectIcon);
      }
      collectIcon.setVisible(true);
    } else {
      const collectIcon = container.getAt(4) as Phaser.GameObjects.Text;
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
    this.createBottomButtons();
  }

  private createResourceBar(): void {
    const bg = this.add.rectangle(
      this.scale.width / 2,
      TOP_BAR_HEIGHT / 2,
      this.scale.width,
      TOP_BAR_HEIGHT,
      0x0f0f1e,
      0.95
    );
    bg.setScrollFactor(0);
    bg.setDepth(1000);
    
    const resources = [
      { key: 'scrapAlloy', icon: '🔩', color: '#94a3b8', name: spaceStrings.scrapAlloy },
      { key: 'energyCores', icon: '🔋', color: '#fbbf24', name: spaceStrings.energyCores },
      { key: 'oxygen', icon: '💨', color: '#06b6d4', name: spaceStrings.oxygen },
      { key: 'parts', icon: '⚙️', color: '#8b5cf6', name: spaceStrings.parts },
    ];
    
    const startX = 10;
    const itemWidth = 90;
    
    resources.forEach((res, i) => {
      const x = startX + i * itemWidth;
      
      const icon = this.add.text(x, 20, res.icon, {
        fontSize: '18px',
      });
      icon.setScrollFactor(0);
      icon.setDepth(1001);
      
      const text = this.add.text(x + 25, 20, '0', {
        fontSize: '14px',
        color: res.color,
        fontStyle: 'bold',
      });
      text.setScrollFactor(0);
      text.setDepth(1001);
      this.resourceTexts.set(res.key, text);
    });
    
    const powerX = startX + 4 * itemWidth + 10;
    this.add.text(powerX, 20, '⚡', { fontSize: '18px' }).setScrollFactor(0).setDepth(1001);
    this.powerText = this.add.text(powerX + 25, 20, '0/0', {
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
    });
    this.powerText.setScrollFactor(0);
    this.powerText.setDepth(1001);
    
    const hullX = powerX + 80;
    this.add.text(hullX, 20, '🛡️', { fontSize: '18px' }).setScrollFactor(0).setDepth(1001);
    this.hullText = this.add.text(hullX + 25, 20, '100%', {
      fontSize: '14px',
      color: '#10b981',
      fontStyle: 'bold',
    });
    this.hullText.setScrollFactor(0);
    this.hullText.setDepth(1001);
    
    this.add.text(10, 48, spaceStrings.emergencyPower, {
      fontSize: '11px',
      color: '#ff6666',
    }).setScrollFactor(0).setDepth(1001);
    
    this.emergencyPowerText = this.add.text(10, 62, '13.5h', {
      fontSize: '14px',
      color: '#ff6666',
      fontStyle: 'bold',
    });
    this.emergencyPowerText.setScrollFactor(0);
    this.emergencyPowerText.setDepth(1001);
  }

  private createBottomButtons(): void {
    const bottomBarBg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - BOTTOM_BAR_HEIGHT / 2,
      this.scale.width,
      BOTTOM_BAR_HEIGHT,
      0x0f0f1e,
      0.95
    );
    bottomBarBg.setScrollFactor(0);
    bottomBarBg.setDepth(1000);

    const buttons = [
      { x: this.scale.width / 4, icon: '📋', label: spaceStrings.checklistTitle.slice(0, 4), action: () => this.toggleChecklistPanel() },
      { x: this.scale.width / 2, icon: '📦', label: spaceStrings.storyFragments, action: () => this.toggleFragmentsPanel() },
      { x: (this.scale.width / 4) * 3, icon: '⚙️', label: '設定', action: () => this.toggleSettingsPanel() },
    ];

    buttons.forEach(btnData => {
      const btn = this.add.rectangle(
        btnData.x,
        this.scale.height - BOTTOM_BAR_HEIGHT / 2,
        70,
        60,
        0x1e293b,
        1
      );
      btn.setScrollFactor(0);
      btn.setDepth(1001);
      btn.setStrokeStyle(2, 0x475569);
      btn.setInteractive();
      btn.on('pointerdown', btnData.action);
      
      const icon = this.add.text(btnData.x, this.scale.height - BOTTOM_BAR_HEIGHT / 2 - 10, btnData.icon, {
        fontSize: '24px',
      }).setOrigin(0.5);
      icon.setScrollFactor(0);
      icon.setDepth(1002);
      
      const label = this.add.text(btnData.x, this.scale.height - BOTTOM_BAR_HEIGHT / 2 + 15, btnData.label, {
        fontSize: '10px',
        color: '#ffffff',
      }).setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(1002);
    });
  }

  private showDialogue(text: string): void {
    if (this.dialogueBox) {
      this.dialogueBox.destroy();
    }

    const boxHeight = 60;
    const boxY = this.scale.height - BOTTOM_BAR_HEIGHT - boxHeight / 2 - 10;

    this.dialogueBox = this.add.container(0, 0);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(1500);

    const bg = this.add.rectangle(
      this.scale.width / 2,
      boxY,
      this.scale.width - 40,
      boxHeight,
      0x1e1e2e,
      0.95
    );
    bg.setStrokeStyle(2, 0x3b82f6);
    this.dialogueBox.add(bg);

    const dialogueText = this.add.text(
      this.scale.width / 2,
      boxY,
      text,
      {
        fontSize: '14px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.scale.width - 80 },
      }
    ).setOrigin(0.5);
    this.dialogueBox.add(dialogueText);

    this.time.delayedCall(5000, () => {
      if (this.dialogueBox) {
        this.tweens.add({
          targets: this.dialogueBox.list,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.dialogueBox?.destroy();
            this.dialogueBox = null;
          },
        });
      }
    });
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
    if (!this.isDragging && !this.roomInfoPanel) {
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
    const room = state.rooms.find(r => r.x === x && r.y === y);
    
    if (room) {
      this.showRoomInfo(room);
    } else {
      this.selectedPlot = { x, y };
      this.showBuildMenu();
    }
  }

  private onRoomClick(room: PlacedRoom): void {
    this.showRoomInfo(room);
  }

  private showBuildMenu(): void {
    this.closeRoomInfo();
    
    if (!this.selectedPlot) return;
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    const buildMenu = this.add.container(menuX, menuY);
    buildMenu.setScrollFactor(0);
    buildMenu.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    buildMenu.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, spaceStrings.build, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    buildMenu.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => buildMenu.destroy());
    buildMenu.add(closeBtn);
    
    const buildableTypes: RoomType[] = [
      'o2Recycler', 'salvageWorkshop', 'warehouse', 'airlock',
      'energyRefinery', 'repairDock', 'lifeSupport', 'engineRoom'
    ];
    
    buildableTypes.forEach((type, i) => {
      const data = spaceRooms[type];
      const levelData = data.levels[0];
      const y = -menuHeight / 2 + 80 + i * 55;
      
      const check = this.gameState.canBuildRoom(type, this.selectedPlot!.x, this.selectedPlot!.y);
      const canBuild = check.canBuild;
      
      const itemBg = this.add.rectangle(0, y, menuWidth - 40, 50, canBuild ? 0x1e40af : 0x991b1b, 1);
      itemBg.setStrokeStyle(2, 0xffffff);
      if (canBuild) {
        itemBg.setInteractive();
        itemBg.on('pointerdown', () => {
          if (this.gameState.buildRoom(type, this.selectedPlot!.x, this.selectedPlot!.y)) {
            const state = this.gameState.getState();
            const newRoom = state.rooms.find(r => r.x === this.selectedPlot!.x && r.y === this.selectedPlot!.y);
            if (newRoom) {
              this.createRoomSprite(newRoom);
              this.drawGrid();
            }
            buildMenu.destroy();
          }
        });
      }
      buildMenu.add(itemBg);
      
      const nameText = this.add.text(-menuWidth / 2 + 30, y, `${this.getRoomIcon(type)} ${data.name}`, {
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      buildMenu.add(nameText);
      
      const costText = this.formatCost(levelData.cost);
      const cost = this.add.text(menuWidth / 2 - 30, y, costText, {
        fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(1, 0.5);
      buildMenu.add(cost);
      
      if (!canBuild && check.reason) {
        const reasonText = this.add.text(0, y + 18, check.reason, {
          fontSize: '10px',
          color: '#fca5a5',
        }).setOrigin(0.5, 0.5);
        buildMenu.add(reasonText);
      }
    });
  }

  private showRoomInfo(room: PlacedRoom): void {
    this.closeRoomInfo();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.roomInfoPanel = this.add.container(menuX, menuY);
    this.roomInfoPanel.setScrollFactor(0);
    this.roomInfoPanel.setDepth(3000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    bg.setInteractive(new Phaser.Geom.Rectangle(-menuWidth/2, -menuHeight/2, menuWidth, menuHeight), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });
    this.roomInfoPanel.add(bg);
    
    const data = spaceRooms[room.type];
    const title = this.add.text(
      0,
      -menuHeight / 2 + 30,
      `${this.getRoomIcon(room.type)} ${data.name}`,
      { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.roomInfoPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.closeRoomInfo();
    });
    this.roomInfoPanel.add(closeBtn);
    
    let yOffset = -menuHeight / 2 + 80;
    
    if (room.isBuilding) {
      const remaining = room.buildEndTime ? Math.ceil((room.buildEndTime - Date.now()) / 1000) : 0;
      const statusText = this.add.text(
        0,
        yOffset,
        `建造中: ${this.formatTime(remaining)}`,
        { fontSize: '16px', color: '#fbbf24', fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.roomInfoPanel.add(statusText);
      yOffset += 40;
      
      if (remaining <= 180 && remaining > 0) {
        const speedUpBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x10b981, 1);
        speedUpBtn.setStrokeStyle(2, 0xffffff);
        speedUpBtn.setInteractive();
        speedUpBtn.on('pointerdown', () => {
          if (this.gameState.speedUpBuilding(room.id)) {
            this.closeRoomInfo();
          }
        });
        this.roomInfoPanel.add(speedUpBtn);
        
        const speedUpText = this.add.text(0, yOffset, '立即完成', {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.roomInfoPanel.add(speedUpText);
        yOffset += 60;
      }
    } else if (room.level === 0) {
      const buildingText = this.add.text(0, yOffset, '正在建造...', {
        fontSize: '18px',
        color: '#fbbf24',
      }).setOrigin(0.5);
      this.roomInfoPanel.add(buildingText);
    } else {
      const levelText = this.add.text(0, yOffset, `${spaceStrings.level}: ${room.level}`, {
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.roomInfoPanel.add(levelText);
      yOffset += 40;
      
      if (!room.isActivated) {
        const activateBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x10b981, 1);
        activateBtn.setStrokeStyle(2, 0xffffff);
        activateBtn.setInteractive();
        activateBtn.on('pointerdown', () => {
          if (this.gameState.activateRoom(room.id)) {
            this.updateRoomSprite(room);
            this.closeRoomInfo();
            
            if (room.type === 'bridge') {
              this.showDialogue(spaceStrings.bridgeDialogue);
            } else if (room.type === 'o2Recycler') {
              this.showDialogue(spaceStrings.oxygenDialogue);
            } else if (room.type === 'airlock') {
              this.showDialogue(spaceStrings.airlockDialogue);
            }
          }
        });
        this.roomInfoPanel.add(activateBtn);
        
        const activateText = this.add.text(0, yOffset, spaceStrings.activate, {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.roomInfoPanel.add(activateText);
        yOffset += 60;
      } else {
        const levelData = data.levels[room.level - 1];
        if (levelData?.production) {
          const productionText = this.add.text(
            0,
            yOffset,
            `生產: ${levelData.production.amount}/${this.formatTime(levelData.production.interval)}`,
            { fontSize: '16px', color: '#10b981' }
          ).setOrigin(0.5);
          this.roomInfoPanel.add(productionText);
          yOffset += 30;
          
          const accumulated = Math.floor(room.accumulatedResources);
          const accText = this.add.text(0, yOffset, `已累積: ${accumulated}`, {
            fontSize: '16px',
            color: '#fbbf24',
          }).setOrigin(0.5);
          this.roomInfoPanel.add(accText);
          yOffset += 40;
          
          if (accumulated > 0) {
            const collectBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x059669, 1);
            collectBtn.setStrokeStyle(2, 0xffffff);
            collectBtn.setInteractive();
            collectBtn.on('pointerdown', () => {
              const collected = this.gameState.collectFromRoom(room.id);
              if (collected > 0) {
                this.closeRoomInfo();
              }
            });
            this.roomInfoPanel.add(collectBtn);
            
            const collectText = this.add.text(0, yOffset, `${spaceStrings.collect} (${accumulated})`, {
              fontSize: '18px',
              color: '#ffffff',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            this.roomInfoPanel.add(collectText);
            yOffset += 60;
          }
        }
        
        if (room.type === 'repairDock') {
          const state = this.gameState.getState();
          if (state.hullIntegrity < 100) {
            const repairBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0xef4444, 1);
            repairBtn.setStrokeStyle(2, 0xffffff);
            repairBtn.setInteractive();
            repairBtn.on('pointerdown', () => {
              const result = this.gameState.repairHull();
              if (result.success) {
                this.updateHullDisplay();
                this.showDialogue(spaceStrings.hullRepaired);
                this.closeRoomInfo();
              }
            });
            this.roomInfoPanel.add(repairBtn);
            
            const repairText = this.add.text(0, yOffset, `${spaceStrings.repair} (+10%)`, {
              fontSize: '18px',
              color: '#ffffff',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            this.roomInfoPanel.add(repairText);
            
            const costText = this.add.text(0, yOffset + 20, '🔩15 🔋3', {
              fontSize: '12px',
              color: '#aaaaaa',
            }).setOrigin(0.5);
            this.roomInfoPanel.add(costText);
            yOffset += 60;
          }
        }
        
        if (room.type === 'airlock') {
          const evaBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 50, 0x06b6d4, 1);
          evaBtn.setStrokeStyle(2, 0xffffff);
          evaBtn.setInteractive();
          evaBtn.on('pointerdown', () => {
            const targetX = Math.floor(Math.random() * 200) - 100;
            const targetY = Math.floor(Math.random() * 200) - 100;
            if (this.gameState.startEVA(targetX, targetY)) {
              this.visualizeEVA(targetX, targetY);
              this.showDialogue(spaceStrings.evaDialogue);
              this.closeRoomInfo();
            }
          });
          this.roomInfoPanel.add(evaBtn);
          
          const evaText = this.add.text(0, yOffset, 'EVA 任務', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          this.roomInfoPanel.add(evaText);
          yOffset += 60;
        }
        
        if (room.type === 'engineRoom') {
          const state = this.gameState.getState();
          if (state.engineIgnitable && !state.hasLanded) {
            const igniteBtn = this.add.rectangle(0, yOffset, menuWidth - 60, 60, 0xdc2626, 1);
            igniteBtn.setStrokeStyle(3, 0xff0000);
            igniteBtn.setInteractive();
            igniteBtn.on('pointerdown', () => {
              this.playLandingSequence();
            });
            this.roomInfoPanel.add(igniteBtn);
            
            const igniteText = this.add.text(0, yOffset, `${spaceStrings.ignite} 🚀`, {
              fontSize: '20px',
              color: '#ffffff',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            this.roomInfoPanel.add(igniteText);
            yOffset += 70;
          }
        }
      }
    }
  }

  private closeRoomInfo(): void {
    if (this.roomInfoPanel) {
      this.roomInfoPanel.destroy();
      this.roomInfoPanel = null;
    }
  }

  private visualizeEVA(targetX: number, targetY: number): void {
    if (this.evaSprite) {
      this.evaSprite.destroy();
    }

    const state = this.gameState.getState();
    const airlock = state.rooms.find(r => r.type === 'airlock');
    if (!airlock) return;

    const startPos = this.getPlotPosition(airlock.x, airlock.y);
    
    this.evaSprite = this.add.container(startPos.px, startPos.py);
    this.evaSprite.setDepth(50);

    const pod = this.add.circle(0, 0, 8, 0x06b6d4, 1);
    pod.setStrokeStyle(2, 0xffffff);
    this.evaSprite.add(pod);
    
    const astronaut = this.add.text(0, 0, '🧑‍🚀', {
      fontSize: '16px',
    }).setOrigin(0.5);
    this.evaSprite.add(astronaut);

    const eva = state.evaTrips[state.evaTrips.length - 1];
    const duration = eva.endTime - eva.startTime;

    this.tweens.add({
      targets: this.evaSprite,
      x: startPos.px + targetX,
      y: startPos.py + targetY,
      duration: duration / 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.evaSprite,
          x: startPos.px,
          y: startPos.py,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (this.evaSprite) {
              this.evaSprite.destroy();
              this.evaSprite = null;
            }
            this.showDialogue(spaceStrings.evaComplete);
          },
        });
      },
    });
  }

  private toggleChecklistPanel(): void {
    if (this.checklistPanel) {
      this.checklistPanel.destroy();
      this.checklistPanel = null;
      return;
    }
    
    this.closeFragmentsPanel();
    this.closeSettingsPanel();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.checklistPanel = this.add.container(menuX, menuY);
    this.checklistPanel.setScrollFactor(0);
    this.checklistPanel.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.checklistPanel.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, spaceStrings.checklistTitle, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.checklistPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.checklistPanel!.destroy();
      this.checklistPanel = null;
    });
    this.checklistPanel.add(closeBtn);
    
    const state = this.gameState.getState();
    
    const checks = [
      { label: spaceStrings.checklistAllSystems, done: this.checkAllSystems() },
      { label: spaceStrings.checklistHull, done: state.hullIntegrity >= 70 },
      { label: spaceStrings.checklistEVA, done: state.evaCompletedCount >= 2 },
      { label: spaceStrings.checklistEngine, done: state.engineIgnitable },
      { label: spaceStrings.checklistResources, done: this.checkResourcesForLanding() },
    ];
    
    let yOffset = -menuHeight / 2 + 80;
    checks.forEach((check, i) => {
      const y = yOffset + i * 50;
      
      const checkmark = this.add.text(-menuWidth / 2 + 30, y, check.done ? '✓' : '✗', {
        fontSize: '24px',
        color: check.done ? '#10b981' : '#ef4444',
      }).setOrigin(0, 0.5);
      this.checklistPanel!.add(checkmark);
      
      const label = this.add.text(-menuWidth / 2 + 60, y, check.label, {
        fontSize: '16px',
        color: check.done ? '#10b981' : '#ffffff',
      }).setOrigin(0, 0.5);
      this.checklistPanel!.add(label);
    });
    
    yOffset += checks.length * 50 + 20;
    
    const canLand = this.gameState.canLand();
    const statusText = this.add.text(0, yOffset, canLand ? spaceStrings.checklistReady : spaceStrings.checklistNotReady, {
      fontSize: '18px',
      color: canLand ? '#10b981' : '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.checklistPanel.add(statusText);
  }

  private checkAllSystems(): boolean {
    const state = this.gameState.getState();
    const requiredRooms: RoomType[] = [
      'generator', 'bridge', 'o2Recycler', 'salvageWorkshop',
      'warehouse', 'airlock', 'energyRefinery', 'repairDock',
      'lifeSupport', 'engineRoom'
    ];
    return requiredRooms.every(type =>
      state.rooms.some(r => r.type === type && r.level >= 1 && r.isActivated)
    );
  }

  private checkResourcesForLanding(): boolean {
    const state = this.gameState.getState();
    return (
      state.resources.scrapAlloy >= 40 &&
      state.resources.energyCores >= 15 &&
      state.resources.oxygen >= 20
    );
  }

  private toggleFragmentsPanel(): void {
    if (this.fragmentsPanel) {
      this.fragmentsPanel.destroy();
      this.fragmentsPanel = null;
      return;
    }
    
    this.closeChecklistPanel();
    this.closeSettingsPanel();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 500;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.fragmentsPanel = this.add.container(menuX, menuY);
    this.fragmentsPanel.setScrollFactor(0);
    this.fragmentsPanel.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.fragmentsPanel.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, spaceStrings.storyFragments, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.fragmentsPanel.add(title);
    
    const closeBtn = this.add.text(menuWidth / 2 - 30, -menuHeight / 2 + 30, '✕', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.fragmentsPanel!.destroy();
      this.fragmentsPanel = null;
    });
    this.fragmentsPanel.add(closeBtn);
    
    const state = this.gameState.getState();
    
    let yOffset = -menuHeight / 2 + 80;
    state.storyFragments.forEach((fragment, i) => {
      const y = yOffset + i * 100;
      
      const fragmentTitle = this.add.text(-menuWidth / 2 + 30, y, fragment.found ? fragment.title : '???', {
        fontSize: '16px',
        color: fragment.found ? '#ffffff' : '#555555',
        fontStyle: 'bold',
      }).setOrigin(0, 0);
      this.fragmentsPanel!.add(fragmentTitle);
      
      const fragmentText = this.add.text(-menuWidth / 2 + 30, y + 25, fragment.found ? fragment.text : '未發現', {
        fontSize: '13px',
        color: fragment.found ? '#aaaaaa' : '#333333',
        wordWrap: { width: menuWidth - 60 },
      }).setOrigin(0, 0);
      this.fragmentsPanel!.add(fragmentText);
    });
  }

  private closeChecklistPanel(): void {
    if (this.checklistPanel) {
      this.checklistPanel.destroy();
      this.checklistPanel = null;
    }
  }

  private closeFragmentsPanel(): void {
    if (this.fragmentsPanel) {
      this.fragmentsPanel.destroy();
      this.fragmentsPanel = null;
    }
  }

  private toggleSettingsPanel(): void {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
      return;
    }
    
    this.closeChecklistPanel();
    this.closeFragmentsPanel();
    
    const menuWidth = Math.min(this.scale.width - 40, 400);
    const menuHeight = 300;
    const menuX = this.scale.width / 2;
    const menuY = this.scale.height / 2;
    
    this.settingsPanel = this.add.container(menuX, menuY);
    this.settingsPanel.setScrollFactor(0);
    this.settingsPanel.setDepth(2000);
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0x3b82f6);
    this.settingsPanel.add(bg);
    
    const title = this.add.text(0, -menuHeight / 2 + 30, '設定', {
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
    
    const debugBtn = this.add.rectangle(0, -20, menuWidth - 80, 60, 0x3b82f6, 1);
    debugBtn.setStrokeStyle(2, 0xffffff);
    debugBtn.setInteractive();
    debugBtn.on('pointerdown', () => {
      this.gameState.toggleDebugFastMode();
      this.closeSettingsPanel();
    });
    this.settingsPanel.add(debugBtn);
    
    const debugText = this.add.text(0, -20, spaceStrings.debugFastMode, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.settingsPanel.add(debugText);
    
    const resetBtn = this.add.rectangle(0, 60, menuWidth - 80, 60, 0xef4444, 1);
    resetBtn.setStrokeStyle(2, 0xffffff);
    resetBtn.setInteractive();
    resetBtn.on('pointerdown', () => this.confirmReset());
    this.settingsPanel.add(resetBtn);
    
    const resetText = this.add.text(0, 60, spaceStrings.restart, {
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
    
    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x0f0f1e, 0.98);
    bg.setStrokeStyle(3, 0xef4444);
    confirmPanel.add(bg);
    
    const text = this.add.text(0, -30, '確定要重新開始嗎？', {
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
    
    const yesText = this.add.text(-80, 40, '確定', {
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
    
    const noText = this.add.text(80, 40, '取消', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmPanel.add(noText);
  }

  private playLandingSequence(): void {
    this.closeRoomInfo();
    
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    
    const landingScreen = this.add.container(0, 0);
    landingScreen.setScrollFactor(0);
    landingScreen.setDepth(10000);
    
    const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0);
    landingScreen.add(bg);
    
    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 1000,
    });
    
    const engineText = this.add.text(centerX, centerY - 50, '🚀', {
      fontSize: '64px',
    }).setOrigin(0.5).setAlpha(0);
    landingScreen.add(engineText);
    
    this.tweens.add({
      targets: engineText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.5 },
      duration: 2000,
      ease: 'Back.easeOut',
    });
    
    this.time.delayedCall(2500, () => {
      engineText.destroy();
      
      const successText = this.add.text(centerX, centerY - 40, spaceStrings.landingSuccess, {
        fontSize: '32px',
        color: '#10b981',
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);
      landingScreen.add(successText);
      
      const messageText = this.add.text(centerX, centerY + 20, spaceStrings.landingMessage, {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5).setAlpha(0);
      landingScreen.add(messageText);
      
      this.tweens.add({
        targets: [successText, messageText],
        alpha: 1,
        duration: 1500,
      });
      
      const restartBtn = this.add.rectangle(centerX, centerY + 100, 200, 60, 0x3b82f6, 1);
      restartBtn.setStrokeStyle(2, 0xffffff);
      restartBtn.setInteractive();
      restartBtn.on('pointerdown', () => {
        this.gameState.land();
        this.gameState.resetProgress();
        this.scene.restart();
      });
      landingScreen.add(restartBtn);
      
      const restartText = this.add.text(centerX, centerY + 100, spaceStrings.restart, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      landingScreen.add(restartText);
      
      this.tweens.add({
        targets: [restartBtn, restartText],
        alpha: { from: 0, to: 1 },
        duration: 1000,
        delay: 1500,
      });
    });
  }

  private formatCost(cost: RoomCost): string {
    const parts: string[] = [];
    if (cost.scrapAlloy) parts.push(`🔩${cost.scrapAlloy}`);
    if (cost.energyCores) parts.push(`🔋${cost.energyCores}`);
    if (cost.oxygen) parts.push(`💨${cost.oxygen}`);
    if (cost.parts) parts.push(`⚙️${cost.parts}`);
    return parts.join(' ');
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}${spaceStrings.seconds}`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${spaceStrings.minutes}`;
    return `${Math.floor(seconds / 3600)}${spaceStrings.hours}`;
  }

  private updateGame(): void {
    this.gameState.update();
    this.gameState.updateWarehouseCapacity();
    
    const state = this.gameState.getState();
    
    this.resourceTexts.get('scrapAlloy')?.setText(Math.floor(state.resources.scrapAlloy).toString());
    this.resourceTexts.get('energyCores')?.setText(Math.floor(state.resources.energyCores).toString());
    this.resourceTexts.get('oxygen')?.setText(Math.floor(state.resources.oxygen).toString());
    this.resourceTexts.get('parts')?.setText(Math.floor(state.resources.parts).toString());
    
    this.updatePowerDisplay();
    this.updateHullDisplay();
    this.updateEmergencyPowerDisplay();
    
    state.rooms.forEach(room => {
      this.updateRoomSprite(room);
      
      const data = spaceRooms[room.type];
      const levelData = data.levels[room.level - 1];
      
      if (levelData?.production && room.isActivated && !room.isBuilding) {
        const productionPerSecond = levelData.production.amount / levelData.production.interval;
        room.accumulatedResources += productionPerSecond;
      }
    });
  }

  private updatePowerDisplay(): void {
    const state = this.gameState.getState();
    this.powerText.setText(`${state.powerUsed}/${state.powerCapacity}`);
    
    if (state.powerUsed > state.powerCapacity) {
      this.powerText.setColor('#ef4444');
    } else if (state.powerUsed === state.powerCapacity) {
      this.powerText.setColor('#fbbf24');
    } else {
      this.powerText.setColor('#10b981');
    }
  }

  private updateHullDisplay(): void {
    const state = this.gameState.getState();
    this.hullText.setText(`${Math.floor(state.hullIntegrity)}%`);
    
    if (state.hullIntegrity < 40) {
      this.hullText.setColor('#ef4444');
    } else if (state.hullIntegrity < 70) {
      this.hullText.setColor('#fbbf24');
    } else {
      this.hullText.setColor('#10b981');
    }
  }

  private updateEmergencyPowerDisplay(): void {
    const remaining = this.gameState.getRemainingEmergencyPower();
    const hours = remaining / (60 * 60 * 1000);
    
    if (hours > 0) {
      this.emergencyPowerText.setText(`${hours.toFixed(1)}h`);
      
      if (hours < 3) {
        this.emergencyPowerText.setColor('#ef4444');
      } else if (hours < 7) {
        this.emergencyPowerText.setColor('#fbbf24');
      } else {
        this.emergencyPowerText.setColor('#ff6666');
      }
    } else {
      this.emergencyPowerText.setText('0.0h');
      this.emergencyPowerText.setColor('#888888');
    }
  }

  update(): void {
  }
}
