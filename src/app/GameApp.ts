import { GAME_CONFIG } from '../data/gameConfig';
import { LEVELS } from '../data/levels';
import { SCIENTISTS } from '../data/scientists';
import { GameEngine } from '../engine/GameEngine';
import { InputController } from '../input/InputController';
import { SaveManager } from '../persistence/SaveManager';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { SoundEffects } from '../audio/SoundEffects';
import { DialogManager } from '../ui/DialogManager';
import { GameHUD } from '../ui/GameHUD';
import { MainMenu } from '../ui/MainMenu';
import { LevelSelection } from '../ui/LevelSelection';
import { ScientistGallery } from '../ui/ScientistGallery';
import { PresentationMode, PresentationConfig } from '../ui/PresentationMode';
import { SettingsMenu } from '../ui/SettingsMenu';
import { GameStateMachine } from './GameStateMachine';
import { ResultState, ScientistDefinition } from '../types/game';

export class GameApp {
  private engine: GameEngine;
  private renderer: CanvasRenderer;
  public readonly input: InputController;
  private saveManager: SaveManager;
  private sound: SoundEffects;
  private stateMachine: GameStateMachine;

  private hud: GameHUD;
  private dialogs: DialogManager;

  // DOM Containers
  private canvasElement: HTMLCanvasElement;
  private menuOverlay: HTMLElement;
  private modalOverlay: HTMLElement;
  private deckContainer: HTMLElement | null;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;

