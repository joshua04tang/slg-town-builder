import { SpaceGameStateData, PlacedRoom, SpaceResources, RoomType, EVATrip, StoryFragment, SpaceQuest, RoomCost } from '../spaceTypes';
import { spaceRooms } from '../config/spaceRooms';
import { spaceStrings } from '../config/spaceStrings';

const SAVE_KEY = 'space-ship-rebuild-save';
const EMERGENCY_POWER_DURATION = 13.5 * 60 * 60 * 1000; // 13.5 hours in ms

export class SpaceGameState {
  private state: SpaceGameStateData;
  private saveInterval: number | null = null;

  constructor() {
    this.state = this.loadState() || this.createInitialState();
    this.processOfflineProgress();
    this.startAutoSave();
  }

  private createInitialState(): SpaceGameStateData {
    // Ship layout: 5x5 grid with hibernation in center
    const hibernationRoom: PlacedRoom = {
      id: 'hibernation-1',
      type: 'hibernation',
      x: 2,
      y: 2,
      level: 1,
      isBuilding: false,
      isActivated: true, // Always activated
      lastCollectionTime: Date.now(),
      accumulatedResources: 0,
    };

    return {
      resources: {
        scrapAlloy: 80,
        energyCores: 20,
        oxygen: 50,
        parts: 5,
      },
      storageCapacity: 500,
      powerCapacity: 0,
      powerUsed: 0,
      hullIntegrity: 40,
      rooms: [hibernationRoom],
      buildQueue: [],
      maxBuilders: 2,
      quests: this.createQuests(),
      evaTrips: [],
      evaCompletedCount: 0,
      storyFragments: this.createStoryFragments(),
      lastSaveTime: Date.now(),
      introSeen: false,
      wakeSeen: false,
      emergencyPowerTime: EMERGENCY_POWER_DURATION,
      emergencyPowerStart: 0,
      engineIgnitable: false,
      hasLanded: false,
      debugFastMode: false,
    };
  }

