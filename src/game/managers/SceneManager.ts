import { Scene } from 'phaser';
import { EventManager } from './EventManager';

export interface ArenaConfig {
  key: string;
  background: string;
  name: string;
}

export class SceneManager {
  private static instance: SceneManager;
  private currentArenaIndex: number = 0;
  private eventManager: EventManager;
  private scene: Scene;

  private readonly arenas: ArenaConfig[] = [
    {
      key: 'moon-arena',
      background: '/game engine/scenes/moon.png',
      name: 'Moon Arena'
    },
    {
      key: 'pump-arena',
      background: '/game engine/scenes/pumparena.png',
      name: 'Pump Arena'
    },
    {
      key: 'rug-arena',
      background: '/game engine/scenes/rugarena.png',
      name: 'Rug Arena'
    },
    {
      key: 'photon-arena',
      background: '/game engine/scenes/photon arena.png',
      name: 'Photon Arena'
    },
    {
      key: 'bullx-arena',
      background: '/game engine/scenes/bullxarena.png',
      name: 'BullX Arena'
    }
  ];

  private constructor(scene: Scene) {
    this.scene = scene;
    this.eventManager = EventManager.getInstance(scene);
    this.setupEventListeners();
  }

  static getInstance(scene: Scene): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager(scene);
    }
    return SceneManager.instance;
  }

  private setupEventListeners() {
    this.eventManager.on('battleComplete', () => {
      this.cycleToNextArena();
    });
  }

  public getCurrentArena(): ArenaConfig {
    return this.arenas[this.currentArenaIndex];
  }

  public cycleToNextArena() {
    this.currentArenaIndex = (this.currentArenaIndex + 1) % this.arenas.length;
    this.eventManager.emit('arenaChange', this.getCurrentArena());
  }

  public getAllArenas(): ArenaConfig[] {
    return [...this.arenas];
  }
} 