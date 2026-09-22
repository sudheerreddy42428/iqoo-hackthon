import { AnalysisResult } from '../types/reprox';

export type TestCaseWorkflowState = 
  | 'IDLE'
  | 'TEST_RUNNING'
  | 'TEST_PASSED'
  | 'TEST_FAILED'
  | 'ANALYZING_RISK'
  | 'AUTO_FIX_ELIGIBLE'
  | 'APPROVAL_REQUIRED'
  | 'FIXING'
  | 'VERIFYING'
  | 'AUTO_FIXED_AND_VERIFIED'
  | 'REJECTED'
  | 'FIX_FAILED';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  scenario: string;
  
  // Dynamic state
  workflowState: TestCaseWorkflowState;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence?: number;
  analysis?: AnalysisResult;
  generatedRegressionTest?: string;
  baselineRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const BASELINE_TEST_CASES: TestCase[] = [
  {
    id: 'TC-001',
    name: 'Order Coffee Successfully',
    description: 'Happy path: User adds items to cart, selects payment, and completes checkout.',
    scenario: 'HAPPY_PATH',
    workflowState: 'IDLE',
    baselineRiskLevel: 'LOW'
  },
  {
    id: 'TC-002',
    name: 'Add Duplicate Items to Cart',
    description: 'Ensure quantity increases instead of creating duplicate cart entries.',
    scenario: 'HAPPY_PATH',
    workflowState: 'IDLE',
    baselineRiskLevel: 'LOW'
  },
  {
    id: 'TC-004',
    name: 'Cart Index Out of Bounds',
    description: 'Simulates rapid add/remove causing an index error in the cart adapter.',
    scenario: 'INDEX_OUT_OF_BOUNDS_CART',
    workflowState: 'IDLE',
    baselineRiskLevel: 'LOW'
  },
  {
    id: 'TC-005',
    name: 'Pay Without Payment Method',
    description: 'User attempts to checkout without selecting a payment method. Expected to crash if not validated.',
    scenario: 'NULL_POINTER_CHECKOUT',
    workflowState: 'IDLE',
    baselineRiskLevel: 'HIGH'
  },
  {
    id: 'TC-006',
    name: 'Network Timeout on Payment',
    description: 'Simulates a dropped connection during the payment API call.',
    scenario: 'NETWORK_TIMEOUT_API',
    workflowState: 'IDLE',
    baselineRiskLevel: 'HIGH'
  },
  {
    id: 'TC-007',
    name: 'Apply Invalid Promo Code',
    description: 'Ensure system rejects invalid codes gracefully.',
    scenario: 'HAPPY_PATH',
    workflowState: 'IDLE',
    baselineRiskLevel: 'LOW'
  },
  {
    id: 'TC-010',
    name: 'Order Large Quantity',
    description: 'Attempt to order 999 coffees to test maximum limits.',
    scenario: 'HAPPY_PATH',
    workflowState: 'IDLE',
    baselineRiskLevel: 'LOW'
  },
  {
    id: 'TC-011',
    name: 'Remote Payment Gateway Error 505',
    description: 'Simulates the remote payment provider returning an HTTP 505 Gateway error.',
    scenario: 'REMOTE_PAYMENT_GATEWAY_505',
    workflowState: 'IDLE',
    baselineRiskLevel: 'HIGH'
  }
];

// Legacy export for components that still rely on the static array
export const TEST_CASES = BASELINE_TEST_CASES.map(tc => ({
  ...tc,
  status: 'PENDING' as any, // satisfy older types if needed
  riskLevel: 'LOW' as any
}));

