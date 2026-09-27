import { BuildingData } from '../types';
import { strings } from './strings';

export const buildingsData: Record<string, BuildingData> = {
  headquarters: {
    type: 'headquarters',
    name: strings.headquarters,
    description: '基地的核心建築，升級後可解鎖更多建築和提高其他建築的等級上限',
    maxLevel: 10,
    levels: [
      { cost: {}, buildTime: 0 }, // Level 1 - starting level
      { cost: { food: 200, wood: 200 }, buildTime: 60, requiredHQLevel: 1 },
      { cost: { food: 500, wood: 500, steel: 100 }, buildTime: 180, requiredHQLevel: 2 },
      { cost: { food: 1200, wood: 1200, steel: 300 }, buildTime: 300, requiredHQLevel: 3 },
      { cost: { food: 2500, wood: 2500, steel: 800, electricity: 200 }, buildTime: 600, requiredHQLevel: 4 },
      { cost: { food: 5000, wood: 5000, steel: 2000, electricity: 500 }, buildTime: 900, requiredHQLevel: 5 },
      { cost: { food: 10000, wood: 10000, steel: 4000, electricity: 1000 }, buildTime: 1800, requiredHQLevel: 6 },
      { cost: { food: 20000, wood: 20000, steel: 8000, electricity: 2000 }, buildTime: 3600, requiredHQLevel: 7 },
      { cost: { food: 40000, wood: 40000, steel: 16000, electricity: 4000 }, buildTime: 7200, requiredHQLevel: 8 },
      { cost: { food: 80000, wood: 80000, steel: 32000, electricity: 8000 }, buildTime: 14400, requiredHQLevel: 9 },
    ],
  },
  
  farm: {
    type: 'farm',
    name: strings.farm,
    description: '生產食物的基礎建築',
    maxLevel: 10,
    levels: [
      {
        cost: { wood: 100 },
        buildTime: 30,
        production: { type: 'food', amount: 50, interval: 60 },
        requiredHQLevel: 1,
      },
      {
        cost: { food: 150, wood: 150 },
        buildTime: 60,
        production: { type: 'food', amount: 100, interval: 60 },
        requiredHQLevel: 1,
      },
      {
        cost: { food: 300, wood: 300 },
        buildTime: 120,
        production: { type: 'food', amount: 200, interval: 60 },
        requiredHQLevel: 2,
      },
      {
        cost: { food: 600, wood: 600, steel: 100 },
        buildTime: 240,
        production: { type: 'food', amount: 400, interval: 60 },
        requiredHQLevel: 3,
      },
      {
        cost: { food: 1200, wood: 1200, steel: 300 },
        buildTime: 480,
        production: { type: 'food', amount: 800, interval: 60 },
        requiredHQLevel: 4,
      },
      {
        cost: { food: 2400, wood: 2400, steel: 600 },
        buildTime: 900,
        production: { type: 'food', amount: 1600, interval: 60 },
        requiredHQLevel: 5,
      },
      {
        cost: { food: 4800, wood: 4800, steel: 1200 },
        buildTime: 1800,
        production: { type: 'food', amount: 3200, interval: 60 },
        requiredHQLevel: 6,
      },
      {
        cost: { food: 9600, wood: 9600, steel: 2400 },
        buildTime: 3600,
        production: { type: 'food', amount: 6400, interval: 60 },
        requiredHQLevel: 7,
      },
      {
        cost: { food: 19200, wood: 19200, steel: 4800 },
        buildTime: 7200,
        production: { type: 'food', amount: 12800, interval: 60 },
        requiredHQLevel: 8,
      },
      {
        cost: { food: 38400, wood: 38400, steel: 9600 },
        buildTime: 14400,
        production: { type: 'food', amount: 25600, interval: 60 },
        requiredHQLevel: 9,
      },
    ],
  },
  
  lumberMill: {
    type: 'lumberMill',
    name: strings.lumberMill,
    description: '生產木材的基礎建築',
    maxLevel: 10,
    levels: [
      {
        cost: { food: 80, wood: 50 },
        buildTime: 30,
        production: { type: 'wood', amount: 50, interval: 60 },
        requiredHQLevel: 1,
      },
      {
        cost: { food: 150, wood: 150 },
        buildTime: 60,
        production: { type: 'wood', amount: 100, interval: 60 },
        requiredHQLevel: 1,
      },
      {
        cost: { food: 300, wood: 300 },
        buildTime: 120,
        production: { type: 'wood', amount: 200, interval: 60 },
        requiredHQLevel: 2,
      },
      {
        cost: { food: 600, wood: 600, steel: 100 },
        buildTime: 240,
        production: { type: 'wood', amount: 400, interval: 60 },
        requiredHQLevel: 3,
      },
      {
        cost: { food: 1200, wood: 1200, steel: 300 },
        buildTime: 480,
        production: { type: 'wood', amount: 800, interval: 60 },
        requiredHQLevel: 4,
      },
      {
        cost: { food: 2400, wood: 2400, steel: 600 },
        buildTime: 900,
        production: { type: 'wood', amount: 1600, interval: 60 },
        requiredHQLevel: 5,
      },
      {
        cost: { food: 4800, wood: 4800, steel: 1200 },
        buildTime: 1800,
        production: { type: 'wood', amount: 3200, interval: 60 },
        requiredHQLevel: 6,
      },
      {
        cost: { food: 9600, wood: 9600, steel: 2400 },
        buildTime: 3600,
        production: { type: 'wood', amount: 6400, interval: 60 },
        requiredHQLevel: 7,
      },
      {
        cost: { food: 19200, wood: 19200, steel: 4800 },
        buildTime: 7200,
        production: { type: 'wood', amount: 12800, interval: 60 },
        requiredHQLevel: 8,
      },
      {
        cost: { food: 38400, wood: 38400, steel: 9600 },
        buildTime: 14400,
        production: { type: 'wood', amount: 25600, interval: 60 },
        requiredHQLevel: 9,
      },
    ],
  },
  
  steelMine: {
    type: 'steelMine',
    name: strings.steelMine,
    description: '生產鋼鐵的高級建築',
    maxLevel: 10,
    levels: [
      {
        cost: { food: 200, wood: 200 },
        buildTime: 60,
        production: { type: 'steel', amount: 30, interval: 60 },
        requiredHQLevel: 2,
      },
      {
        cost: { food: 400, wood: 400, steel: 100 },
        buildTime: 120,
        production: { type: 'steel', amount: 60, interval: 60 },
        requiredHQLevel: 2,
      },
      {
        cost: { food: 800, wood: 800, steel: 200 },
        buildTime: 240,
        production: { type: 'steel', amount: 120, interval: 60 },
        requiredHQLevel: 3,
      },
      {
        cost: { food: 1600, wood: 1600, steel: 400 },
        buildTime: 480,
        production: { type: 'steel', amount: 240, interval: 60 },
        requiredHQLevel: 4,
      },
      {
        cost: { food: 3200, wood: 3200, steel: 800 },
        buildTime: 900,
        production: { type: 'steel', amount: 480, interval: 60 },
        requiredHQLevel: 5,
      },
      {
        cost: { food: 6400, wood: 6400, steel: 1600 },
        buildTime: 1800,
        production: { type: 'steel', amount: 960, interval: 60 },
        requiredHQLevel: 6,
      },
      {
        cost: { food: 12800, wood: 12800, steel: 3200 },
        buildTime: 3600,
        production: { type: 'steel', amount: 1920, interval: 60 },
        requiredHQLevel: 7,
      },
      {
        cost: { food: 25600, wood: 25600, steel: 6400 },
        buildTime: 7200,
        production: { type: 'steel', amount: 3840, interval: 60 },
        requiredHQLevel: 8,
      },
      {
        cost: { food: 51200, wood: 51200, steel: 12800 },
        buildTime: 14400,
        production: { type: 'steel', amount: 7680, interval: 60 },
        requiredHQLevel: 9,
      },
      {
        cost: { food: 102400, wood: 102400, steel: 25600 },
        buildTime: 28800,
        production: { type: 'steel', amount: 15360, interval: 60 },
        requiredHQLevel: 10,
      },
    ],
  },
  
  powerPlant: {
    type: 'powerPlant',
    name: strings.powerPlant,
    description: '生產電力的高級建築',
    maxLevel: 10,
    levels: [
      {
        cost: { food: 300, wood: 300, steel: 100 },
        buildTime: 90,
        production: { type: 'electricity', amount: 20, interval: 60 },
        requiredHQLevel: 3,
      },
      {
        cost: { food: 600, wood: 600, steel: 200 },
        buildTime: 180,
        production: { type: 'electricity', amount: 40, interval: 60 },
        requiredHQLevel: 3,
      },
      {
        cost: { food: 1200, wood: 1200, steel: 400 },
        buildTime: 360,
        production: { type: 'electricity', amount: 80, interval: 60 },
        requiredHQLevel: 4,
      },
      {
        cost: { food: 2400, wood: 2400, steel: 800 },
        buildTime: 720,
        production: { type: 'electricity', amount: 160, interval: 60 },
        requiredHQLevel: 5,
      },
      {
        cost: { food: 4800, wood: 4800, steel: 1600 },
        buildTime: 1440,
        production: { type: 'electricity', amount: 320, interval: 60 },
        requiredHQLevel: 6,
      },
      {
        cost: { food: 9600, wood: 9600, steel: 3200 },
        buildTime: 2880,
        production: { type: 'electricity', amount: 640, interval: 60 },
        requiredHQLevel: 7,
      },
      {
        cost: { food: 19200, wood: 19200, steel: 6400 },
        buildTime: 5760,
        production: { type: 'electricity', amount: 1280, interval: 60 },
        requiredHQLevel: 8,
      },
      {
        cost: { food: 38400, wood: 38400, steel: 12800 },
        buildTime: 11520,
        production: { type: 'electricity', amount: 2560, interval: 60 },
        requiredHQLevel: 9,
      },
      {
        cost: { food: 76800, wood: 76800, steel: 25600 },
        buildTime: 23040,
        production: { type: 'electricity', amount: 5120, interval: 60 },
        requiredHQLevel: 10,
      },
      {
        cost: { food: 153600, wood: 153600, steel: 51200 },
        buildTime: 46080,
        production: { type: 'electricity', amount: 10240, interval: 60 },
        requiredHQLevel: 10,
      },
    ],
  },
  
  warehouse: {
    type: 'warehouse',
    name: strings.warehouse,
    description: '增加資源儲存上限',
    maxLevel: 10,
    levels: [
      {
        cost: { wood: 150 },
        buildTime: 30,
        storageIncrease: 5000,
        requiredHQLevel: 1,
      },
      {
        cost: { food: 300, wood: 300 },
        buildTime: 60,
        storageIncrease: 10000,
        requiredHQLevel: 2,
      },
      {
        cost: { food: 600, wood: 600 },
        buildTime: 120,
        storageIncrease: 20000,
        requiredHQLevel: 3,
      },
      {
        cost: { food: 1200, wood: 1200, steel: 200 },
        buildTime: 240,
        storageIncrease: 40000,
        requiredHQLevel: 4,
      },
      {
        cost: { food: 2400, wood: 2400, steel: 400 },
        buildTime: 480,
        storageIncrease: 80000,
        requiredHQLevel: 5,
      },
      {
        cost: { food: 4800, wood: 4800, steel: 800 },
        buildTime: 960,
        storageIncrease: 160000,
        requiredHQLevel: 6,
      },
      {
        cost: { food: 9600, wood: 9600, steel: 1600 },
        buildTime: 1920,
        storageIncrease: 320000,
        requiredHQLevel: 7,
      },
      {
        cost: { food: 19200, wood: 19200, steel: 3200 },
        buildTime: 3840,
        storageIncrease: 640000,
        requiredHQLevel: 8,
      },
      {
        cost: { food: 38400, wood: 38400, steel: 6400 },
        buildTime: 7680,
        storageIncrease: 1280000,
        requiredHQLevel: 9,
      },
      {
        cost: { food: 76800, wood: 76800, steel: 12800 },
        buildTime: 15360,
        storageIncrease: 2560000,
        requiredHQLevel: 10,
      },
    ],
  },
  
  barracks: {
    type: 'barracks',
    name: strings.barracks,
    description: '軍事建築（功能待實裝）',
    maxLevel: 10,
    levels: [
      {
        cost: { food: 200, wood: 200 },
        buildTime: 60,
        requiredHQLevel: 2,
      },
      {
        cost: { food: 400, wood: 400, steel: 100 },
        buildTime: 120,
        requiredHQLevel: 3,
      },
      {
        cost: { food: 800, wood: 800, steel: 200 },
        buildTime: 240,
        requiredHQLevel: 4,
      },
      {
        cost: { food: 1600, wood: 1600, steel: 400 },
        buildTime: 480,
        requiredHQLevel: 5,
      },
      {
        cost: { food: 3200, wood: 3200, steel: 800 },
        buildTime: 960,
        requiredHQLevel: 6,
      },
      {
        cost: { food: 6400, wood: 6400, steel: 1600 },
        buildTime: 1920,
        requiredHQLevel: 7,
      },
      {
        cost: { food: 12800, wood: 12800, steel: 3200 },
        buildTime: 3840,
        requiredHQLevel: 8,
      },
      {
        cost: { food: 25600, wood: 25600, steel: 6400 },
        buildTime: 7680,
        requiredHQLevel: 9,
      },
      {
        cost: { food: 51200, wood: 51200, steel: 12800 },
        buildTime: 15360,
        requiredHQLevel: 10,
      },
      {
        cost: { food: 102400, wood: 102400, steel: 25600 },
        buildTime: 30720,
        requiredHQLevel: 10,
      },
    ],
  },
};
