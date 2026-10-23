import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../src/persistence/SaveManager';
import { Scheduler } from '../src/engine/Scheduler';

// Simple mock for localStorage in Node environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  public getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  public setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }

  public clear(): void {
    this.store = {};
  }
}

describe('SaveManager and Legacy Migration', () => {
  beforeEach(() => {
    const mock = new LocalStorageMock();
    (globalThis as unknown as { localStorage: LocalStorageMock; window: { localStorage: LocalStorageMock } }).localStorage = mock;
    (globalThis as unknown as { window: { localStorage: LocalStorageMock } }).window = { localStorage: mock };
  });

  it('migrates legacy ldxy_progress and ldxy_sci into V2 schema without data loss', () => {
    // Simulate legacy storage from build v16
    localStorage.setItem('ldxy_progress', '7');
    localStorage.setItem('ldxy_sci', 'qian,enrich,deng,guo');
    localStorage.setItem('ldxy_sound', 'true');

    const sm = new SaveManager();
    const data = sm.getData();

    expect(data.version).toBe(2);
    expect(data.progress).toBe(7);
    expect(data.unlockedScientists).toEqual(['qian', 'enrich', 'deng', 'guo']);
    expect(data.soundEnabled).toBe(true);

    // Verify V2 was written
    const rawV2 = localStorage.getItem('ldxy_save_v2');
    expect(rawV2).not.toBeNull();
  });

  it('correctly updates and clamps progress up to max level 14', () => {
    const sm = new SaveManager();
    sm.saveProgress(5, ['qian']);
    expect(sm.getData().progress).toBe(5);

    // Trying to save an invalid or out-of-range progress
    sm.saveProgress(99, ['qian']);
    expect(sm.getData().progress).toBe(14);
  });

  it('resets all data cleanly on resetAll', () => {
    const sm = new SaveManager();
    sm.saveProgress(8, ['qian', 'enrich']);
    sm.resetAll();

    expect(sm.getData().progress).toBe(0);
    expect(sm.getData().unlockedScientists).toEqual([]);
    expect(localStorage.getItem('ldxy_save_v2')).toBeNull();
  });
});

describe('Scheduler and Stale Callback Invalidation', () => {
  it('executes scheduled tasks at the right simulation time', () => {
    const scheduler = new Scheduler();
    let executed = false;

    // Schedule task at delay 0.5s for session 1
    scheduler.schedule(0.5, 1, () => {
      executed = true;
    });

    // Advance 0.3s -> should not execute yet
    scheduler.tick(0.3, 1);
    expect(executed).toBe(false);

    // Advance another 0.25s (total 0.55s) -> should execute
    scheduler.tick(0.25, 1);
    expect(executed).toBe(true);
  });

  it('cancels pending tasks when session increments (prevents stale callbacks modifying new level)', () => {
    const scheduler = new Scheduler();
    let executedOldSession = false;

    // Schedule a delayed win/loss callback in level attempt session 1
    scheduler.schedule(0.5, 1, () => {
      executedOldSession = true;
    });

    // Player quickly clicks "Restart" or "Next Level", moving to session 2
    scheduler.cancelAllForSession(1);

    // Advance simulation time by 1.0s in session 2
    scheduler.tick(1.0, 2);

    // Old session task must NEVER execute!
    expect(executedOldSession).toBe(false);
  });
});
