# ReproX Playground

> **Understand, reproduce, and debug application crashes using user-action context.**

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An interactive prototype and educational developer documentation website demonstrating the **ReproX** concept:
`User Action → Event Tracking → Rolling Buffer → Crash Simulation → Context Collection → Crash Analysis → Root Cause → Suggested Fix → Regression Test`.

Inspired by the [ReproX Concept Repository](https://github.com/sudheerreddy42428/reprox).

---

## Table of Contents

1. [What is ReproX?](#what-is-reprox)
2. [Why Does It Exist? (The Problem)](#why-does-it-exist)
3. [Architecture Overview](#architecture-overview)
4. [How the Prototype Works](#how-the-prototype-works)
5. [Quick Start & Local Execution](#quick-start--local-execution)
6. [Interactive Playground & Demo Instructions](#interactive-playground--demo-instructions)
7. [How Action Tracking Works](#how-action-tracking-works)
8. [How Crash Simulation Works](#how-crash-simulation-works)
9. [How Crash Analysis Works](#how-crash-analysis-works)
10. [Hypothetical Android SDK Integration](#hypothetical-android-sdk-integration)
11. [Educational Prototype Limitations](#educational-prototype-limitations)

---

## 1. What is ReproX?

**ReproX** is a crash reproduction and context capture engine. Unlike traditional crash reporters that only report the line of code that failed, ReproX captures the **sequence of user actions immediately preceding the crash**, analyzes the context, explains the likely root cause, and generates automated regression tests.

```text
User Actions ──▶ Context Buffer (15 slots) ──▶ Crash ──▶ Context Freeze ──▶ Root Cause Analysis ──▶ Suggested Fix ──▶ Regression Test
```

---

## 2. Why Does It Exist?

### The Traditional Problem
Normally, an on-call engineer receives an unhelpful stack trace:
```text
NullPointerException
CheckoutActivity.kt:142
at com.app.CheckoutScreen.onPayClicked(CheckoutScreen.kt:142)
```

The engineer does not know:
- What did the user do before the crash?
- What screen were they on when the bug manifested?
- What sequence of taps reproduces the crash?
- Can we write an automated test so this never regresses?

### Traditional Debugging Workflow
```text
Crash ──▶ Guess what happened ──▶ Try to reproduce ──▶ Speculative Debug ──▶ Hopeful Fix
```

### ReproX Approach
```text
User Actions ──▶ In-Memory Buffer ──▶ Crash ──▶ Freeze Snapshot ──▶ Analyzer ──▶ Root Cause ──▶ Fix Diff ──▶ Executable Espresso Test
```

---

## 3. Architecture Overview

```text
┌──────────────────────────────────────────────────────────┐
│                   Client: Android App                    │
│  • ReproX SDK Interceptor (Taps, Navigation, Inputs)     │
│  • 15-Action Rolling Circular FIFO Buffer                │
│  • UncaughtExceptionHandler Hook                         │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ Crash Report (JSON Snapshot)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     ReproX Backend                       │
│  • Telemetry Ingestion API & Storage                     │
│  • Pluggable CrashAnalyzer (Rule-Based & LLM)            │
│  • Automated Test Synthesizer (Espresso / Compose UI)    │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ Diagnostic Payload
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   Developer Dashboard                    │
│  • Chronological Action Breadcrumb Timeline              │
│  • Root Cause Diagnosis & Confidence Meter               │
│  • Suggested Kotlin Code Fix                             │
│  • 1-Click Copy Automated Regression Test                │
└──────────────────────────────────────────────────────────┘
```

---

## 4. How the Prototype Works

The ReproX Playground is built entirely as a responsive single-page web app running in the browser:

1. **Simulated Coffee Ordering Application**:
   - 4 screens: **Home**, **Products Menu**, **Cart**, and **Checkout**.
   - Real interactive state (add items, change quantities, select payment method).
2. **Real-time 15-Action Buffer**:
   - Every tap or navigation event is pushed into an in-memory rolling buffer.
   - When the 16th action occurs, the oldest drops off, demonstrating memory efficiency.
3. **Crash Simulation Engine**:
   - Deliberately triggers exceptions such as `NullPointerException` (when Pay is pressed without selecting a payment method), `IndexOutOfBoundsException`, or `SocketTimeoutException`.
   - Freezes the 15-action buffer into a structured crash report with simulated Android 15 / Pixel 8 hardware specs.
4. **Diagnostic Analyzer**:
   - Inspects error types and action traces to explain root causes and calculate confidence scores.
   - Provides an extensible interface demonstrating how AI / LLM analyzers can be plugged in.
5. **Regression Test Generator**:
   - Synthesizes copy-pasteable Kotlin Espresso or Jetpack Compose UI tests that reproduce the crash sequence.

---

## 5. Quick Start & Local Execution

Prerequisites: Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

The application will be available at:
`http://localhost:5173`

To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## 6. Interactive Playground & Demo Instructions

### Manual Testing
1. Navigate to the **Playground** tab.
2. In the simulated Coffee App:
   - Click **Browse Menu** or **Products**.
   - Click **Add to Cart** on "Cold Coffee Classic".
   - Click **Cart** and review the subtotal.
   - Click **Proceed to Checkout**.
   - Observe the **Event Timeline** on the right filling up with actions.
3. **Trigger the Crash**:
   - In Checkout, leave the payment method unselected and click **Pay Now** (or click the **💥 Simulate Crash** button).
4. **Inspect the Diagnosis**:
   - View the red **Crash Detected** report.
   - Read the **Likely Root Cause** and **Reproduction Steps**.
   - Check the **Suggested Code Fix**.
   - Click **Copy Test** to copy the generated Kotlin Espresso regression test!

### 30-Second Full Demo Mode
Click the **"Run Full Demo"** button in the top navigation bar. ReproX will automatically:
1. Initialize the app and clear the buffer.
2. Navigate to Products and add items to cart.
3. Open Cart and Proceed to Checkout.
4. Click Pay with unselected paymentMethod.
5. Trigger the crash, freeze context, run the diagnostic engine, and present the generated test.

---

## 7. How Action Tracking Works

ReproX maintains an in-memory rolling FIFO buffer:

```typescript
type UserAction = {
  id: string;
  timestamp: string; // HH:mm:ss.SSS
  type: 'NAVIGATION' | 'CLICK' | 'INPUT' | 'STATE_CHANGE' | 'CRASH_TRIGGER';
  screen: string;
  description: string;
  metadata?: Record<string, any>;
};
```

When actions exceed 15 items:
```typescript
if (this.buffer.length >= 15) {
  this.buffer.shift(); // Oldest dropped
}
this.buffer.push(newAction);
```

---

## 8. How Crash Simulation Works

At crash time, ReproX intercepts the uncaught exception, freezes a snapshot of the current rolling buffer, and attaches device metadata:

```typescript
const crashReport: CrashReport = {
  id: "crash_1741849200",
  timestamp: "10:42:55.102",
  errorType: "NullPointerException",
  message: "Attempted to access paymentMethod but paymentMethod was null.",
  screen: "Checkout",
  recentActions: actionTracker.getRecentActions(), // Frozen 15-action snapshot
  deviceContext: {
    os: "Android",
    osVersion: "Android 15 (API Level 35)",
    deviceModel: "Google Pixel 8 Pro",
    appVersion: "1.4.2"
  }
};
```

---

## 9. How Crash Analysis Works

The analysis pipeline uses an extensible interface:

```typescript
interface CrashAnalyzer {
  name: string;
  description: string;
  analyze(report: CrashReport): Promise<AnalysisResult>;
}
```

- **`RuleBasedAnalyzer`**: Evaluates top stack frames and searches reverse breadcrumbs to detect missing prerequisites (such as paying before selecting a payment method).
- **`LLMAnalyzer`**: Showcases how a multimodal LLM (Gemini / Claude) can ingest the breadcrumb history and source code AST to reason about edge cases.

---

## 10. Hypothetical Android SDK Integration

To integrate ReproX into an Android application:

```kotlin
// 1. Application initialization
class CoffeeApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ReproX.initialize(
            context = this,
            bufferSize = 15
        )
    }
}

// 2. Track custom events
ReproX.track("Opened Checkout")

// 3. Automated crash interception occurs in Thread.setDefaultUncaughtExceptionHandler
```

---

## 11. Educational Prototype Limitations

> [!IMPORTANT]
> - **Educational Prototype**: This project is built as an interactive concept demonstration inspired by ReproX.
> - **Browser-Only Execution**: The crash is simulated inside React; no actual native Android process is terminated.
> - **Rule-Based Engine**: The diagnostic analysis uses heuristic pattern matching rather than live production cloud telemetry.
> - **No Remote Telemetry**: All data is stored locally in `localStorage` in your browser. No personal data or credentials leave your machine.

---

## 12. Super AI Chatbot Modes

ReproX includes an AI Assistant that operates in two distinct modes:

1. **General AI Mode**: A general-purpose assistant that helps with programming, mathematics, technical concepts, and everyday questions. It behaves as a standard AI chatbot.
2. **ReproX Diagnostic Mode**: Activated when viewing a crash report. In this mode, the AI strictly focuses on analyzing the application crash, reviewing the telemetry, identifying root causes, and proposing fixes.

### Security and Fix Workflow
- **CORS Protection**: The AI API endpoint (`/api/chat`) enforces strict CORS policies. Use the `ALLOWED_ORIGINS` environment variable to configure trusted domains.
- **Authorized Fixes Only**: The AI will *never* claim to have automatically deployed or verified a code fix unless explicitly authorized through the developer dashboard workflow. Fake "Auto-Fix Deployed" messages have been strictly prohibited to prevent misleading assumptions.
