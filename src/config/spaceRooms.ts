import { RoomData } from '../spaceTypes';
import { spaceStrings } from './spaceStrings';

export const spaceRooms: Record<string, RoomData> = {
  hibernation: {
    type: 'hibernation',
    name: spaceStrings.hibernation,
    description: '冷凍倉。你從這裡醒來。',
    maxLevel: 1,
    powerRequired: 0,
    isStartRoom: true,
    levels: [
      { cost: {}, buildTime: 0 },
    ],
  },
  
  generator: {
    type: 'generator',
    name: spaceStrings.generator,
    description: '提供電力給整艘船。',
    maxLevel: 2,
    powerProvided: 30, // Lv1 provides 30, Lv2 provides 40
    isStartRoom: false,
    levels: [
      { cost: {}, buildTime: 0 }, // Story unlock, free
      { cost: { scrapAlloy: 60, energyCores: 15 }, buildTime: 120, powerProvided: 40 },
    ],
  },
  
  bridge: {
    type: 'bridge',
    name: spaceStrings.bridge,
    description: '艦橋。控制中樞。',
    maxLevel: 1,
    powerRequired: 2,
    levels: [
      { cost: {}, buildTime: 0 }, // Free after generator
    ],
  },
  
  o2Recycler: {
    type: 'o2Recycler',
    name: spaceStrings.o2Recycler,
    description: '回收和再生氧氣。',
    maxLevel: 3,
    powerRequired: 4,
    levels: [
      { cost: { scrapAlloy: 30, energyCores: 5 }, buildTime: 60 },
      { cost: { scrapAlloy: 50, energyCores: 10, parts: 2 }, buildTime: 90 },
      { cost: { scrapAlloy: 80, energyCores: 20, parts: 5 }, buildTime: 120 },
    ],
  },
  
  salvageWorkshop: {
    type: 'salvageWorkshop',
    name: spaceStrings.salvageWorkshop,
    description: '分解殘骸，生產廢合金。',
    maxLevel: 3,
    powerRequired: 5,
    levels: [
      {
        cost: { scrapAlloy: 25, energyCores: 3 },
        buildTime: 45,
        production: { type: 'scrapAlloy', amount: 10, interval: 60 },
      },
      {
        cost: { scrapAlloy: 45, energyCores: 8, parts: 2 },
        buildTime: 75,
        production: { type: 'scrapAlloy', amount: 18, interval: 60 },
      },
      {
        cost: { scrapAlloy: 75, energyCores: 15, parts: 4 },
        buildTime: 105,
        production: { type: 'scrapAlloy', amount: 28, interval: 60 },
      },
    ],
  },
  
  warehouse: {
    type: 'warehouse',
    name: spaceStrings.warehouse,
    description: '增加資源儲存容量。',
    maxLevel: 3,
    powerRequired: 0, // Passive storage
    levels: [
      {
        cost: { scrapAlloy: 20 },
        buildTime: 30,
        storageIncrease: 200,
      },
      {
        cost: { scrapAlloy: 40, parts: 1 },
        buildTime: 60,
        storageIncrease: 400,
      },
      {
        cost: { scrapAlloy: 70, parts: 3 },
        buildTime: 90,
        storageIncrease: 600,
      },
    ],
  },
  
  airlock: {
    type: 'airlock',
    name: spaceStrings.airlock,
    description: '氣閘。允許 EVA 任務。',
    maxLevel: 2,
    powerRequired: 3,
    levels: [
      { cost: { scrapAlloy: 40, parts: 2, energyCores: 5 }, buildTime: 75 },
      { cost: { scrapAlloy: 60, parts: 5, energyCores: 10 }, buildTime: 90 },
    ],
  },
  
  energyRefinery: {
    type: 'energyRefinery',
    name: spaceStrings.energyRefinery,
    description: '精煉能源芯。',
    maxLevel: 3,
    powerRequired: 6,
    levels: [
      {
        cost: { scrapAlloy: 35, energyCores: 8 },
        buildTime: 90,
        production: { type: 'energyCores', amount: 3, interval: 60 },
      },
      {
        cost: { scrapAlloy: 60, energyCores: 15, parts: 3 },
        buildTime: 120,
        production: { type: 'energyCores', amount: 5, interval: 60 },
      },
      {
        cost: { scrapAlloy: 100, energyCores: 25, parts: 6 },
        buildTime: 150,
        production: { type: 'energyCores', amount: 8, interval: 60 },
      },
    ],
  },
  
  repairDock: {
    type: 'repairDock',
    name: spaceStrings.repairDock,
    description: '維修船體。',
    maxLevel: 2,
    powerRequired: 4,
    levels: [
      { cost: { scrapAlloy: 40, parts: 1 }, buildTime: 60 },
      { cost: { scrapAlloy: 70, parts: 4, energyCores: 10 }, buildTime: 90 },
    ],
  },
  
  lifeSupport: {
    type: 'lifeSupport',
    name: spaceStrings.lifeSupport,
    description: '維持船艦生命維持系統。',
    maxLevel: 2,
    powerRequired: 3,
    levels: [
      { cost: { scrapAlloy: 30, oxygen: 10 }, buildTime: 60 },
      { cost: { scrapAlloy: 55, oxygen: 20, parts: 3 }, buildTime: 90 },
    ],
  },
  
  engineRoom: {
    type: 'engineRoom',
    name: spaceStrings.engineRoom,
    description: '主引擎。修復後可點火降落。',
    maxLevel: 2,
    powerRequired: 8,
    levels: [
      { cost: { scrapAlloy: 50, energyCores: 25, parts: 8 }, buildTime: 120 },
      { cost: { scrapAlloy: 90, energyCores: 40, parts: 15 }, buildTime: 180 },
    ],
  },
  
  researchTerminal: {
    type: 'researchTerminal',
    name: spaceStrings.researchTerminal,
    description: '研究終端。研究緊急點火協議。',
    maxLevel: 1,
    powerRequired: 0, // Passive research
    levels: [
      { cost: { scrapAlloy: 20, parts: 1 }, buildTime: 45 },
    ],
  },
  
  crewQuarters: {
    type: 'crewQuarters',
    name: spaceStrings.crewQuarters,
    description: '船員艙。（在星球上解鎖）',
    maxLevel: 1,
    powerRequired: 2,
    isLocked: true,
    levels: [
      { cost: {}, buildTime: 0 },
    ],
  },
};
