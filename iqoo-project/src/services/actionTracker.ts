import { UserAction, ActionType } from '../types/reprox';

const MAX_BUFFER_SIZE = 15;
const STORAGE_KEY = 'reprox_action_buffer';

type ActionBufferListener = (actions: UserAction[], droppedAction?: UserAction) => void;

class ActionTrackerService {
  private buffer: UserAction[] = [];
  private listeners: Set<ActionBufferListener> = new Set();
  private totalActionsLogged: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  private formatTime(date: Date = new Date()): string {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.buffer = parsed.slice(-MAX_BUFFER_SIZE);
          this.totalActionsLogged = this.buffer.length;
        }
      }
    } catch {
      this.buffer = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer));
    } catch {
      // Ignore quota errors in demo
    }
  }

  public recordAction(
    type: ActionType,
    screen: string,
    description: string,
    metadata?: Record<string, any>,
    actionName?: string,
    target?: string
  ): UserAction {
    const action: UserAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: this.formatTime(),
      epochTime: Date.now(),
      type,
      screen,
      actionName,
      target,
      description,
      metadata,
    };

    let droppedAction: UserAction | undefined;

    // Rolling context buffer: Keep at most MAX_BUFFER_SIZE (15) actions
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      droppedAction = this.buffer.shift(); // Remove the oldest action
    }

    this.buffer.push(action);
    this.totalActionsLogged++;
    this.saveToStorage();

    // Notify subscribers
    this.notify(droppedAction);

    return action;
  }

  public getRecentActions(): UserAction[] {
    return [...this.buffer];
  }

  public getBufferCapacity(): { current: number; max: number; totalLogged: number } {
    return {
      current: this.buffer.length,
      max: MAX_BUFFER_SIZE,
      totalLogged: this.totalActionsLogged,
    };
  }

  public clearBuffer(): void {
    this.buffer = [];
    this.saveToStorage();
    this.notify();
  }

  public subscribe(listener: ActionBufferListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.getRecentActions());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(droppedAction?: UserAction): void {
    const actions = this.getRecentActions();
    this.listeners.forEach((listener) => {
      try {
        listener(actions, droppedAction);
      } catch (err) {
        console.error('Error in action listener', err);
      }
    });
  }
}

export const actionTracker = new ActionTrackerService();