  private createQuests(): SpaceQuest[] {
    return [
      {
        id: 'quest1',
        title: spaceStrings.quest1Title,
        description: spaceStrings.quest1Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 20, energyCores: 5, oxygen: 10, parts: 1 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'generator' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest2',
        title: spaceStrings.quest2Title,
        description: spaceStrings.quest2Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 15, energyCores: 3, oxygen: 5, parts: 1 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'bridge' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest3',
        title: spaceStrings.quest3Title,
        description: spaceStrings.quest3Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 25, energyCores: 5, oxygen: 15, parts: 2 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'o2Recycler' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest4',
        title: spaceStrings.quest4Title,
        description: spaceStrings.quest4Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 30, energyCores: 8, oxygen: 10, parts: 2 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'salvageWorkshop' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest5',
        title: spaceStrings.quest5Title,
        description: spaceStrings.quest5Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 20, energyCores: 5, oxygen: 10, parts: 1 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'warehouse' && r.level >= 1),
      },
      {
        id: 'quest6',
        title: spaceStrings.quest6Title,
        description: spaceStrings.quest6Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 35, energyCores: 10, oxygen: 20, parts: 3 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'airlock' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest7',
        title: spaceStrings.quest7Title,
        description: spaceStrings.quest7Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 40, energyCores: 15, oxygen: 25, parts: 5 },
        checkComplete: (state) => state.evaCompletedCount >= 1,
      },
      {
        id: 'quest8',
        title: spaceStrings.quest8Title,
        description: spaceStrings.quest8Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 45, energyCores: 20, oxygen: 15, parts: 4 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'energyRefinery' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest9',
        title: spaceStrings.quest9Title,
        description: spaceStrings.quest9Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 50, energyCores: 25, oxygen: 20, parts: 6 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'repairDock' && r.level >= 1 && r.isActivated) && state.hullIntegrity >= 70,
      },
      {
        id: 'quest10',
        title: spaceStrings.quest10Title,
        description: spaceStrings.quest10Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 40, energyCores: 20, oxygen: 30, parts: 5 },
        checkComplete: (state) => state.rooms.some(r => r.type === 'lifeSupport' && r.level >= 1 && r.isActivated),
      },
      {
        id: 'quest11',
        title: spaceStrings.quest11Title,
        description: spaceStrings.quest11Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 60, energyCores: 30, oxygen: 30, parts: 10 },
        checkComplete: (state) => state.engineIgnitable,
      },
      {
        id: 'quest12',
        title: spaceStrings.quest12Title,
        description: spaceStrings.quest12Desc,
        completed: false,
        claimed: false,
        reward: { scrapAlloy: 0, energyCores: 0, oxygen: 0, parts: 0 },
        checkComplete: (state) => this.checkLandingReady(state),
      },
    ];
  }

  private createStoryFragments(): StoryFragment[] {
    return [
      {
        id: 'fragment1',
        title: spaceStrings.fragment1Title,
        text: spaceStrings.fragment1Text,
        found: false,
      },
      {
        id: 'fragment2',
        title: spaceStrings.fragment2Title,
        text: spaceStrings.fragment2Text,
        found: false,
      },
      {
        id: 'fragment3',
        title: spaceStrings.fragment3Title,
        text: spaceStrings.fragment3Text,
        found: false,
      },
    ];
  }

  private loadState(): SpaceGameStateData | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // Restore quests and fragments with proper functions
        state.quests = this.createQuests();
        state.storyFragments = this.createStoryFragments();
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

    // Process building completions
    this.state.rooms.forEach(room => {
      if (room.isBuilding && room.buildEndTime) {
        if (now >= room.buildEndTime) {
          room.isBuilding = false;
          room.level++;
          delete room.buildEndTime;
          delete room.buildStartTime;
        }
      }

      // Process resource production
      const data = spaceRooms[room.type];
      const levelData = data.levels[room.level - 1];
      
      if (levelData?.production && room.isActivated && !room.isBuilding) {
        const productionPerSecond = levelData.production.amount / levelData.production.interval;
        const produced = productionPerSecond * elapsed;
        room.accumulatedResources += produced;
      }
    });

    // Process build queue
    this.state.buildQueue = this.state.buildQueue.filter(job => {
      if (now >= job.endTime) {
        const room = this.state.rooms.find(r => r.id === job.roomId);
        if (room) {
          room.isBuilding = false;
          room.level++;
          delete room.buildEndTime;
          delete room.buildStartTime;
        }
        return false;
      }
      return true;
    });

    // Process EVA trips
    this.state.evaTrips = this.state.evaTrips.filter(eva => {
      if (now >= eva.endTime) {
        this.addResources(eva.rewards);
        this.state.evaCompletedCount++;
        return false;
      }
      return true;
    });

    // Update power capacity and usage
    this.updatePowerStats();
  }

  public update(): void {
    this.updateQuests();
    this.updatePowerStats();
    
    // Check if engine is ignitable
    const engineRoom = this.state.rooms.find(r => r.type === 'engineRoom');
    if (engineRoom && engineRoom.level >= 1 && engineRoom.isActivated && !engineRoom.isBuilding) {
      this.state.engineIgnitable = true;
    }
  }

  private updateQuests(): void {
    this.state.quests.forEach(quest => {
      if (!quest.completed) {
        quest.completed = quest.checkComplete(this.state);
      }
    });
  }

  private updatePowerStats(): void {
    let capacity = 0;
    let used = 0;

    this.state.rooms.forEach(room => {
      if (room.isActivated && !room.isBuilding) {
        const data = spaceRooms[room.type];
        const levelData = data.levels[room.level - 1];
        
        // Add provided power
        if (levelData.powerProvided) {
          capacity += levelData.powerProvided;
        }
        
        // Add required power
        if (data.powerRequired) {
          used += data.powerRequired;
        }
      }
    });

    this.state.powerCapacity = capacity;
    this.state.powerUsed = used;
  }

  public getState(): SpaceGameStateData {
    return this.state;
  }

  public canAfford(cost: RoomCost): boolean {
    return (
      this.state.resources.scrapAlloy >= (cost.scrapAlloy || 0) &&
      this.state.resources.energyCores >= (cost.energyCores || 0) &&
      this.state.resources.oxygen >= (cost.oxygen || 0) &&
      this.state.resources.parts >= (cost.parts || 0)
    );
  }

  public spendResources(cost: RoomCost): void {
    this.state.resources.scrapAlloy -= cost.scrapAlloy || 0;
    this.state.resources.energyCores -= cost.energyCores || 0;
    this.state.resources.oxygen -= cost.oxygen || 0;
    this.state.resources.parts -= cost.parts || 0;
  }

  public addResources(resources: SpaceResources): void {
    this.state.resources.scrapAlloy = Math.min(
      this.state.resources.scrapAlloy + resources.scrapAlloy,
      this.state.storageCapacity
    );
    this.state.resources.energyCores = Math.min(
      this.state.resources.energyCores + resources.energyCores,
      this.state.storageCapacity
    );
    this.state.resources.oxygen = Math.min(
      this.state.resources.oxygen + resources.oxygen,
      this.state.storageCapacity
    );
    this.state.resources.parts = Math.min(
      this.state.resources.parts + resources.parts,
      this.state.storageCapacity
    );
  }

  public collectFromRoom(roomId: string): number {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room || !room.isActivated) return 0;

    const amount = Math.floor(room.accumulatedResources);
    if (amount <= 0) return 0;

    const data = spaceRooms[room.type];
    const levelData = data.levels[room.level - 1];
    
    if (levelData?.production) {
      const resourceType = levelData.production.type;
      const before = this.state.resources[resourceType];
      this.addResources({ 
        scrapAlloy: resourceType === 'scrapAlloy' ? amount : 0,
        energyCores: resourceType === 'energyCores' ? amount : 0,
        oxygen: resourceType === 'oxygen' ? amount : 0,
        parts: resourceType === 'parts' ? amount : 0,
      });
      const actualCollected = this.state.resources[resourceType] - before;
      room.accumulatedResources -= actualCollected;
      room.lastCollectionTime = Date.now();
      return actualCollected;
    }

    return 0;
  }

  public canBuildRoom(type: RoomType, x: number, y: number): { canBuild: boolean; reason?: string } {
    const data = spaceRooms[type];
    if (!data) return { canBuild: false, reason: 'Invalid room type' };

    if (data.isLocked) {
      return { canBuild: false, reason: spaceStrings.roomLocked };
    }

    const levelData = data.levels[0];
    if (!this.canAfford(levelData.cost)) {
      return { canBuild: false, reason: spaceStrings.notEnoughResources };
    }

    const existingRoom = this.state.rooms.find(r => r.x === x && r.y === y);
    if (existingRoom) {
      return { canBuild: false, reason: 'Plot occupied' };
    }

    if (this.state.buildQueue.length >= this.state.maxBuilders) {
      return { canBuild: false, reason: spaceStrings.buildersOccupied };
    }

    // Check power capacity if room requires power
    if (data.powerRequired) {
      const futureUsed = this.state.powerUsed + data.powerRequired;
      if (futureUsed > this.state.powerCapacity) {
        return { canBuild: false, reason: spaceStrings.notEnoughPower };
      }
    }

    return { canBuild: true };
  }

  public buildRoom(type: RoomType, x: number, y: number): boolean {
    const check = this.canBuildRoom(type, x, y);
    if (!check.canBuild) return false;

    const data = spaceRooms[type];
    const levelData = data.levels[0];
    
    this.spendResources(levelData.cost);

    const room: PlacedRoom = {
      id: `${type}-${Date.now()}`,
      type,
      x,
      y,
      level: 0,
      isBuilding: true,
      isActivated: false,
      buildStartTime: Date.now(),
      buildEndTime: Date.now() + levelData.buildTime * 1000 * (this.state.debugFastMode ? 0.1 : 1),
      lastCollectionTime: Date.now(),
      accumulatedResources: 0,
    };

    this.state.rooms.push(room);
    this.state.buildQueue.push({
      roomId: room.id,
      endTime: room.buildEndTime!,
    });

    return true;
  }

  public activateRoom(roomId: string): boolean {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room || room.isBuilding || room.isActivated) return false;

    const data = spaceRooms[room.type];
    if (data.powerRequired) {
      const futureUsed = this.state.powerUsed + data.powerRequired;
      if (futureUsed > this.state.powerCapacity) {
        return false;
      }
    }

    room.isActivated = true;
    this.updatePowerStats();
    return true;
  }

  public startEVA(targetX: number, targetY: number): boolean {
    const airlock = this.state.rooms.find(r => r.type === 'airlock' && r.isActivated);
    if (!airlock) return false;

    if (this.state.evaTrips.some(eva => Date.now() < eva.endTime)) {
      return false; // EVA already in progress
    }

    const oxygenCost = 15;
    if (this.state.resources.oxygen < oxygenCost) {
      return false;
    }

    this.state.resources.oxygen -= oxygenCost;

    const duration = (45 + Math.random() * 45) * 1000 * (this.state.debugFastMode ? 0.1 : 1);
    const rewards: SpaceResources = {
      scrapAlloy: Math.floor(20 + Math.random() * 30),
      energyCores: Math.floor(5 + Math.random() * 10),
      oxygen: 0,
      parts: Math.floor(2 + Math.random() * 5),
    };

    const eva: EVATrip = {
      id: `eva-${Date.now()}`,
      startTime: Date.now(),
      endTime: Date.now() + duration,
      targetX,
      targetY,
      rewards,
    };

    this.state.evaTrips.push(eva);
    return true;
  }

  public repairHull(): { success: boolean; reason?: string } {
    const repairDock = this.state.rooms.find(r => r.type === 'repairDock' && r.isActivated);
    if (!repairDock) {
      return { success: false, reason: 'No repair dock' };
    }

    if (this.state.hullIntegrity >= 100) {
      return { success: false, reason: 'Hull already at 100%' };
    }

    const cost: RoomCost = {
      scrapAlloy: 15,
      energyCores: 3,
    };

    if (!this.canAfford(cost)) {
      return { success: false, reason: spaceStrings.notEnoughResources };
    }

    this.spendResources(cost);
    this.state.hullIntegrity = Math.min(100, this.state.hullIntegrity + 10);
    
    return { success: true };
  }

  public claimQuestReward(questId: string): boolean {
    const quest = this.state.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return false;

    this.addResources(quest.reward);
    quest.claimed = true;
    return true;
  }

  public findStoryFragment(fragmentId: string): boolean {
    const fragment = this.state.storyFragments.find(f => f.id === fragmentId);
    if (!fragment || fragment.found) return false;

    fragment.found = true;
    return true;
  }

  public updateWarehouseCapacity(): void {
    let totalCapacity = 500;
    this.state.rooms.forEach(room => {
      if (room.type === 'warehouse' && room.isActivated && !room.isBuilding) {
        const data = spaceRooms[room.type];
        const levelData = data.levels[room.level - 1];
        if (levelData?.storageIncrease) {
          totalCapacity += levelData.storageIncrease;
        }
      }
    });
    this.state.storageCapacity = totalCapacity;
  }

  private checkLandingReady(state: SpaceGameStateData): boolean {
    // Required rooms at Lv1
    const requiredRooms: RoomType[] = [
      'generator', 'bridge', 'o2Recycler', 'salvageWorkshop',
      'warehouse', 'airlock', 'energyRefinery', 'repairDock',
      'lifeSupport', 'engineRoom'
    ];

    const hasAllRooms = requiredRooms.every(type =>
      state.rooms.some(r => r.type === type && r.level >= 1 && r.isActivated)
    );

    const hasHull = state.hullIntegrity >= 70;
    const hasEVAs = state.evaCompletedCount >= 2;
    const hasEngine = state.engineIgnitable;
    const hasResources = 
      state.resources.scrapAlloy >= 40 &&
      state.resources.energyCores >= 15 &&
      state.resources.oxygen >= 20;

    return hasAllRooms && hasHull && hasEVAs && hasEngine && hasResources;
  }

  public canLand(): boolean {
    return this.checkLandingReady(this.state);
  }

  public land(): void {
    this.state.hasLanded = true;
    this.save();
  }

  public toggleDebugFastMode(): void {
    this.state.debugFastMode = !this.state.debugFastMode;
  }

  public setIntroSeen(): void {
    this.state.introSeen = true;
  }

  public setWakeSeen(): void {
    this.state.wakeSeen = true;
  }

  public startEmergencyPower(): void {
    this.state.emergencyPowerStart = Date.now();
  }

  public getRemainingEmergencyPower(): number {
    if (this.state.emergencyPowerStart === 0) return this.state.emergencyPowerTime;
    const elapsed = Date.now() - this.state.emergencyPowerStart;
    return Math.max(0, this.state.emergencyPowerTime - elapsed);
  }

  public speedUpBuilding(roomId: string): boolean {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (!room || !room.isBuilding || !room.buildEndTime) return false;

    const remaining = room.buildEndTime - Date.now();
    if (remaining <= 0 || remaining > 180000) return false;

    room.isBuilding = false;
    room.level++;
    delete room.buildEndTime;
    delete room.buildStartTime;

    this.state.buildQueue = this.state.buildQueue.filter(job => job.roomId !== roomId);

    return true;
  }
}
