export type ResourceType = 'food' | 'wood' | 'steel' | 'electricity';

export type BuildingType = 
  | 'headquarters' 
  | 'farm' 
  | 'lumberMill' 
  | 'steelMine' 
  | 'powerPlant' 
  | 'warehouse' 
  | 'barracks';

export interface Resources {
  food: number;
  wood: number;
  steel: number;
  electricity: number;
  [key: string]: number;
}

export interface BuildingCost {
  food?: number;
  wood?: number;
  steel?: number;
  electricity?: number;
  [key: string]: number | undefined;
}

export interface BuildingLevelData {
  cost: BuildingCost;
  buildTime: number; // seconds
  production?: {
    type: ResourceType;
    amount: number;
    interval: number; // seconds
  };
  storageCapacity?: number;
  storageIncrease?: number;
  requiredHQLevel?: number;
}

export interface BuildingData {
  type: BuildingType;
  name: string;
  description: string;
  maxLevel: number;
  levels: BuildingLevelData[];
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  level: number;
  isBuilding: boolean;
  buildStartTime?: number;
  buildEndTime?: number;
  lastCollectionTime: number;
  accumulatedResources: number;
}

export interface BuildQueue {
  buildingId: string;
  endTime: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  claimed: boolean;
  reward: Resources;
  checkComplete: (state: GameStateData) => boolean;
}

export interface GameStateData {
  resources: Resources;
  storageCapacity: number;
  buildings: PlacedBuilding[];
  buildQueue: BuildQueue[];
  maxBuilders: number;
  quests: Quest[];
  lastSaveTime: number;
  hqLevel: number;
}
