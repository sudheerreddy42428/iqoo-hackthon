import { describe, it, expect } from 'vitest';
import { generateEspressoTest, generateComposeTest } from './testGenerator';
import { CrashReport, ReproductionStep } from '../types/reprox';

const mockReport: CrashReport = {
  id: 'test-123',
  timestamp: new Date().toISOString(),
  epochTime: Date.now(),
  errorType: 'NullPointerException',
  message: 'Attempt to invoke virtual method on a null object reference',
  stackTrace: 'java.lang.NullPointerException...',
  screen: 'Checkout',
  recentActions: [],
  deviceContext: {
    os: 'Android',
    osVersion: '14',
    deviceModel: 'Pixel 6',
    appVersion: '1.0',
    buildNumber: '1',
    memoryUsageMb: 100,
    totalMemoryMb: 4000,
    batteryLevelPercent: 100,
    networkStatus: 'WIFI',
    screenOrientation: 'PORTRAIT'
  }
};

const mockSteps: ReproductionStep[] = [
  { stepNumber: 1, action: 'Open Home', screen: 'Home' },
  { stepNumber: 2, action: 'Add to Cart', target: 'Cold Brew', screen: 'Home' },
  { stepNumber: 3, action: 'Trigger Pay button', screen: 'Cart' },
];

describe('testGenerator', () => {
  it('should generate valid Espresso test code', () => {
    const result = generateEspressoTest(mockReport, mockSteps);
    
    expect(result.framework).toBe('Espresso');
    expect(result.language).toBe('kotlin');
    expect(result.code).toContain('import androidx.test.espresso.Espresso.onView');
    expect(result.code).toContain('class NullPointerExceptionRegressionTest');
    expect(result.code).toContain('// Step 1: Navigate to Home');
    expect(result.code).toContain('onView(withText("Home")).perform(click())');
    expect(result.code).toContain('// Step 2: Add item to cart');
    expect(result.code).toContain('onView(withText("Add to Cart")).perform(click())');
    expect(result.code).toContain('// Step 3: Trigger payment button');
    expect(result.code).toContain('onView(withId(R.id.btn_pay)).perform(click())');
  });

  it('should generate valid Compose test code', () => {
    const result = generateComposeTest(mockReport, mockSteps);
    
    expect(result.framework).toBe('Compose UI');
    expect(result.language).toBe('kotlin');
    expect(result.code).toContain('import androidx.compose.ui.test.*');
    expect(result.code).toContain('class NullPointerExceptionComposeTest');
    expect(result.code).toContain('composeTestRule.onNodeWithText("Home").performClick()');
    expect(result.code).toContain('composeTestRule.onNodeWithText("Add to Cart").performClick()');
    expect(result.code).toContain('composeTestRule.onNodeWithTag("pay_button").performClick()');
  });
});
