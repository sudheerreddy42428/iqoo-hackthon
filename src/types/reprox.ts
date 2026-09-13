export type ActionType = 
  | 'NAVIGATION' 
  | 'CLICK' 
  | 'INPUT' 
  | 'STATE_CHANGE' 
  | 'API_CALL' 
  | 'CRASH_TRIGGER';

export interface UserAction {
  id: string;
  timestamp: string; // HH:mm:ss.SSS format
  epochTime: number;
  type: ActionType;
  screen: string;
  actionName?: string; // Tap, Navigate, etc.
  target?: string; // "Pay Now", "Cart"
  description: string;
  metadata?: Record<string, any>;
}

export interface DeviceContext {
  os: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  buildNumber: string;
  memoryUsageMb: number;
  totalMemoryMb: number;
  batteryLevelPercent: number;
  networkStatus: 'WIFI' | 'CELLULAR' | 'OFFLINE';
  screenOrientation: 'PORTRAIT' | 'LANDSCAPE';
}

export interface CrashReport {
  id: string;
  timestamp: string;
  epochTime: number;
  errorType: string;
  message: string;
  stackTrace: string;
  screen: string;
  recentActions: UserAction[];
  deviceContext: DeviceContext;
  tags?: Record<string, string>;
}

export interface ReproductionStep {
  stepNumber: number;
  action: string;
  screen: string;
  details?: string;
}

export interface SuggestedFix {
  title: string;
  explanation: string;
  filePath: string;
  language: 'kotlin' | 'java' | 'typescript' | 'diff';
  codeSnippet: string;
}

export interface AnalysisResult {
  reportId: string;
  analyzerName: string;
  likelyRootCause: string;
  reproductionSteps: ReproductionStep[];
  suggestedFix: SuggestedFix;
  confidenceScore: number; // 0 to 100
  affectedComponent: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export interface RegressionTest {
  framework: 'Espresso' | 'Compose UI';
  language: 'kotlin';
  testName: string;
  code: string;
}

export interface AIAnalyzer {
  name: string;
  description: string;
  analyze: (report: CrashReport) => Promise<AnalysisResult>;
}

export interface SimulatedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  badge?: string;
}

export interface CartItem {
  product: SimulatedProduct;
  quantity: number;
  temperature?: 'Hot' | 'Iced';
  size?: 'Regular' | 'Large';
}

export type SimulatedScreen = 'Home' | 'Products' | 'Cart' | 'Checkout' | 'Payment';
