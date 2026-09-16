import { CrashReport, DeviceContext, UserAction } from '../types/reprox';
import { actionTracker } from './actionTracker';

const CRASHES_STORAGE_KEY = 'reprox_crash_reports_v2';

export interface CrashTemplate {
  errorType: string;
  message: string;
  screen: string;
  method: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  stackTrace: string;
  triggerDescription: string;
}

export const CRASH_TEMPLATES: Record<string, CrashTemplate> = {
  NULL_POINTER_CHECKOUT: {
    errorType: 'NullPointerException',
    message: 'Attempted to invoke virtual method on null paymentMethod reference.',
    screen: 'Checkout',
    method: 'PaymentService.processPayment()',
    severity: 'Critical',
    triggerDescription: 'Triggered Pay before selecting a payment method',
    stackTrace: `java.lang.NullPointerException: Attempt to invoke virtual method 'void com.reprox.coffee.service.PaymentService.processPayment(com.reprox.coffee.model.PaymentMethod)' on a null object reference
    at com.reprox.coffee.service.PaymentService.processPayment(PaymentService.kt:89)
    at com.reprox.coffee.ui.CheckoutViewModel.pay(CheckoutViewModel.kt:54)
    at com.reprox.coffee.ui.CheckoutScreen.onPayClicked(CheckoutScreen.kt:142)
    at com.reprox.coffee.ui.CheckoutScreenKt$CheckoutScreen$4$1.invoke(CheckoutScreen.kt:142)
    at androidx.compose.material3.ButtonKt$Button$2.invoke(Button.kt:124)
    at androidx.compose.ui.platform.AndroidComposeView.dispatchTouchEvent(AndroidComposeView.android.kt:856)`,
  },
  INDEX_OUT_OF_BOUNDS_CART: {
    errorType: 'IndexOutOfBoundsException',
    message: 'Index 4 out of bounds for length 3 in cart item list',
    screen: 'Cart',
    method: 'CartAdapter.onBindViewHolder()',
    severity: 'High',
    triggerDescription: 'Rapid item removal race condition in cart adapter',
    stackTrace: `java.lang.IndexOutOfBoundsException: Index 4 out of bounds for length 3
    at java.util.ArrayList.get(ArrayList.java:435)
    at com.reprox.coffee.ui.CartAdapter.onBindViewHolder(CartAdapter.kt:64)
    at com.reprox.coffee.ui.CartAdapter.onBindViewHolder(CartAdapter.kt:22)
    at androidx.recyclerview.widget.RecyclerView$Adapter.bindViewHolder(RecyclerView.java:7337)
    at androidx.recyclerview.widget.RecyclerView$Recycler.getViewForPosition(RecyclerView.java:6118)`,
  },
  NETWORK_TIMEOUT_API: {
    errorType: 'SocketTimeoutException',
    message: 'failed to connect to api.reproxcoffee.internal/v2/orders after 10000ms',
    screen: 'Payment',
    method: 'PaymentClient.submitOrder()',
    severity: 'High',
    triggerDescription: 'Simulated network timeout during payment gateway authorization',
    stackTrace: `java.net.SocketTimeoutException: failed to connect to api.reproxcoffee.internal/v2/orders after 10000ms
    at okhttp3.internal.connection.RealCall.callStart(RealCall.kt:148)
    at com.reprox.coffee.network.PaymentClient.submitOrder(PaymentClient.kt:89)
    at com.reprox.coffee.viewmodel.PaymentViewModel$process$1.invokeSuspend(PaymentViewModel.kt:73)`,
  }
};

class CrashSimulatorService {
  private crashes: CrashReport[] = [];
  private listeners: Set<(crashes: CrashReport[]) => void> = new Set();

  private cachedBatteryLevel = 84;
  private cachedDeviceModel = 'Unknown Device';
  private cachedOs = 'Unknown OS';
  
  constructor() {
    this.initDeviceContext();
    this.loadFromStorage();
  }

