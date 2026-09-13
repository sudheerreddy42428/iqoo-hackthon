import { CrashReport, DeviceContext, UserAction } from '../types/reprox';
import { actionTracker } from './actionTracker';

const CRASHES_STORAGE_KEY = 'reprox_crash_reports';

export interface CrashTemplate {
  errorType: string;
  message: string;
  screen: string;
  stackTrace: string;
  triggerDescription: string;
}

export const CRASH_TEMPLATES: Record<string, CrashTemplate> = {
  NULL_POINTER_CHECKOUT: {
    errorType: 'NullPointerException',
    message: 'Attempted to access paymentMethod but paymentMethod was null.',
    screen: 'Checkout',
    triggerDescription: 'Triggered Pay before selecting a payment method',
    stackTrace: `java.lang.NullPointerException: Attempted to invoke virtual method 'String com.reprox.coffee.model.PaymentMethod.getId()' on a null object reference
    at com.reprox.coffee.ui.CheckoutScreen.onPayClicked(CheckoutScreen.kt:142)
    at com.reprox.coffee.ui.CheckoutScreen.access$onPayClicked(CheckoutScreen.kt:38)
    at com.reprox.coffee.ui.CheckoutScreen$Composable$2$1.invoke(CheckoutScreen.kt:96)
    at com.reprox.coffee.ui.CheckoutScreen$Composable$2$1.invoke(CheckoutScreen.kt:94)
    at androidx.compose.material3.ButtonElevation$animateElevation$2.invokeSuspend(ButtonElevation.kt:118)
    at com.reprox.coffee.controller.PaymentController.processPayment(PaymentController.kt:47)
    at android.view.View.performClick(View.java:7823)
    at android.view.View.performClickInternal(View.java:7800)
    at android.os.Handler.handleCallback(Handler.java:958)`,
  },
  INDEX_OUT_OF_BOUNDS_CART: {
    errorType: 'IndexOutOfBoundsException',
    message: 'Index 4 out of bounds for length 3 in cart item list',
    screen: 'Cart',
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

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CRASHES_STORAGE_KEY);
      if (stored) {
        this.crashes = JSON.parse(stored);
      }
    } catch {
      this.crashes = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CRASHES_STORAGE_KEY, JSON.stringify(this.crashes));
    } catch {
      // Ignore storage limit
    }
  }

  public getMockDeviceContext(): DeviceContext {
    return {
      os: 'Android',
      osVersion: 'Android 15 (API Level 35)',
      deviceModel: 'Google Pixel 8 Pro',
      appVersion: '1.4.2',
      buildNumber: '428',
      memoryUsageMb: 148,
      totalMemoryMb: 512,
      batteryLevelPercent: 78,
      networkStatus: 'WIFI',
      screenOrientation: 'PORTRAIT',
    };
  }

  public simulateCrash(templateKey: keyof typeof CRASH_TEMPLATES = 'NULL_POINTER_CHECKOUT', customScreen?: string): CrashReport {
    const template = CRASH_TEMPLATES[templateKey] || CRASH_TEMPLATES.NULL_POINTER_CHECKOUT;
    const currentScreen = customScreen || template.screen;

    // Log the crash event into the action buffer first
    actionTracker.recordAction(
      'CRASH_TRIGGER',
      currentScreen,
      `💥 Fatal Crash Triggered: ${template.errorType} - ${template.message}`,
      { errorType: template.errorType }
    );

    // Freeze snapshot of recent actions (maximum 15)
    const recentActionsSnapshot: UserAction[] = actionTracker.getRecentActions();

    const now = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;

    const generateHash = () => Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const crashReport: CrashReport = {
      id: `rx-${generateHash().substring(0, 8)}-${generateHash().substring(8, 12)}-${generateHash().substring(12, 16)}-${generateHash().substring(16, 20)}-${generateHash().substring(20, 32)}`,
      timestamp,
      epochTime: Date.now(),
      errorType: template.errorType,
      message: template.message,
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
    if (this.crashes.length > 30) {
      this.crashes = this.crashes.slice(0, 30);
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
