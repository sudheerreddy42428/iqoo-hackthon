import { CrashReport, DeviceContext, UserAction } from '../types/reprox';
import { actionTracker } from './actionTracker';

const CRASHES_STORAGE_KEY = 'reprox_crash_reports_v2';

export interface CrashTemplate {
  errorType: string;
  message: string;
  screen: string;
  method: string;
  severity: 'High' | 'Medium' | 'Low';
  stackTrace: string;
  triggerDescription: string;
}

export const CRASH_TEMPLATES: Record<string, CrashTemplate> = {
  REMOTE_PAYMENT_GATEWAY_505: {
    errorType: 'PaymentGatewayException',
    message: 'Remote payment gateway failed with HTTP 505: Protocol/Version not supported by upstream gateway',
    screen: 'Checkout',
    method: 'PaymentGatewayService.executeTransaction()',
    severity: 'High',
    triggerDescription: 'Remote payment gateway returned HTTP 505 during transaction processing',
    stackTrace: `com.reprox.coffee.network.PaymentGatewayException: HTTP 505 Gateway Protocol Mismatch
    at com.reprox.coffee.service.PaymentGatewayService.executeTransaction(PaymentGatewayService.kt:114)
    at com.reprox.coffee.ui.CheckoutViewModel.processPayment(CheckoutViewModel.kt:82)
    at com.reprox.coffee.ui.CheckoutScreen.onPayClicked(CheckoutScreen.kt:156)`,
  },
  CONCURRENT_CART_REMOVE: {
    errorType: 'ConcurrentModificationException',
    message: 'Concurrent modification during remove item from cart',
    screen: 'Cart',
    method: 'CartViewModel.removeItem()',
    severity: 'High',
    triggerDescription: 'Remove all items from cart concurrently',
    stackTrace: `java.util.ConcurrentModificationException: Concurrent modification during remove item from cart
    at java.util.ArrayList$Itr.checkForComodification(ArrayList.java:1043)
    at java.util.ArrayList$Itr.next(ArrayList.java:997)
    at com.reprox.coffee.ui.CartViewModel.removeItem(CartViewModel.kt:45)
    at com.reprox.coffee.ui.CartScreen.onRemoveClicked(CartScreen.kt:112)`,
  },
  LOCATION_SERVICE_DENIED: {
    errorType: 'SecurityException',
    message: 'Location permission denied by user',
    screen: 'StoreLocator',
    method: 'LocationManager.getLastKnownLocation()',
    severity: 'High',
    triggerDescription: 'Location service denied during nearby store lookup',
    stackTrace: `java.lang.SecurityException: Location permission denied by user
    at android.app.ContextImpl.enforceCallingOrSelfPermission(ContextImpl.java:2296)
    at android.location.LocationManager.getLastKnownLocation(LocationManager.java:3239)
    at com.reprox.coffee.location.StoreLocatorManager.findNearby(StoreLocatorManager.kt:55)`,
  },
  RAPID_PAYMENT_SWITCH: {
    errorType: 'IllegalStateException',
    message: 'Payment method state corrupted by rapid switching',
    screen: 'Checkout',
    method: 'PaymentMethodSelector.commitSelection()',
    severity: 'High',
    triggerDescription: 'Switch payment methods rapidly causing state corruption',
    stackTrace: `java.lang.IllegalStateException: Payment method state corrupted by rapid switching
    at com.reprox.coffee.ui.PaymentMethodSelector.commitSelection(PaymentMethodSelector.kt:88)
    at com.reprox.coffee.ui.CheckoutViewModel.updatePaymentMethod(CheckoutViewModel.kt:62)`,
  },
  BACKGROUND_DURING_PAYMENT: {
    errorType: 'LifecycleException',
    message: 'App sent to background during active payment transaction',
    screen: 'Checkout',
    method: 'PaymentTransactionActivity.onPause()',
    severity: 'High',
    triggerDescription: 'Background app during payment',
    stackTrace: `com.reprox.coffee.lifecycle.LifecycleException: App sent to background during active payment transaction
    at com.reprox.coffee.ui.PaymentTransactionActivity.onPause(PaymentTransactionActivity.kt:105)
    at android.app.Activity.performPause(Activity.java:8253)
    at android.app.Instrumentation.callActivityOnPause(Instrumentation.java:1504)`,
  },
  MEMORY_LEAK_OOM: {
    errorType: 'OutOfMemoryError',
    message: 'Failed to allocate 16MB for bitmap cache in payment screen',
    screen: 'Payment',
    method: 'BitmapFactory.nativeDecodeAsset()',
    severity: 'High',
    triggerDescription: 'Memory leak check during payment processing',
    stackTrace: `java.lang.OutOfMemoryError: Failed to allocate 16777216 bytes
    at android.graphics.BitmapFactory.nativeDecodeAsset(Native Method)
    at android.graphics.BitmapFactory.decodeStream(BitmapFactory.java:773)
    at com.reprox.coffee.ui.PaymentScreen.loadPaymentAssets(PaymentScreen.kt:205)`,
  },
  EXPIRED_JWT_TOKEN: {
    errorType: 'AuthenticationException',
    message: 'JWT Token Expired during checkout validation',
    screen: 'Checkout',
    method: 'AuthInterceptor.intercept()',
    severity: 'High',
    triggerDescription: 'Expired jwt token during checkout',
    stackTrace: `com.reprox.coffee.auth.AuthenticationException: JWT Token Expired during checkout validation
    at com.reprox.coffee.auth.AuthInterceptor.intercept(AuthInterceptor.kt:45)
    at okhttp3.internal.http.RealInterceptorChain.proceed(RealInterceptorChain.kt:109)
    at com.reprox.coffee.network.PaymentClient.validateSession(PaymentClient.kt:120)`,
  }
};

