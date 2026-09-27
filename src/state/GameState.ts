import { GameStateData, PlacedBuilding, Quest, Resources, BuildingType, BuildingCost } from '../types';
import { buildingsData } from '../config/buildingsData';
import { strings } from '../config/strings';

const SAVE_KEY = 'slg-town-builder-save';

export class GameState {
  private state: GameStateData;
  private saveInterval: number | null = null;

  constructor() {
    this.state = this.loadState() || this.createInitialState();
    this.processOfflineProgress();
    this.startAutoSave();
  }

  private createInitialState(): GameStateData {
    return {
      resources: {
        food: 1000,
        wood: 1000,
        steel: 100,
        electricity: 0,
      },
      storageCapacity: 10000,
      buildings: [
        {
          id: 'hq-1',
          type: 'headquarters',
          x: 5,
          y: 5,
          level: 1,
          isBuilding: false,
          lastCollectionTime: Date.now(),
          accumulatedResources: 0,
        },
      ],
      buildQueue: [],
      maxBuilders: 2,
      quests: this.createQuests(),
      lastSaveTime: Date.now(),
      hqLevel: 1,
    };
  }

  private createQuests(): Quest[] {
    return [
      {
        id: 'quest1',
        title: strings.quest1Title,
        description: strings.quest1Desc,
        completed: false,
        claimed: false,
        reward: { food: 200, wood: 200, steel: 0, electricity: 0 },
        checkComplete: (state) => state.buildings.some(b => b.type === 'farm' && b.level >= 1 && !b.isBuilding),
      },
      {
        id: 'quest2',
        title: strings.quest2Title,
        description: strings.quest2Desc,
        completed: false,
        claimed: false,
        reward: { food: 300, wood: 300, steel: 0, electricity: 0 },
        checkComplete: (state) => {
          const quest1 = state.quests.find(q => q.id === 'quest1');
          return quest1 ? quest1.claimed : false;
        },
      },
      {
        id: 'quest3',
        title: strings.quest3Title,
        description: strings.quest3Desc,
        completed: false,
        claimed: false,
        reward: { food: 500, wood: 500, steel: 100, electricity: 0 },
        checkComplete: (state) => state.hqLevel >= 2,
      },
      {
        id: 'quest4',
        title: strings.quest4Title,
        description: strings.quest4Desc,
        completed: false,
        claimed: false,
        reward: { food: 400, wood: 400, steel: 50, electricity: 0 },
        checkComplete: (state) => state.buildings.some(b => b.type === 'lumberMill' && b.level >= 1 && !b.isBuilding),
      },
      {
        id: 'quest5',
        title: strings.quest5Title,
        description: strings.quest5Desc,
        completed: false,
        claimed: false,
        reward: { food: 600, wood: 600, steel: 200, electricity: 0 },
        checkComplete: (state) => state.buildings.some(b => b.type === 'steelMine' && b.level >= 1 && !b.isBuilding),
      },
    ];
  }

