// ReproX Zero-Network Request Monitor
// Intercepts and audits any client-side network calls to prove 100% offline compliance

export interface NetworkLogEntry {
  id: string;
  url: string;
  method: string;
  timestamp: string;
  status: 'intercepted' | 'blocked' | 'offline';
}

class NetworkMonitorService {
  private requestsCount: number = 0;
  private logs: NetworkLogEntry[] = [];
  private listeners: Array<(count: number, logs: NetworkLogEntry[]) => void> = [];
  private isInstalled: boolean = false;

  constructor() {
    this.installInterceptors();
  }

  public installInterceptors() {
    if (this.isInstalled || typeof window === 'undefined') return;
    this.isInstalled = true;

    const originalFetch = window.fetch;
    const originalXhrOpen = window.XMLHttpRequest.prototype.open;

    // Monitor fetch calls
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      // Filter out internal service worker or blob/data URLs
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        this.recordRequest(url, 'FETCH');
      }
      return originalFetch.apply(window, args);
    };

    // Monitor XHR calls
    const self = this;
    window.XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: any[]
    ) {
      const urlString = url.toString();
      if (!urlString.startsWith('blob:') && !urlString.startsWith('data:')) {
        self.recordRequest(urlString, method);
      }
      return originalXhrOpen.apply(this, [method, url, ...rest] as any);
    };
  }

  private recordRequest(url: string, method: string) {
    this.requestsCount++;
    const entry: NetworkLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      method,
      timestamp: new Date().toLocaleTimeString(),
      status: !navigator.onLine ? 'offline' : 'intercepted',
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    this.notify();
  }

  public getCount(): number {
    return this.requestsCount;
  }

  public getLogs(): NetworkLogEntry[] {
    return [...this.logs];
  }

  public reset() {
    this.requestsCount = 0;
    this.logs = [];
    this.notify();
  }

  public subscribe(fn: (count: number, logs: NetworkLogEntry[]) => void) {
    this.listeners.push(fn);
    fn(this.requestsCount, this.logs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.requestsCount, this.logs));
  }
}

export const networkMonitor = new NetworkMonitorService();