class CrashSimulatorService {
  private crashes: CrashReport[] = [];
  private listeners: Set<(crashes: CrashReport[]) => void> = new Set();

  private cachedBatteryLevel = 84;
  private cachedDeviceModel = 'Unknown Device';
  private cachedOs = 'Unknown OS';
  private cachedOsVersion = 'Unknown Version';
  
  constructor() {
    this.initDeviceContext();
    this.loadFromStorage();
  }

  private async initDeviceContext() {
    const ua = navigator.userAgent;
    
    // Parse OS and OS Version
    if (ua.includes('Windows')) {
      this.cachedOs = 'Windows';
      const match = ua.match(/Windows NT ([0-9.]+)/);
      if (match) this.cachedOsVersion = match[1];
    } else if (ua.includes('Mac OS X')) {
      this.cachedOs = 'macOS';
      const match = ua.match(/Mac OS X ([0-9_]+)/);
      if (match) this.cachedOsVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('Android')) {
      this.cachedOs = 'Android';
      const match = ua.match(/Android ([0-9.]+)/);
      if (match) this.cachedOsVersion = match[1];
    } else if (ua.includes('Linux')) {
      this.cachedOs = 'Linux';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      this.cachedOs = 'iOS';
      const match = ua.match(/OS ([0-9_]+)/);
      if (match) this.cachedOsVersion = match[1].replace(/_/g, '.');
    }
    
    // Attempt to extract Android model if available
    const androidMatch = ua.match(/Android [^;]+; ([^)]+)\)/);
    if (androidMatch && androidMatch[1]) {
      this.cachedDeviceModel = androidMatch[1].trim();
    } else if (this.cachedOs === 'iOS') {
       if (ua.includes('iPhone')) this.cachedDeviceModel = 'iPhone';
       else if (ua.includes('iPad')) this.cachedDeviceModel = 'iPad';
    } else {
      // Basic browser detection for non-mobile
      if (ua.includes('Chrome')) this.cachedDeviceModel = 'Chrome Browser';
      else if (ua.includes('Firefox')) this.cachedDeviceModel = 'Firefox Browser';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) this.cachedDeviceModel = 'Safari Browser';
      else if (ua.includes('Edge')) this.cachedDeviceModel = 'Edge Browser';
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
          if (c.deviceContext.osVersion === 'Unknown Version' || c.deviceContext.osVersion.includes('...')) {
            c.deviceContext.osVersion = this.cachedOsVersion;
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
      osVersion: this.cachedOsVersion !== 'Unknown Version' ? this.cachedOsVersion : navigator.userAgent.substring(0, 40) + '...',
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
        errorType: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.errorType,
        message: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.message,
        method: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.method,
        screen: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.screen,
        severity: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.severity,
        status: 'New',
        occurrences: 48,
        lastSeen: '12m ago',
        stackTrace: CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505.stackTrace,
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
        errorType: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.errorType,
        message: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.message,
        method: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.method,
        screen: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.screen,
        severity: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.severity,
        status: 'Reproduced',
        occurrences: 23,
        lastSeen: '3h ago',
        stackTrace: CRASH_TEMPLATES.CONCURRENT_CART_REMOVE.stackTrace,
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
        errorType: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.errorType,
        message: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.message,
        method: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.method,
        screen: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.screen,
        severity: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.severity,
        status: 'Fixed',
        occurrences: 87,
        lastSeen: '1d ago',
        stackTrace: CRASH_TEMPLATES.LOCATION_SERVICE_DENIED.stackTrace,
        recentActions: [
          { id: 'act-21', timestamp: '14:10:02', epochTime: Date.now() - 50000, type: 'CLICK', screen: 'StoreLocator', description: 'Tapped Find Nearby Store', actionName: 'Tap', target: 'Find Store' },
        ],
        deviceContext: dc,
        tags: { environment: 'staging', category: 'location' },
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

  public simulateCrash(templateKey: keyof typeof CRASH_TEMPLATES = 'REMOTE_PAYMENT_GATEWAY_505', customScreen?: string): CrashReport {
    const template = CRASH_TEMPLATES[templateKey] || CRASH_TEMPLATES.REMOTE_PAYMENT_GATEWAY_505;
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
    const crashId = templateKey === 'REMOTE_PAYMENT_GATEWAY_505' ? 'CRASH-8F42A1' : `CRASH-${randomHex}`;

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

  public receiveExternalCrash(crashReport: CrashReport): void {
    // Prepend to crash history
    this.crashes.unshift(crashReport);
    if (this.crashes.length > 40) {
      this.crashes = this.crashes.slice(0, 40);
    }
    this.saveToStorage();
    this.notify();
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

  public removeCrash(id: string): void {
    this.crashes = this.crashes.filter(c => c.id !== id);
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
