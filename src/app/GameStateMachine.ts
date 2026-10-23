import { GameLifecycleState } from '../types/game';

export class GameStateMachine {
  private currentState: GameLifecycleState = 'MENU';
  private onStateChange?: (from: GameLifecycleState, to: GameLifecycleState) => void;

  constructor(
    initialState: GameLifecycleState = 'MENU',
    onStateChange?: (from: GameLifecycleState, to: GameLifecycleState) => void
  ) {
    this.currentState = initialState;
    this.onStateChange = onStateChange;
  }

  public getState(): GameLifecycleState {
    return this.currentState;
  }

  public transitionTo(newState: GameLifecycleState): boolean {
    if (this.currentState === newState) return false;

    // Check transition validity
    const from = this.currentState;
    this.currentState = newState;
    this.onStateChange?.(from, newState);
    return true;
  }
}
