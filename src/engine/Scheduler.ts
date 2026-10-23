export interface ScheduledTask {
  readonly id: number;
  readonly sessionId: number;
  remainingTime: number;
  readonly callback: () => void;
  cancelled: boolean;
}

export class Scheduler {
  private nextTaskId = 1;
  private tasks: ScheduledTask[] = [];

  public schedule(delaySeconds: number, sessionId: number, callback: () => void): number {
    const id = this.nextTaskId++;
    this.tasks.push({
      id,
      sessionId,
      remainingTime: Math.max(0, delaySeconds),
      callback,
      cancelled: false,
    });
    return id;
  }

  public cancel(taskId: number): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.cancelled = true;
    }
  }

  public cancelAllForSession(sessionId: number): void {
    for (const task of this.tasks) {
      if (task.sessionId === sessionId) {
        task.cancelled = true;
      }
    }
    this.tasks = this.tasks.filter((t) => !t.cancelled);
  }

  public clearAll(): void {
    for (const task of this.tasks) {
      task.cancelled = true;
    }
    this.tasks = [];
  }

  public tick(dt: number, currentActiveSessionId: number): void {
    const readyTasks: ScheduledTask[] = [];
    const remainingTasks: ScheduledTask[] = [];

    for (const task of this.tasks) {
      if (task.cancelled || task.sessionId !== currentActiveSessionId) {
        continue;
      }
      task.remainingTime -= dt;
      if (task.remainingTime <= 0) {
        readyTasks.push(task);
      } else {
        remainingTasks.push(task);
      }
    }

    this.tasks = remainingTasks;

    for (const task of readyTasks) {
      if (!task.cancelled && task.sessionId === currentActiveSessionId) {
        try {
          task.callback();
        } catch (e) {
          console.error('Error executing scheduled task:', e);
        }
      }
    }
  }

  public getPendingCount(): number {
    return this.tasks.length;
  }
}