  constructor() {
    this.canvasElement = document.getElementById('cv') as HTMLCanvasElement;
    const hudContainer = document.getElementById('hud') as HTMLElement;
    this.menuOverlay = document.getElementById('menu') as HTMLElement;
    this.modalOverlay = document.getElementById('modal') as HTMLElement;
    this.deckContainer = document.getElementById('command-deck');

    if (!this.canvasElement || !hudContainer || !this.menuOverlay || !this.modalOverlay) {
      throw new Error('Required DOM containers not found');
    }

    this.saveManager = new SaveManager();
    const initialSave = this.saveManager.getData();

    this.sound = new SoundEffects(initialSave.soundEnabled);
    this.engine = new GameEngine();
    this.renderer = new CanvasRenderer(this.canvasElement);
    this.dialogs = new DialogManager(this.modalOverlay);
    this.stateMachine = new GameStateMachine('MENU', (from, to) => {
      this.handleStateTransition(from, to);
    });

    this.hud = new GameHUD(
      hudContainer,
      {
        onSelectWarhead: (type) => {
          this.sound.playClick();
          this.engine.selectedWarhead = type;
          this.updateHUD();
        },
        onToggleDeploy: () => {
          this.sound.playClick();
          this.engine.deployMode = !this.engine.deployMode;
          this.updateHUD();
        },
        onDetonate: () => {
          this.sound.playClick();
          this.engine.detonateDevices();
          this.updateHUD();
        },
        onToggleSite: () => {
          this.sound.playClick();
          this.engine.useSub = !this.engine.useSub;
          this.dialogs.showToast(
            this.engine.useSub
              ? '切换至潜射阵地：巨浪出水，敌前点火！（出水初速-28%）'
              : '切换至陆基发射阵地'
          );
          this.updateHUD();
        },
        onRestart: () => {
          this.sound.playClick();
          if (this.engine.isEndless) {
            this.startEndlessChallenge();
          } else if (this.engine.level) {
            this.startLevel(this.engine.levelIndex, this.engine.isPresentationMode);
          }
        },
        onMenu: () => {
          this.sound.playClick();
          this.stateMachine.transitionTo('MENU');
        },
        onToggleSound: () => {
          const next = !this.sound.isEnabled();
          this.sound.setEnabled(next);
          this.saveManager.setSoundEnabled(next);
          this.dialogs.showToast(next ? '音效已开启' : '音效已静音');
          this.updateHUD();
        },
        onToggleFullscreen: () => {
          this.toggleFullscreen();
        },
        onTriggerInFlightAbility: () => {
          this.engine.tryActivateInFlightAbility();
          this.updateHUD();
        },
        onDeckAimStart: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            const origin = this.engine.getLaunchOrigin();
            this.engine.handlePointerDown(origin);
            this.updateHUD();
          }
        },
        onDeckAimMove: (dx, dy) => {
          if (this.stateMachine.getState() === 'PLAYING') {
            const origin = this.engine.getLaunchOrigin();
            const pullScale = 1.75;
            this.engine.handlePointerMove({
              x: origin.x + dx * pullScale,
              y: origin.y + dy * pullScale,
            });
          }
        },
        onDeckAimEnd: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.handlePointerUp();
            this.updateHUD();
          }
        },
      },
      this.deckContainer
    );

    this.input = new InputController(
      this.canvasElement,
      {
        onPointerDown: (pos) => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.handlePointerDown(pos);
            this.updateHUD();
          }
        },
        onPointerMove: (pos) => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.handlePointerMove(pos);
          }
        },
        onPointerUp: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.handlePointerUp();
            this.updateHUD();
          }
        },
        onPointerCancel: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.handlePointerCancel();
          }
        },
        onSpacePress: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.engine.tryActivateInFlightAbility();
            this.updateHUD();
          }
        },
        onEscapePress: () => {
          if (this.stateMachine.getState() === 'PLAYING') {
            this.stateMachine.transitionTo('MENU');
          }
        },
      },
      () => this.renderer.getTransform()
    );

    this.setupEngineHooks();

    const handleResize = () => {
      this.checkLayoutAndResize();
      requestAnimationFrame(() => this.checkLayoutAndResize());
      window.setTimeout(() => this.checkLayoutAndResize(), 50);
      window.setTimeout(() => this.checkLayoutAndResize(), 150);
      window.setTimeout(() => this.checkLayoutAndResize(), 300);
      window.setTimeout(() => this.checkLayoutAndResize(), 500);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (typeof window !== 'undefined' && window.screen && 'orientation' in window.screen) {
      window.screen.orientation.addEventListener('change', handleResize);
    }
  }

  public init(): void {
    this.showMainMenu();
    this.startLoop();
    this.checkLayoutAndResize();
  }

  private checkLayoutAndResize(): void {
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 900;
    const wrapEl = document.getElementById('wrap');

    if (isPortrait && this.stateMachine.getState() === 'PLAYING') {
      wrapEl?.classList.add('portrait-active');
    } else {
      wrapEl?.classList.remove('portrait-active');
    }

    this.renderer.handleResize();
    if (this.stateMachine.getState() === 'PLAYING') {
      this.updateHUD();
    }
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  private setupEngineHooks(): void {
    this.engine.onToastMessage = (msg) => this.dialogs.showToast(msg);

    this.engine.onPlaySound = (snd, arg) => {
      if (snd === 'launch') this.sound.playLaunch(arg);
      else if (snd === 'glide') this.sound.playGlide();
      else if (snd === 'stage2') this.sound.playStage2();
      else if (snd === 'explosion') this.sound.playExplosion(arg);
      else if (snd === 'hit') this.sound.playHit();
      else if (snd === 'win') this.sound.playWin();
      else if (snd === 'click') this.sound.playClick();
    };

    this.engine.onLevelWon = (isOrbit) => {
      this.handleLevelWin(isOrbit);
    };

    this.engine.onLevelLost = () => {
      this.handleLevelLoss();
    };

    this.engine.onEndlessWaveWon = () => {
      this.sound.playWin();
      const nextWave = this.engine.endlessWave + 1;
      this.engine.warheads.normal += 3;
      let bonus = '';
      if (nextWave % 3 === 0) {
        this.engine.warheads.atomic = (this.engine.warheads.atomic || 0) + 1;
        bonus += ' +1原子弹';
      }
      if (nextWave % 4 === 0) {
        this.engine.warheads.bunker = (this.engine.warheads.bunker || 0) + 1;
        bonus += ' +1钻地弹';
      }
      if (nextWave % 5 === 0) {
        this.engine.warheads.hydro = (this.engine.warheads.hydro || 0) + 1;
        bonus += ' +1氢弹';
      }
      this.dialogs.showToast(`第${this.engine.endlessWave}波已清除！补给 +3常规弹${bonus}`);
      this.engine.loadEndlessWave(nextWave);
      this.updateHUD();
    };

    this.engine.onEndlessOver = () => {
      this.saveManager.updateEndlessHighScore(this.engine.endlessScore);
      const result: ResultState = {
        outcome: 'endless_over',
        hasNextLevel: false,
        endlessStats: {
          wave: this.engine.endlessWave,
          score: this.engine.endlessScore,
        },
      };
      this.stateMachine.transitionTo('RESULT');
      this.dialogs.showResult(
        result,
        () => {},
        () => this.startEndlessChallenge(),
        () => this.stateMachine.transitionTo('MENU')
      );
    };
  }

  private handleLevelWin(isOrbit: boolean): void {
    this.sound.playWin();
    const curLevelIdx = this.engine.levelIndex;
    const isPresentation = this.engine.isPresentationMode;

    const curData = this.saveManager.getData();
    const nextProg = Math.max(curData.progress, curLevelIdx + 1);

    // Identify all newly unlocked scientists
    const unlockedSci = [...curData.unlockedScientists];
    const newlyUnlocked: ScientistDefinition[] = [];

    // 1. Identify any scientists whose level requirement has been met and not yet recorded as unlocked
    for (const s of SCIENTISTS) {
      if (s.after <= nextProg && !unlockedSci.includes(s.id)) {
        newlyUnlocked.push(s);
        unlockedSci.push(s.id);
      }
    }

    // 2. Guarantee that completing this milestone level ALWAYS presents that scientist's honor card!
    // Every time the player beats Level 1 (钱学森), Level 2 (王承书), Level 4 (邓稼先),
    // Level 5 (郭永怀), Level 6 (于敏), Level 7 (程开甲), Level 8 (孙家栋),
    // Level 10 (屠守锷), Level 12 (黄纬禄),
    // their collectible character card pops up for tribute with the "归队" button,
    // whether on first clear, replaying in Level Select, or in Presentation mode!
    const levelSci = SCIENTISTS.find((s) => s.after === curLevelIdx + 1);
    if (levelSci && !newlyUnlocked.some((s) => s.id === levelSci.id)) {
      newlyUnlocked.push(levelSci);
      if (!unlockedSci.includes(levelSci.id)) {
        unlockedSci.push(levelSci.id);
      }
    }

    if (this.engine.level?.milestoneId && !unlockedSci.includes(this.engine.level.milestoneId)) {
      unlockedSci.push(this.engine.level.milestoneId);
    }

    const milestone = this.engine.level?.milestone;
    if (!isPresentation) {
      this.saveManager.saveProgress(nextProg, unlockedSci);
    }

    const hasNext = curLevelIdx + 1 < LEVELS.length;
    const result: ResultState = {
      outcome: isOrbit ? 'orbit_win' : 'win',
      fact: this.engine.level?.fact,
      milestone,
      newScientist: newlyUnlocked[0],
      hasNextLevel: hasNext,
    };

    this.stateMachine.transitionTo('RESULT');

    const continueToNextStage = () => {
      if (hasNext) {
        this.showLevelIntro(curLevelIdx + 1, isPresentation);
      } else {
        // All levels completed! Show final grand triumph ending
        this.dialogs.showResult(
          result,
          () => this.stateMachine.transitionTo('MENU'),
          () => this.startLevel(curLevelIdx, isPresentation),
          () => this.stateMachine.transitionTo('MENU')
        );
      }
    };

    // If any scientist is newly unlocked, sequentially pop up the card modal(s)
    // When the user clicks "归队", the card fades out and game continues directly
    if (newlyUnlocked.length > 0) {
      const showCardQueue = (queue: ScientistDefinition[]) => {
        const sci = queue[0];
        const remaining = queue.slice(1);

        this.dialogs.showScientistUnlockCard(
          sci,
          () => {
            this.sound.playClick();
            this.dialogs.showToast(`功勋科学家【${sci.name}】荣耀归队！专属能力已就位`);

            if (remaining.length > 0) {
              window.setTimeout(() => {
                showCardQueue(remaining);
              }, 120);
            } else {
              // User clicked "归队", card faded out, continue game!
              continueToNextStage();
            }
          },
          {
            fact: this.engine.level?.fact,
            levelNumber: curLevelIdx + 1,
            continueHint: hasNext ? '点击【归队】即刻继续下一攻坚阶段' : '点击【归队】完成全篇攻坚试验',
            onHome: () => {
              this.sound.playClick();
              this.stateMachine.transitionTo('MENU');
            },
          }
        );
      };

      showCardQueue(newlyUnlocked);
    } else {
      // Standard victory result dialog when no new scientist is unlocked
      this.dialogs.showResult(
        result,
        () => {
          if (hasNext) {
            this.showLevelIntro(curLevelIdx + 1, isPresentation);
          } else {
            this.stateMachine.transitionTo('MENU');
          }
        },
        () => this.startLevel(curLevelIdx, isPresentation),
        () => this.stateMachine.transitionTo('MENU')
      );
    }
  }

  private handleLevelLoss(): void {
    const curLevelIdx = this.engine.levelIndex;
    const isPresentation = this.engine.isPresentationMode;
    const result: ResultState = {
      outcome: 'lose',
      hasNextLevel: false,
    };

    this.stateMachine.transitionTo('RESULT');
    this.dialogs.showResult(
      result,
      () => {},
      () => this.startLevel(curLevelIdx, isPresentation),
      () => this.stateMachine.transitionTo('MENU')
    );
  }

  private showMainMenu(): void {
    this.menuOverlay.classList.remove('hidden');
    this.dialogs.hideModal();
    const saveData = this.saveManager.getData();

    const wrapEl = document.getElementById('wrap');
    wrapEl?.classList.remove('portrait-active');
    if (this.deckContainer) {
      this.deckContainer.classList.add('hidden');
    }

    MainMenu.render(
      this.menuOverlay,
      {
        onStartCareer: () => {
          this.sound.playClick();
          this.showLevelSelection();
        },
        onOpenPresentation: () => {
          this.sound.playClick();
          this.showPresentationMode();
        },
        onOpenScientists: () => {
          this.sound.playClick();
          this.showScientistGallery();
        },
        onOpenSettings: () => {
          this.sound.playClick();
          this.showSettings();
        },
        onStartEndless: () => {
          this.sound.playClick();
          this.startEndlessChallenge();
        },
      },
      saveData.progress >= LEVELS.length
    );
  }

  private showLevelSelection(): void {
    this.dialogs.hideModal();
    this.menuOverlay.classList.remove('hidden');
    const saveData = this.saveManager.getData();
    LevelSelection.render(
      this.menuOverlay,
      saveData.progress,
      {
        onSelectLevel: (idx) => {
          this.sound.playClick();
          this.showLevelIntro(idx, false);
        },
        onStartEndless: () => {
          this.sound.playClick();
          this.startEndlessChallenge();
        },
        onBack: () => {
          this.sound.playClick();
          this.showMainMenu();
        },
      }
    );
  }

  private showScientistGallery(): void {
    this.dialogs.hideModal();
    this.menuOverlay.classList.remove('hidden');
    const saveData = this.saveManager.getData();
    ScientistGallery.render(
      this.menuOverlay,
      saveData.unlockedScientists,
      () => {
        this.sound.playClick();
        this.showMainMenu();
      },
      (scientist) => {
        this.sound.playClick();
        this.dialogs.showScientistUnlockCard(
          scientist,
          () => {
            // Dismissed card from gallery view
          },
          {
            continueHint: '点击【归队】返回展馆',
          }
        );
      }
    );
  }

  private showPresentationMode(): void {
    this.dialogs.hideModal();
    this.menuOverlay.classList.remove('hidden');
    PresentationMode.render(this.menuOverlay, {
      onStartPresentation: (config: PresentationConfig) => {
        this.sound.playClick();
        this.startPresentationSession(config);
      },
      onBack: () => {
        this.sound.playClick();
        this.showMainMenu();
      },
    });
  }

  private showSettings(): void {
    this.dialogs.hideModal();
    this.menuOverlay.classList.remove('hidden');
    const data = this.saveManager.getData();
    SettingsMenu.render(
      this.menuOverlay,
      this.sound.isEnabled(),
      data.reducedMotion,
      {
        onToggleSound: () => {
          const next = !this.sound.isEnabled();
          this.sound.setEnabled(next);
          this.saveManager.setSoundEnabled(next);
          this.dialogs.showToast(next ? '音效已开启' : '音效已静音');
          return next;
        },
        onToggleReducedMotion: () => {
          const next = !this.saveManager.getData().reducedMotion;
          this.saveManager.setReducedMotion(next);
          this.dialogs.showToast(next ? '减弱动态效果已开启' : '减弱动态效果已关闭');
          return next;
        },
        onResetData: () => {
          this.saveManager.resetAll();
          this.dialogs.showToast('存档数据已重置');
          this.showMainMenu();
        },
        onBack: () => {
          this.sound.playClick();
          this.showMainMenu();
        },
      }
    );
  }

  private showLevelIntro(levelIndex: number, isPresentation: boolean): void {
    const lvl = LEVELS[levelIndex];
    if (!lvl) return;

    this.stateMachine.transitionTo('LEVEL_INTRO');
    this.menuOverlay.classList.add('hidden');

    const unlocked = isPresentation
      ? SCIENTISTS.map((s) => s.id)
      : this.saveManager.getData().unlockedScientists;
    const hasScope = unlocked.includes('sun') || unlocked.includes('scope');

    this.dialogs.showLevelIntro(
      lvl,
      hasScope,
      () => {
        this.sound.playClick();
        this.startLevel(levelIndex, isPresentation);
      },
      () => {
        this.sound.playClick();
        this.dialogs.hideModal();
        if (isPresentation) {
          this.showPresentationMode();
        } else {
          this.showLevelSelection();
        }
      },
      unlocked
    );
  }

  public startLevel(levelIndex: number, isPresentation: boolean = false): void {
    const lvl = LEVELS[levelIndex];
    if (!lvl) return;

    this.dialogs.hideModal();
    this.menuOverlay.classList.add('hidden');

    const unlocked = isPresentation
      ? SCIENTISTS.map((s) => s.id)
      : this.saveManager.getData().unlockedScientists;

    this.engine.startLevel(lvl, levelIndex, unlocked, isPresentation);
    this.stateMachine.transitionTo('PLAYING');
    this.checkLayoutAndResize();
    this.updateHUD();
  }

  private startPresentationSession(config: PresentationConfig): void {
    const lvl = LEVELS[config.levelIndex];
    if (!lvl) return;

    this.dialogs.hideModal();
    this.menuOverlay.classList.add('hidden');

    const unlocked = config.unlockAllAbilities
      ? SCIENTISTS.map((s) => s.id).concat(['atomic'])
      : this.getHistoricalScientistsUpToLevel(config.levelIndex);

    this.engine.startLevel(lvl, config.levelIndex, unlocked, true);

    if (config.infiniteAmmo) {
      this.engine.warheads = {
        normal: 9,
        atomic: 5,
        hydro: 3,
        bunker: 5,
        deploy: 3,
      };
    }

    this.stateMachine.transitionTo('PLAYING');
    this.checkLayoutAndResize();
    this.updateHUD();
    this.dialogs.showToast('自由演示模式启动：任意演练，不计入普通存档');
  }

  private getHistoricalScientistsUpToLevel(levelIndex: number): string[] {
    const ids: string[] = [];
    SCIENTISTS.forEach((s) => {
      if (s.after <= levelIndex + 1) {
        ids.push(s.id);
      }
    });
    if (levelIndex >= 4) ids.push('atomic');
    return ids;
  }

  public startEndlessChallenge(): void {
    this.dialogs.hideModal();
    this.menuOverlay.classList.add('hidden');

    const allScientists = SCIENTISTS.map((s) => s.id).concat(['atomic']);
    this.engine.startEndless(allScientists);
    this.stateMachine.transitionTo('PLAYING');
    this.checkLayoutAndResize();
    this.updateHUD();
    this.dialogs.showToast('无尽挑战：尽可能多地摧毁核心，弹药耗尽即结束！');
  }

  private handleStateTransition(_from: string, to: string): void {
    if (to === 'MENU') {
      this.showMainMenu();
    }
  }

  private updateHUD(): void {
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 900;
    this.hud.update(this.engine, this.sound.isEnabled(), isPortrait);
  }

  private startLoop(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    const frame = (now: number) => {
      let dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dt > 0.25) dt = 0.25;

      const currentState = this.stateMachine.getState();
      if (currentState === 'PLAYING') {
        this.accumulator += dt;
        let steps = 0;
        const fixedDelta = GAME_CONFIG.FIXED_DELTA;

        while (this.accumulator >= fixedDelta && steps < GAME_CONFIG.MAX_STEPS_PER_FRAME) {
          this.engine.tick(fixedDelta);
          this.accumulator -= fixedDelta;
          steps++;
        }
      }

      this.renderer.render(this.engine, this.saveManager.getData().reducedMotion);

      if (this.isRunning) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }
}