  private async initDeviceContext() {
    const ua = navigator.userAgent;
    
    // Parse OS
    if (ua.includes('Windows')) this.cachedOs = 'Windows';
    else if (ua.includes('Mac OS X')) this.cachedOs = 'macOS';
    else if (ua.includes('Android')) this.cachedOs = 'Android';
    else if (ua.includes('Linux')) this.cachedOs = 'Linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) this.cachedOs = 'iOS';
    
    // Attempt to extract Android model if available
    const androidMatch = ua.match(/Android [^;]+; ([^)]+)\)/);
    if (androidMatch && androidMatch[1]) {
      this.cachedDeviceModel = androidMatch[1].trim();
    } else {
      // Basic browser detection for non-mobile
      if (ua.includes('Chrome')) this.cachedDeviceModel = 'Chrome Browser';
      else if (ua.includes('Firefox')) this.cachedDeviceModel = 'Firefox Browser';
      else if (ua.includes('Safari')) this.cachedDeviceModel = 'Safari Browser';
    }

    try {
      if ((navigator as any).getBattery) {
        const battery = await (navigator as any).getBattery();
        this.cachedBatteryLevel = Math.floor(battery.level * 100);
        
        // Update any existing baseline crashes that might have the default 84%
        this.crashes.forEach(c => {
          if (c.deviceContext.batteryLevelPercent === 84) {
            c.deviceContext.batteryLevelPercent = this.cachedBatteryLevel;
          }
          if (c.deviceContext.deviceModel === 'Unknown Device') {
            c.deviceContext.deviceModel = this.cachedDeviceModel;
          }
        });
        this.saveToStorage();
        this.notify();

        battery.addEventListener('levelchange', () => {
          this.cachedBatteryLevel = Math.floor(battery.level * 100);
        });
      }
    } catch (e) {
      // ignore
    }
  }

  public getMockDeviceContext(): DeviceContext {
    const memoryGb = (navigator as any).deviceMemory || 4; // default to 4GB if not supported
    return {
      os: this.cachedOs,
      osVersion: navigator.userAgent.substring(0, 40) + '...',
      deviceModel: this.cachedDeviceModel,
      appVersion: '1.4.2',
      buildNumber: '1042',
      memoryUsageMb: Math.floor(Math.random() * 100) + 150,
      totalMemoryMb: memoryGb * 1024,
      batteryLevelPercent: this.cachedBatteryLevel,
      networkStatus: navigator.onLine ? 'WIFI' : 'OFFLINE',
      screenOrientation: window.innerHeight > window.innerWidth ? 'PORTRAIT' : 'LANDSCAPE',
      isSimulated: true,
    };
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CRASHES_STORAGE_KEY);
      if (stored) {
        this.crashes = JSON.parse(stored);
      } else {
        // Populate with realistic baseline sample reports for the Crash Explorer
        this.crashes = this.generateInitialSampleReports();
        this.saveToStorage();
      }
    } catch {
      this.crashes = this.generateInitialSampleReports();
    }
  }

  private generateInitialSampleReports(): CrashReport[] {
    const dc = this.getMockDeviceContext();
    return [
      {
        id: 'CRASH-8F42A1',
        timestamp: '10:42:17',
        epochTime: Date.now() - 1000 * 60 * 12,
        errorType: 'NullPointerException',
        message: 'Attempted to invoke virtual method on null paymentMethod reference.',
        method: 'PaymentService.processPayment()',
        screen: 'Checkout',
        severity: 'Critical',
        status: 'New',
        occurrences: 48,
        lastSeen: '12m ago',
        stackTrace: CRASH_TEMPLATES.NULL_POINTER_CHECKOUT.stackTrace,
        recentActions: [
          { id: 'act-01', timestamp: '10:42:01', epochTime: Date.now() - 25000, type: 'NAVIGATION', screen: 'Menu', description: 'Viewed Cappuccino', actionName: 'Navigate', target: 'Menu' },
          { id: 'act-02', timestamp: '10:42:05', epochTime: Date.now() - 21000, type: 'CLICK', screen: 'Menu', description: 'Added Cappuccino', actionName: 'Tap', target: 'Add to Cart' },
          { id: 'act-03', timestamp: '10:42:09', epochTime: Date.now() - 17000, type: 'NAVIGATION', screen: 'Cart', description: 'Opened Cart', actionName: 'Navigate', target: 'Cart' },
          { id: 'act-04', timestamp: '10:42:12', epochTime: Date.now() - 14000, type: 'NAVIGATION', screen: 'Checkout', description: 'Opened Checkout', actionName: 'Navigate', target: 'Checkout' },
          { id: 'act-05', timestamp: '10:42:15', epochTime: Date.now() - 11000, type: 'STATE_CHANGE', screen: 'Checkout', description: 'Payment method = null', actionName: 'State', target: 'paymentMethod' },
          { id: 'act-06', timestamp: '10:42:17', epochTime: Date.now() - 9000, type: 'CLICK', screen: 'Checkout', description: 'Tapped Pay Now', actionName: 'Tap', target: 'Pay Now' },
        ],
        deviceContext: dc,
        tags: { environment: 'production', category: 'checkout' },
      },
      {
        id: 'CRASH-3B77C2',
        timestamp: '09:15:40',
        epochTime: Date.now() - 1000 * 60 * 180,
        errorType: 'IndexOutOfBoundsException',
        message: 'Index 4 out of bounds for length 3 in cart item list',
        method: 'CartAdapter.onBindViewHolder()',
        screen: 'Cart',
        severity: 'High',
        status: 'Reproduced',
        occurrences: 23,
        lastSeen: '3h ago',
        stackTrace: CRASH_TEMPLATES.INDEX_OUT_OF_BOUNDS_CART.stackTrace,
        recentActions: [
          { id: 'act-11', timestamp: '09:15:20', epochTime: Date.now() - 20000, type: 'CLICK', screen: 'Cart', description: 'Removed Espresso Classic', actionName: 'Tap', target: 'Delete' },
          { id: 'act-12', timestamp: '09:15:21', epochTime: Date.now() - 19000, type: 'CLICK', screen: 'Cart', description: 'Rapid delete tap on row 2', actionName: 'Tap', target: 'Delete' },
        ],
        deviceContext: dc,
        tags: { environment: 'production', category: 'cart' },
      },
      {
        id: 'CRASH-9E11D4',
        timestamp: 'Yesterday',
        epochTime: Date.now() - 1000 * 60 * 1440,
        errorType: 'SocketTimeoutException',
        message: 'failed to connect to api.reproxcoffee.internal/v2/orders after 10000ms',
        method: 'PaymentClient.submitOrder()',
        screen: 'Payment',
        severity: 'High',
        status: 'Fixed',
        occurrences: 87,
        lastSeen: '1d ago',
        stackTrace: CRASH_TEMPLATES.NETWORK_TIMEOUT_API.stackTrace,
        recentActions: [
          { id: 'act-21', timestamp: '14:10:02', epochTime: Date.now() - 50000, type: 'CLICK', screen: 'Checkout', description: 'Selected UPI Payment', actionName: 'Select', target: 'UPI' },
          { id: 'act-22', timestamp: '14:10:05', epochTime: Date.now() - 47000, type: 'CLICK', screen: 'Checkout', description: 'Dispatched order payment payload', actionName: 'Tap', target: 'Pay Now' },
        ],
        deviceContext: dc,
        tags: { environment: 'staging', category: 'network' },
      }
    ];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CRASHES_STORAGE_KEY, JSON.stringify(this.crashes));
    } catch {
      // Ignore
    }
  }

  public simulateCrash(templateKey: keyof typeof CRASH_TEMPLATES = 'NULL_POINTER_CHECKOUT', customScreen?: string): CrashReport {
    const template = CRASH_TEMPLATES[templateKey] || CRASH_TEMPLATES.NULL_POINTER_CHECKOUT;
    const currentScreen = customScreen || template.screen;

    // Log the crash event into the action buffer first
    actionTracker.recordAction(
      'CRASH_TRIGGER',
      currentScreen,
      `💥 Fatal Crash Triggered: ${template.errorType} in ${template.method}`,
      { errorType: template.errorType, method: template.method }
    );

    // Freeze snapshot of recent actions (maximum 15)
    const recentActionsSnapshot: UserAction[] = actionTracker.getRecentActions();

    const now = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Deterministic format CRASH-8F42A1
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const crashId = templateKey === 'NULL_POINTER_CHECKOUT' ? 'CRASH-8F42A1' : `CRASH-${randomHex}`;

    const crashReport: CrashReport = {
      id: crashId,
      timestamp,
      epochTime: Date.now(),
      errorType: template.errorType,
      message: template.message,
      method: template.method,
      severity: template.severity,
      status: 'New',
      occurrences: 1,
      lastSeen: 'Just now',
      stackTrace: template.stackTrace,
      screen: currentScreen,
      recentActions: recentActionsSnapshot,
      deviceContext: this.getMockDeviceContext(),
      tags: {
        environment: 'staging',
        reproductionDifficulty: 'EASY',
        releaseTrack: 'INTERNAL_TESTING',
      }
    };

    // Prepend to crash history
    this.crashes.unshift(crashReport);
    if (this.crashes.length > 40) {
      this.crashes = this.crashes.slice(0, 40);
    }
    this.saveToStorage();
    this.notify();

    return crashReport;
  }

  public getAllCrashes(): CrashReport[] {
    return [...this.crashes];
  }

  public getCrashById(id: string): CrashReport | undefined {
    return this.crashes.find(c => c.id === id);
  }

  public getLatestCrash(): CrashReport | undefined {
    return this.crashes[0];
  }

  public clearCrashes(): void {
    this.crashes = [];
    this.saveToStorage();
    this.notify();
  }

  public subscribe(listener: (crashes: CrashReport[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllCrashes());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const list = this.getAllCrashes();
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (err) {
        console.error(err);
      }
    });
  }
}

export const crashSimulator = new CrashSimulatorService();
