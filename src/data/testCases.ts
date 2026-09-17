export interface TestCase {
  id: string;
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'CRASHED' | 'AUTO_FIXED';
  scenario: string; // The crash scenario key from crashSimulator, or 'HAPPY_PATH'
}

export const TEST_CASES: TestCase[] = [
  {
    id: 'TC-001',
    name: 'Order Coffee Successfully',
    description: 'Happy path: User adds items to cart, selects payment, and completes checkout.',
    riskLevel: 'LOW',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-002',
    name: 'Add Duplicate Items to Cart',
    description: 'Ensure quantity increases instead of creating duplicate cart entries.',
    riskLevel: 'LOW',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-003',
    name: 'Remove All Items from Cart',
    description: 'Ensure checkout button disables when cart is empty.',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-004',
    name: 'Cart Index Out of Bounds',
    description: 'Simulates rapid add/remove causing an index error in the cart adapter.',
    riskLevel: 'HIGH',
    status: 'PENDING',
    scenario: 'INDEX_OUT_OF_BOUNDS_CART',
  },
  {
    id: 'TC-005',
    name: 'Pay Without Payment Method',
    description: 'User attempts to checkout without selecting a payment method. Expected to crash if not validated.',
    riskLevel: 'CRITICAL',
    status: 'PENDING',
    scenario: 'NULL_POINTER_CHECKOUT',
  },
  {
    id: 'TC-006',
    name: 'Network Timeout on Payment',
    description: 'Simulates a dropped connection during the payment API call.',
    riskLevel: 'HIGH',
    status: 'PENDING',
    scenario: 'NETWORK_TIMEOUT_API',
  },
  {
    id: 'TC-007',
    name: 'Apply Invalid Promo Code',
    description: 'Ensure system rejects invalid codes gracefully.',
    riskLevel: 'LOW',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-008',
    name: 'Concurrent Add to Cart',
    description: 'Rapidly tap "Add" on multiple items to test state race conditions.',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-009',
    name: 'Location Services Denied',
    description: 'Simulates the user denying location permissions when finding a nearby store.',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-010',
    name: 'Order Large Quantity',
    description: 'Attempt to order 999 coffees to test maximum limits.',
    riskLevel: 'LOW',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-011',
    name: 'Payment Gateway Error 502',
    description: 'Simulates the payment provider returning a Bad Gateway error.',
    riskLevel: 'HIGH',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-012',
    name: 'Switch Payment Methods Rapidly',
    description: 'Rapidly switch between UPI, Card, and Cash to test UI state synchronization.',
    riskLevel: 'LOW',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-013',
    name: 'Background App During Payment',
    description: 'Send app to background while payment is processing.',
    riskLevel: 'HIGH',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-014',
    name: 'Memory Leak Check (Heavy Image Load)',
    description: 'Scroll through a list of 10,000 product images to check GC behavior.',
    riskLevel: 'CRITICAL',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
  {
    id: 'TC-015',
    name: 'Expired JWT Token',
    description: 'Simulates making an API request with an expired auth token.',
    riskLevel: 'HIGH',
    status: 'PENDING',
    scenario: 'HAPPY_PATH',
  },
];
