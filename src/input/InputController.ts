import { GAME_CONFIG } from '../data/gameConfig';

export interface InputCallbacks {
  onPointerDown: (pos: { x: number; y: number }) => void;
  onPointerMove: (pos: { x: number; y: number }) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onSpacePress: () => void;
  onEscapePress: () => void;
}

export class InputController {
  private canvas: HTMLCanvasElement;
  private callbacks: InputCallbacks;
  private activePointerId: number | null = null;
  public getTransform?: () => { offsetX: number; offsetY: number; scale: number };

  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundPointerCancel: (e: PointerEvent) => void;
  private boundLostCapture: (e: PointerEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: InputCallbacks,
    getTransform?: () => { offsetX: number; offsetY: number; scale: number }
  ) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.getTransform = getTransform;

    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundPointerCancel = this.handlePointerCancel.bind(this);
    this.boundLostCapture = this.handleLostCapture.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.attach();
  }

  public attach(): void {
    const cv = this.canvas;
    cv.addEventListener('pointerdown', this.boundPointerDown);
    cv.addEventListener('pointermove', this.boundPointerMove);
    cv.addEventListener('pointerup', this.boundPointerUp);
    cv.addEventListener('pointercancel', this.boundPointerCancel);
    cv.addEventListener('lostpointercapture', this.boundLostCapture);
    window.addEventListener('keydown', this.boundKeyDown);
  }

  public detach(): void {
    const cv = this.canvas;
    cv.removeEventListener('pointerdown', this.boundPointerDown);
    cv.removeEventListener('pointermove', this.boundPointerMove);
    cv.removeEventListener('pointerup', this.boundPointerUp);
    cv.removeEventListener('pointercancel', this.boundPointerCancel);
    cv.removeEventListener('lostpointercapture', this.boundLostCapture);
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  public toLogicalPos(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    if (this.getTransform) {
      const { offsetX, offsetY, scale } = this.getTransform();
      if (scale > 0) {
        const x = (screenX - offsetX) / scale;
        const y = (screenY - offsetY) / scale;
        return { x, y };
      }
    }

    const x = (screenX / (rect.width || 1)) * GAME_CONFIG.WORLD_WIDTH;
    const y = (screenY / (rect.height || 1)) * GAME_CONFIG.WORLD_HEIGHT;
    return { x, y };
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Left click only
    this.activePointerId = e.pointerId;

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {}

    const pos = this.toLogicalPos(e.clientX, e.clientY);
    this.callbacks.onPointerDown(pos);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    const pos = this.toLogicalPos(e.clientX, e.clientY);
    this.callbacks.onPointerMove(pos);
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;

    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch {}

    this.callbacks.onPointerUp();
  }

  private handlePointerCancel(e: PointerEvent): void {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    this.callbacks.onPointerCancel();
  }

  private handleLostCapture(): void {
    this.activePointerId = null;
    this.callbacks.onPointerCancel();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    if (e.code === 'Space') {
      e.preventDefault();
      this.callbacks.onSpacePress();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      this.callbacks.onEscapePress();
    }
  }
}
