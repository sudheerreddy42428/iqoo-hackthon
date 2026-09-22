export type ActionType = 
  | 'NAVIGATION' 
  | 'CLICK' 
  | 'INPUT' 
  | 'STATE_CHANGE' 
  | 'API_CALL' 
  | 'CRASH_TRIGGER';

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CRASHED' | 'STOPPED';
export type AIAnalysisStatus = 'IDLE' | 'ANALYZING' | 'READY' | 'FAILED';
export type CodeAccessStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'GRANTED' | 'DENIED';

export type WorkflowState = 
  | 'DETECTED' 
  | 'ANALYZING' 
  | 'RISK_ASSESSED' 
  | 'APPROVAL_REQUIRED' 
  | 'AUTO_FIX_ELIGIBLE' 
  | 'FIXING' 
  | 'VERIFYING' 
  | 'FIX_VERIFIED' 
  | 'FIX_FAILED' 
  | 'REJECTED';

export type UploadStatus =
  | 'idle'
  | 'selected'
  | 'validating'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'error';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type?: 'auto-fix' | 'complex-report' | 'normal' | 'error';
  timestamp: Date;
}

export type ChatMode = 'general' | 'reprox';

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ChatMode;
}

export interface PersistentChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'auto-fix' | 'complex-report' | 'normal' | 'error';
  imageUrl?: string;
}

export interface CrashScreenshot {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

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
  stateSnippet?: string; // Relevant state when action occurred
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
  cpuLoadPercent?: number;
  thermalState?: 'NORMAL' | 'FAIR' | 'SERIOUS' | 'CRITICAL';
  isSimulated?: boolean;
}

export type CrashStatus = 'New' | 'Investigating' | 'Reproduced' | 'Fixed' | 'Verified';

export interface CrashReport {
  id: string; // Unique crash ID
  investigationId?: string; // Tied to specific session
  timestamp: string;
  epochTime: number;
  errorType: string;
  message: string;
  stackTrace: string;
  screen: string;
  method?: string;
  severity?: 'High' | 'Medium' | 'Low';
  status?: CrashStatus;
  occurrences?: number;
  lastSeen?: string;
  recentActions: UserAction[];
  deviceContext: DeviceContext;
  tags?: Record<string, string>;
  screenshots?: CrashScreenshot[];
}

export interface ReproductionStep {
  stepNumber: number;
  action: string;
  screen: string;
  details?: string;
  target?: string;
  stateCheck?: string;
}

export interface SuggestedFix {
  title: string;
  explanation: string;
  filePath: string;
  language: 'kotlin' | 'java' | 'typescript' | 'diff';
  codeSnippet: string;
  diffSnippet?: string;
}

export interface RootCauseChainNode {
  label: string;
  type: 'action' | 'state' | 'method' | 'exception';
  detail?: string;
}

export interface ChangeLocation {
  file: string;
  line: number;
  snippet: string;
  isConfirmed: boolean; // True if exact match in stack trace, False if inferred
}

export interface SolutionOption {
  title: string;
  description: string;
  tradeOffs: string;
}

export interface AnalysisResult {
  reportId: string;
  investigationId?: string;
  analyzerName: string;
  likelyRootCause: string;
  whyItHappened: string;
  whatShouldHaveHappened: string;
  triggeringAction: string;
  rootCauseChain?: RootCauseChainNode[];
  evidenceChain: string[];
  reproductionSteps: ReproductionStep[];
  suggestedFix: SuggestedFix;
  preventionRecommendation: string[];
  confidenceScore: number; // 0 to 100
  confidenceReason: string;
  affectedComponent: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  correlationExplanation?: string;
  
  // New Required Fields for Deterministic Risk Engine
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  affectedFiles: number;
  affectedComponents: number;
  reason: string;
  autoFixEligible: boolean;
  requiresDeveloperApproval: boolean;
  
  // Legacy or auxiliary fields
  changeLocation?: ChangeLocation;
  validationPlan?: string[];
  rollbackPlan?: string[];
  possibleSolutions?: SolutionOption[];
  recommendedApproach?: string;
  approvalRequired?: boolean;
  autoDebugEligible?: boolean;
  evidenceQuality?: EvidenceQuality;
  safetyOverrides?: SafetyOverride[];
  riskFactors?: RiskFactor[];
  structuredRootCause?: any;
}

export type EvidenceQuality = 'STRONG' | 'MEDIUM' | 'WEAK' | 'INSUFFICIENT';

export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
  evidence: string;
  evidenceSource?: string;
  confidence: number;
}

export interface SafetyOverride {
  reason: string;
  ruleMatched: string;
  elevatedRiskTo: 'HIGH';
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  affectedFiles: number;
  affectedComponents: number;
  reason: string;
  autoFixEligible: boolean;
  requiresDeveloperApproval: boolean;
  
  // Auxiliary debug data
  factors?: RiskFactor[];
  overrides?: SafetyOverride[];
  evidenceQuality?: EvidenceQuality;
}

export type RegressionTestStatus = 'GENERATED' | 'NOT_EXECUTED' | 'EXECUTED' | 'PASSED' | 'FAILED';

export interface RegressionTest {
  framework: 'Espresso' | 'Compose UI';
  language: 'kotlin';
  testName: string;
  code: string;
  status: RegressionTestStatus;
}

export interface AIProvider {
  name: string;
  description: string;
  isLocal: boolean;
  analyzeCrash: (report: CrashReport) => Promise<AnalysisResult>;
  generateReproductionSteps?: (report: CrashReport) => Promise<ReproductionStep[]>;
  generateRegressionTest?: (report: CrashReport, steps: ReproductionStep[]) => Promise<RegressionTest>;
  suggestFix?: (report: CrashReport) => Promise<SuggestedFix>;
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

