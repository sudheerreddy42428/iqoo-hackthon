import { 
  CrashReport, 
  AnalysisResult, 
  AIAnalyzer, 
  ReproductionStep,
  SuggestedFix
} from '../types/reprox';

/**
 * Rule-Based Crash Analyzer
 * 
 * Inspects:
 * - Error Type & Message
 * - Stack Trace top frames
 * - Chronological sequence of user actions in the rolling buffer
 * - Final screen and action metadata
 */
export class LocalAIAnalyzer implements AIAnalyzer {
  public name = 'Local AI Analyzer';
  public description = 'Deterministic heuristic engine mapping action sequences and stack frames to root causes';

  public async analyze(report: CrashReport): Promise<AnalysisResult> {
    // Simulate brief processing delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Extract reproduction steps from recent actions (filter out the crash event itself)
    const filteredActions = report.recentActions.filter(a => a.type !== 'CRASH_TRIGGER');
    const reproductionSteps: ReproductionStep[] = filteredActions.map((act, index) => {
      let cleanDesc = act.description;
      if (cleanDesc.startsWith('Navigated to ')) {
        cleanDesc = `Open ${cleanDesc.replace('Navigated to ', '')}`;
      }
      return {
        stepNumber: index + 1,
        action: cleanDesc,
        screen: act.screen,
        details: act.metadata ? JSON.stringify(act.metadata) : undefined,
      };
    });

    // If actions are sparse, provide a baseline reproduction step
    if (reproductionSteps.length === 0) {
      reproductionSteps.push({
        stepNumber: 1,
        action: `Open ${report.screen} screen and perform the trigger action`,
        screen: report.screen,
      });
    }

    // Heuristics based on error type & message
    let likelyRootCause = '';
    let suggestedFix: SuggestedFix = {
      title: 'Defensive Null Check & State Guard',
      explanation: 'Add null-safety verification before dereferencing the target object.',
      filePath: 'CheckoutScreen.kt',
      language: 'kotlin',
      codeSnippet: `// Suggested Fix: Validate state before processing
if (paymentMethod == null) {
    showError("Please select a payment method")
    return
}
processPayment(paymentMethod)`,
    };
    let confidenceScore = 88;
    let affectedComponent = 'CheckoutScreen / PaymentController';
    let severity: AnalysisResult['severity'] = 'CRITICAL';

    if (report.errorType.includes('NullPointer')) {
      const hasPaymentAction = filteredActions.some(a => 
        a.description.toLowerCase().includes('upi') || 
        a.description.toLowerCase().includes('payment') ||
        a.description.toLowerCase().includes('card')
      );

      if (report.screen === 'Checkout' || report.message.includes('paymentMethod')) {
        likelyRootCause = hasPaymentAction
          ? 'The payment method selection state was reset or de-referenced prematurely before the Pay action dispatched.'
          : 'The user triggered the Pay action before selecting a payment method. The checkout controller assumed a non-null paymentMethod and crashed with NullPointerException.';
        
        confidenceScore = hasPaymentAction ? 84 : 94;
        affectedComponent = 'com.reprox.coffee.ui.CheckoutScreen.kt:142';
        suggestedFix = {
          title: 'Enforce Non-Null Payment Selection in UI & Controller',
          explanation: 'Disable the Pay button until a valid payment method is selected, and add a guard assertion in onPayClicked().',
          filePath: 'CheckoutScreen.kt',
          language: 'diff',
          codeSnippet: `// 1. Disable Pay CTA when state is empty:
 Button(
     onClick = { viewModel.onPayClicked() },
-    enabled = true
+    enabled = uiState.selectedPaymentMethod != null // Prevents invalid click
 ) {
     Text("Pay Now")
 }
 
 // 2. Controller guard in CheckoutScreen.kt:142:
 fun onPayClicked() {
-    val method = currentPaymentMethod
+    val method = currentPaymentMethod 
+        ?: throw IllegalStateException("Cannot trigger payment without selecting paymentMethod")
     paymentController.processPayment(method)
 }`,
        };
      } else {
        likelyRootCause = `An unexpected null reference occurred on ${report.screen} screen while executing an action.`;
        confidenceScore = 78;
        affectedComponent = `${report.screen}Screen.kt`;
      }
    } else if (report.errorType.includes('IndexOutOfBounds')) {
      likelyRootCause = 'A rapid asynchronous item removal triggered a race condition between the adapter dataset and the UI RecyclerView layout manager.';
      confidenceScore = 91;
      affectedComponent = 'com.reprox.coffee.ui.CartAdapter.kt:64';
      severity = 'HIGH';
      suggestedFix = {
        title: 'Use DiffUtil & Mutex Protected Item Deletion',
        explanation: 'Replace direct ArrayList index lookups with DiffUtil or ListAdapter to prevent index synchronization drift.',
        filePath: 'CartAdapter.kt',
        language: 'diff',
        codeSnippet: ` // Replace manual index position query with ListAdapter submitList:
-class CartAdapter : RecyclerView.Adapter<CartViewHolder>() {
+class CartAdapter : ListAdapter<CartItem, CartViewHolder>(CartDiffCallback) {
     override fun onBindViewHolder(holder: CartViewHolder, position: Int) {
-        val item = items[position]
+        getItemOrNull(position)?.let { item ->
             holder.bind(item)
+        }
     }
 }`,
      };
    } else if (report.errorType.includes('Timeout') || report.errorType.includes('Socket')) {
      likelyRootCause = 'Network timeout occurred while contacting the internal order API during payment authorization without fallback handling.';
      confidenceScore = 86;
      affectedComponent = 'com.reprox.coffee.network.PaymentClient.kt:89';
      severity = 'HIGH';
      suggestedFix = {
        title: 'Implement Exponential Backoff Retry & Offline Circuit Breaker',
        explanation: 'Wrap the remote call in a timeout handler and notify the user with a retry prompt instead of crashing.',
        filePath: 'PaymentClient.kt',
        language: 'diff',
        codeSnippet: ` // Wrap API request in runCatching with retry
 suspend fun submitOrderWithRetry(order: Order): Result<PaymentResponse> {
-    return orderApi.submit(order)
+    return runCatching {
+        withTimeout(8000L) {
+            orderApi.submit(order)
+        }
+    }.onFailure { ex ->
+        Log.e("PaymentClient", "Order submission failed", ex)
+        emitUiState(PaymentUiState.NetworkRetryRequired)
+    }
 }`,
      };
    } else {
      likelyRootCause = `Crash occurred during interaction with ${report.screen} due to unhandled ${report.errorType}: ${report.message}`;
      confidenceScore = 75;
      affectedComponent = report.screen;
    }

    return {
      reportId: report.id,
      analyzerName: this.name,
      likelyRootCause,
      reproductionSteps,
      suggestedFix,
      confidenceScore,
      affectedComponent,
      severity,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}

/**
 * Mock LLM Analyzer (Demonstrating extensible architecture)
 * 
 * In a production setup, this would query OpenAI, Gemini, or Claude
 * passing the structured crash report, breadcrumb stream, and AST code.
 */
export class CloudAIAnalyzer implements AIAnalyzer {
  public name = 'Cloud AI Deep Analyzer (Gemini / Claude)';
  public description = 'Zero-shot contextual reasoning using multimodal crash context and action buffer';

  public async analyze(report: CrashReport): Promise<AnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Leverage rule-based base then enrich with AI reasoning narrative
    const localAI = new LocalAIAnalyzer();
    const base = await localAI.analyze(report);

    return {
      ...base,
      analyzerName: this.name,
      confidenceScore: Math.min(97, base.confidenceScore + 6),
      likelyRootCause: `[AI Synthesized Analysis] Based on the ${report.recentActions.length}-step action trace, the user entered ${report.screen} and triggered an event that violated state invariants. The stack trace points to null dereference in ${base.affectedComponent}. The breadcrumb sequence demonstrates that the state machine was not populated before event dispatch.`,
      suggestedFix: {
        ...base.suggestedFix,
        title: `[AI Recommended] ${base.suggestedFix.title}`,
        explanation: `${base.suggestedFix.explanation} (Synthesized by LLM contextual analyzer with Kotlin best practices).`,
      }
    };
  }
}

export const localAIAnalyzer = new LocalAIAnalyzer();
export const cloudAIAnalyzer = new CloudAIAnalyzer();
