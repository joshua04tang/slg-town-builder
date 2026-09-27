export type SpaceResourceType = 'scrapAlloy' | 'energyCores' | 'oxygen' | 'parts';

export type RoomType = 
  | 'hibernation'
  | 'generator'
  | 'bridge'
  | 'o2Recycler'
  | 'salvageWorkshop'
  | 'warehouse'
  | 'airlock'
  | 'energyRefinery'
  | 'repairDock'
  | 'lifeSupport'
  | 'engineRoom'
  | 'researchTerminal'
  | 'crewQuarters';

export interface SpaceResources {
  scrapAlloy: number;
  energyCores: number;
  oxygen: number;
  parts: number;
}

export interface RoomCost {
  scrapAlloy?: number;
  energyCores?: number;
  oxygen?: number;
  parts?: number;
}

export interface RoomLevelData {
  cost: RoomCost;
  buildTime: number;
  production?: {
    type: SpaceResourceType;
    amount: number;
    interval: number;
  };
  storageIncrease?: number;
  powerProvided?: number;
}

export interface RoomData {
  type: RoomType;
  name: string;
  description: string;
  maxLevel: number;
  powerRequired?: number;
  powerProvided?: number;
  isStartRoom?: boolean;
  isLocked?: boolean;
  levels: RoomLevelData[];
}

export interface PlacedRoom {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  level: number;
  isBuilding: boolean;
  isActivated: boolean;
  buildStartTime?: number;
  buildEndTime?: number;
  lastCollectionTime: number;
  accumulatedResources: number;
}

export interface BuildQueueItem {
  roomId: string;
  endTime: number;
}

export interface EVATrip {
  id: string;
  startTime: number;
  endTime: number;
  targetX: number;
  targetY: number;
  rewards: SpaceResources;
}

export interface StoryFragment {
  id: string;
  title: string;
  text: string;
  found: boolean;
}

export interface SpaceQuest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  claimed: boolean;
  reward: SpaceResources;
  checkComplete: (state: SpaceGameStateData) => boolean;
}

export interface SpaceGameStateData {
  resources: SpaceResources;
  storageCapacity: number;
  powerCapacity: number;
  powerUsed: number;
  hullIntegrity: number;
  rooms: PlacedRoom[];
  buildQueue: BuildQueueItem[];
  maxBuilders: number;
  quests: SpaceQuest[];
  evaTrips: EVATrip[];
  evaCompletedCount: number;
  storyFragments: StoryFragment[];
  lastSaveTime: number;
  introSeen: boolean;
  wakeSeen: boolean;
  emergencyPowerTime: number; // 13.5 hours in ms
  emergencyPowerStart: number;
  engineIgnitable: boolean;
  hasLanded: boolean;
  debugFastMode: boolean;
}
