import { SaveDataV2 } from '../types/game';

const SAVE_KEY_V2 = 'ldxy_save_v2';
const LEGACY_KEY_PROGRESS = 'ldxy_progress';
const LEGACY_KEY_SCI = 'ldxy_sci';
const LEGACY_KEY_SOUND = 'ldxy_sound';

export class SaveManager {
  private memoryCache: SaveDataV2;

  constructor() {
    this.memoryCache = this.loadData();
  }

  public getData(): Readonly<SaveDataV2> {
    return this.memoryCache;
  }

  public saveProgress(progress: number, unlockedScientists: string[]): void {
    const validProgress = Math.max(this.memoryCache.progress, Math.min(14, Math.max(0, progress)));
    const uniqueSci = Array.from(new Set([...this.memoryCache.unlockedScientists, ...unlockedScientists]));

    this.memoryCache = {
      ...this.memoryCache,
      progress: validProgress,
      unlockedScientists: uniqueSci,
      lastUpdated: Date.now(),
    };

    this.persist();
  }

  public setSoundEnabled(enabled: boolean): void {
    this.memoryCache = {
      ...this.memoryCache,
      soundEnabled: enabled,
      lastUpdated: Date.now(),
    };
    this.persist();
  }

  public setReducedMotion(reduced: boolean): void {
    this.memoryCache = {
      ...this.memoryCache,
      reducedMotion: reduced,
      lastUpdated: Date.now(),
    };
    this.persist();
  }

  public updateEndlessHighScore(score: number): void {
    if (score > this.memoryCache.highScoreEndless) {
      this.memoryCache = {
        ...this.memoryCache,
        highScoreEndless: score,
        lastUpdated: Date.now(),
      };
      this.persist();
    }
  }

  public resetAll(): void {
    this.memoryCache = {
      version: 2,
      progress: 0,
      unlockedScientists: [],
      soundEnabled: true,
      reducedMotion: false,
      highScoreEndless: 0,
      lastUpdated: Date.now(),
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SAVE_KEY_V2);
        localStorage.removeItem(LEGACY_KEY_PROGRESS);
        localStorage.removeItem(LEGACY_KEY_SCI);
        localStorage.removeItem(LEGACY_KEY_SOUND);
      }
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }

  private loadData(): SaveDataV2 {
    const defaultData: SaveDataV2 = {
      version: 2,
      progress: 0,
      unlockedScientists: [],
      soundEnabled: true,
      reducedMotion: false,
      highScoreEndless: 0,
      lastUpdated: Date.now(),
    };

    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultData;
    }

    try {
      // 1. Try modern V2 schema
      const rawV2 = localStorage.getItem(SAVE_KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (parsed && parsed.version === 2) {
          return {
            version: 2,
            progress: typeof parsed.progress === 'number' ? Math.max(0, Math.min(14, parsed.progress)) : 0,
            unlockedScientists: Array.isArray(parsed.unlockedScientists) ? parsed.unlockedScientists.filter((id: unknown) => typeof id === 'string') : [],
            soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
            reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : false,
            highScoreEndless: typeof parsed.highScoreEndless === 'number' ? parsed.highScoreEndless : 0,
            lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
          };
        }
      }

      // 2. Fallback to legacy schema (v1 migration)
      const legacyProgressRaw = localStorage.getItem(LEGACY_KEY_PROGRESS);
      const legacySciRaw = localStorage.getItem(LEGACY_KEY_SCI);
      const legacySoundRaw = localStorage.getItem(LEGACY_KEY_SOUND);

      if (legacyProgressRaw !== null || legacySciRaw !== null) {
        const legacyProgress = legacyProgressRaw ? parseInt(legacyProgressRaw, 10) : 0;
        const legacySci = legacySciRaw ? legacySciRaw.split(',').filter(Boolean) : [];
        const soundEnabled = legacySoundRaw !== null ? legacySoundRaw === 'true' : true;

        const migrated: SaveDataV2 = {
          version: 2,
          progress: isNaN(legacyProgress) ? 0 : Math.max(0, Math.min(14, legacyProgress)),
          unlockedScientists: legacySci,
          soundEnabled,
          reducedMotion: false,
          highScoreEndless: 0,
          lastUpdated: Date.now(),
        };

        // Persist migrated schema
        try {
          localStorage.setItem(SAVE_KEY_V2, JSON.stringify(migrated));
        } catch {}

        return migrated;
      }
    } catch (e) {
      console.warn('Failed to parse save data, using default:', e);
    }

    return defaultData;
  }

  private persist(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(SAVE_KEY_V2, JSON.stringify(this.memoryCache));
      // Maintain backward compatibility with external scripts or older tabs
      localStorage.setItem(LEGACY_KEY_PROGRESS, String(this.memoryCache.progress));
      localStorage.setItem(LEGACY_KEY_SCI, this.memoryCache.unlockedScientists.join(','));
      localStorage.setItem(LEGACY_KEY_SOUND, String(this.memoryCache.soundEnabled));
    } catch (e) {
      console.warn('Failed to persist save data:', e);
    }
  }
}