  private loadState(): GameStateData | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        state.quests = this.createQuests();
        return state;
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
    return null;
  }

  public save(): void {
    this.state.lastSaveTime = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  private startAutoSave(): void {
    this.saveInterval = window.setInterval(() => {
      this.save();
    }, 10000);
  }

  public resetProgress(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    localStorage.removeItem(SAVE_KEY);
    this.state = this.createInitialState();
    this.startAutoSave();
  }

  private processOfflineProgress(): void {
    const now = Date.now();
    const elapsed = (now - this.state.lastSaveTime) / 1000;

    this.state.buildings.forEach(building => {
      if (building.isBuilding && building.buildEndTime) {
        if (now >= building.buildEndTime) {
          building.isBuilding = false;
          building.level++;
          delete building.buildEndTime;
          delete building.buildStartTime;
          
          if (building.type === 'headquarters') {
            this.state.hqLevel = building.level;
          }
        }
      }

      const data = buildingsData[building.type];
      const levelData = data.levels[building.level - 1];
      
      if (levelData?.production && !building.isBuilding) {
        const productionPerSecond = levelData.production.amount / levelData.production.interval;
        const produced = productionPerSecond * elapsed;
        building.accumulatedResources += produced;
      }
    });

    this.state.buildQueue = this.state.buildQueue.filter(job => {
      if (now >= job.endTime) {
        const building = this.state.buildings.find(b => b.id === job.buildingId);
        if (building) {
          building.isBuilding = false;
          building.level++;
          delete building.buildEndTime;
          delete building.buildStartTime;
          
          if (building.type === 'headquarters') {
            this.state.hqLevel = building.level;
          }
        }
        return false;
      }
      return true;
    });
  }

  public update(): void {
    this.updateQuests();
  }

  private updateQuests(): void {
    this.state.quests.forEach(quest => {
      if (!quest.completed) {
        quest.completed = quest.checkComplete(this.state);
      }
    });
  }

  public getState(): GameStateData {
    return this.state;
  }

  public getResources(): Resources {
    return { ...this.state.resources };
  }

  public canAfford(cost: BuildingCost): boolean {
    return (
      this.state.resources.food >= (cost.food || 0) &&
      this.state.resources.wood >= (cost.wood || 0) &&
      this.state.resources.steel >= (cost.steel || 0) &&
      this.state.resources.electricity >= (cost.electricity || 0)
    );
  }

  public spendResources(cost: BuildingCost): void {
    this.state.resources.food -= cost.food || 0;
    this.state.resources.wood -= cost.wood || 0;
    this.state.resources.steel -= cost.steel || 0;
    this.state.resources.electricity -= cost.electricity || 0;
  }

  public addResources(resources: Resources): void {
    this.state.resources.food = Math.min(
      this.state.resources.food + (resources.food || 0),
      this.state.storageCapacity
    );
    this.state.resources.wood = Math.min(
      this.state.resources.wood + (resources.wood || 0),
      this.state.storageCapacity
    );
    this.state.resources.steel = Math.min(
      this.state.resources.steel + (resources.steel || 0),
      this.state.storageCapacity
    );
    this.state.resources.electricity = Math.min(
      this.state.resources.electricity + (resources.electricity || 0),
      this.state.storageCapacity
    );
  }

  public collectFromBuilding(buildingId: string): number {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building) return 0;

    const amount = Math.floor(building.accumulatedResources);
    if (amount <= 0) return 0;

    const data = buildingsData[building.type];
    const levelData = data.levels[building.level - 1];
    
    if (levelData?.production) {
      const resourceType = levelData.production.type;
      const before = this.state.resources[resourceType];
      this.addResources({ 
        food: resourceType === 'food' ? amount : 0,
        wood: resourceType === 'wood' ? amount : 0,
        steel: resourceType === 'steel' ? amount : 0,
        electricity: resourceType === 'electricity' ? amount : 0,
      });
      const actualCollected = this.state.resources[resourceType] - before;
      building.accumulatedResources -= actualCollected;
      building.lastCollectionTime = Date.now();
      return actualCollected;
    }

    return 0;
  }

  public canBuild(type: BuildingType, x: number, y: number): { 
    canBuild: boolean; 
    reason?: string;
  } {
    const data = buildingsData[type];
    if (!data) return { canBuild: false, reason: 'Invalid building type' };

    const levelData = data.levels[0];
    if (levelData.requiredHQLevel && this.state.hqLevel < levelData.requiredHQLevel) {
      return { canBuild: false, reason: strings.hqLevelRequired };
    }

    if (!this.canAfford(levelData.cost)) {
      return { canBuild: false, reason: strings.notEnoughResources };
    }

    const existingBuilding = this.state.buildings.find(b => b.x === x && b.y === y);
    if (existingBuilding) {
      return { canBuild: false, reason: 'Plot occupied' };
    }

    if (this.state.buildQueue.length >= this.state.maxBuilders) {
      return { canBuild: false, reason: strings.buildersOccupied };
    }

    return { canBuild: true };
  }

  public buildBuilding(type: BuildingType, x: number, y: number): boolean {
    const check = this.canBuild(type, x, y);
    if (!check.canBuild) return false;

    const data = buildingsData[type];
    const levelData = data.levels[0];
    
    this.spendResources(levelData.cost);

    const building: PlacedBuilding = {
      id: `${type}-${Date.now()}`,
      type,
      x,
      y,
      level: 0,
      isBuilding: true,
      buildStartTime: Date.now(),
      buildEndTime: Date.now() + levelData.buildTime * 1000,
      lastCollectionTime: Date.now(),
      accumulatedResources: 0,
    };

    this.state.buildings.push(building);
    this.state.buildQueue.push({
      buildingId: building.id,
      endTime: building.buildEndTime!,
    });

    return true;
  }

  public canUpgradeBuilding(buildingId: string): { 
    canUpgrade: boolean; 
    reason?: string;
  } {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building) return { canUpgrade: false, reason: 'Building not found' };

    if (building.isBuilding) {
      return { canUpgrade: false, reason: strings.buildingInProgress };
    }

    const data = buildingsData[building.type];
    if (building.level >= data.maxLevel) {
      return { canUpgrade: false, reason: strings.maxLevelReached };
    }

    const nextLevelData = data.levels[building.level];
    if (nextLevelData.requiredHQLevel && this.state.hqLevel < nextLevelData.requiredHQLevel) {
      return { canUpgrade: false, reason: strings.hqLevelRequired };
    }

    if (!this.canAfford(nextLevelData.cost)) {
      return { canUpgrade: false, reason: strings.notEnoughResources };
    }

    if (this.state.buildQueue.length >= this.state.maxBuilders) {
      return { canUpgrade: false, reason: strings.buildersOccupied };
    }

    return { canUpgrade: true };
  }

  public upgradeBuilding(buildingId: string): boolean {
    const check = this.canUpgradeBuilding(buildingId);
    if (!check.canUpgrade) return false;

    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building) return false;

    const data = buildingsData[building.type];
    const nextLevelData = data.levels[building.level];
    
    this.spendResources(nextLevelData.cost);

    building.isBuilding = true;
    building.buildStartTime = Date.now();
    building.buildEndTime = Date.now() + nextLevelData.buildTime * 1000;

    this.state.buildQueue.push({
      buildingId: building.id,
      endTime: building.buildEndTime,
    });

    return true;
  }

  public speedUpBuilding(buildingId: string): boolean {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building || !building.isBuilding || !building.buildEndTime) return false;

    const remaining = building.buildEndTime - Date.now();
    if (remaining <= 0 || remaining > 180000) return false;

    building.isBuilding = false;
    building.level++;
    delete building.buildEndTime;
    delete building.buildStartTime;

    if (building.type === 'headquarters') {
      this.state.hqLevel = building.level;
    }

    this.state.buildQueue = this.state.buildQueue.filter(job => job.buildingId !== buildingId);

    return true;
  }

  public claimQuestReward(questId: string): boolean {
    const quest = this.state.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return false;

    this.addResources(quest.reward);
    quest.claimed = true;
    return true;
  }

  public updateWarehouseCapacity(): void {
    let totalCapacity = 10000;
    this.state.buildings.forEach(building => {
      if (building.type === 'warehouse' && !building.isBuilding) {
        const data = buildingsData[building.type];
        const levelData = data.levels[building.level - 1];
        if (levelData?.storageIncrease) {
          totalCapacity += levelData.storageIncrease;
        }
      }
    });
    this.state.storageCapacity = totalCapacity;
  }
}
