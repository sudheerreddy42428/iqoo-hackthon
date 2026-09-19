import React, { useState, useEffect } from 'react';
import { TEST_CASES } from '../data/testCases';
import { SimulatedApp } from '../components/SimulatedApp';
import { crashSimulator } from '../services/crashSimulator';
import { actionTracker } from '../services/actionTracker';
import { SimulatedAppErrorBoundary } from '../components/SimulatedAppErrorBoundary';
import { ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { localAIAnalyzer } from '../services/analyzer';

interface TestRunnerProps {
  testId: string;
  onExit: () => void;
  onNavigate: (tab: string, crashId?: string) => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ testId, onExit, onNavigate }) => {
  const testCase = TEST_CASES.find(t => t.id === testId);
  const { startInvestigation, setAnalysisResult } = useInvestigation();
  const [logs, setLogs] = useState<string[]>(['Initializing Test Environment...']);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    // Clear buffer at start of test
    actionTracker.clearBuffer();
    
    // Add some realistic startup logs
    setTimeout(() => addLog('Starting test container: Android 14 API 34'), 500);
    setTimeout(() => addLog('Loading ReproX Coffee Roasters APK...'), 1000);
    setTimeout(() => addLog(`Beginning automated sequence for ${testId}`), 1500);
  }, [testId]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${log}`]);
  };

  const handleCrash = (scenarioKey?: string, screen?: string, errorObj?: Error) => {
    setIsRunning(false);
    
    // Determine which crash scenario to use based on the test case
    let actualTemplate = testCase?.scenario || 'APP_FREEZE';
    
    // If the component passed a specific scenario, use that instead
    if (scenarioKey) {
      actualTemplate = scenarioKey;
    }
    
    if (actualTemplate === 'HAPPY_PATH') {
      addLog('Test Completed Successfully. No crash detected.');
      setTimeout(() => {
        onNavigate('test-report');
      }, 2000);
    } else {
      addLog(`💥 Application Crashed at ${screen || 'Unknown Screen'}`);
      addLog('Capturing telemetry, state, and screenshot...');
      
      setTimeout(() => {
        let report;
        if (errorObj) {
            // Generate report from real error
            report = crashSimulator.simulateCrash('APP_FREEZE', screen);
            report.errorType = errorObj.name;
            report.message = errorObj.message;
            report.stackTrace = errorObj.stack || 'No stack trace available';
        } else {
            // We know crashSimulator.simulateCrash returns a report and logs it
            report = crashSimulator.simulateCrash(actualTemplate as any, screen);
        }
        // Start investigation context
        startInvestigation(report, actionTracker.getRecentActions());
        addLog('Crash Report Generated. Navigating to analysis...');
        
        // Generate AI Analysis in the background so it's ready for CodeAccessView
        localAIAnalyzer.analyze(report).then(result => setAnalysisResult(result));
        
        setTimeout(() => {
          onNavigate('crash-summary', report.id);
        }, 1500);
      }, 1000);
    }
  };

  if (!testCase) {
    return <div className="p-8 text-white">Test Case not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Left side - App simulation */}
      <div className="w-full lg:w-[400px] flex flex-col">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Test Center
        </button>
        
        <div className="flex-1 relative">
          <SimulatedAppErrorBoundary onCrash={(e) => handleCrash(testCase.scenario, 'Unknown', e)}>
            <SimulatedApp 
              autoPlay={true}
              selectedScenario={testCase.scenario}
              onTriggerCrash={handleCrash}
              onScreenChange={(screen) => addLog(`Navigated to ${screen}`)}
            />
          </SimulatedAppErrorBoundary>
          {/* Overlay to prevent manual clicking during auto test */}
          {isRunning && <div className="absolute inset-0 z-10 cursor-not-allowed bg-transparent" />}
        </div>
      </div>

      {/* Right side - Test Details & Logs */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="p-5 rounded-xl bg-dark-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-cyan-400">{testCase.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  testCase.riskLevel === 'CRITICAL' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' :
                  testCase.riskLevel === 'HIGH' ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' :
                  'text-amber-400 border-amber-400/20 bg-amber-400/10'
                }`}>
                  {testCase.riskLevel} RISK
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{testCase.name}</h2>
            </div>
            {isRunning ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing
              </div>
            ) : testCase.scenario === 'HAPPY_PATH' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Passed
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
                <ShieldAlert className="w-4 h-4" />
                Crashed
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm">{testCase.description}</p>
        </div>

        {/* Console / Log Viewer */}
        <div className="flex-1 p-4 rounded-xl bg-[#0a0a0c] border border-slate-800 font-mono text-xs overflow-y-auto flex flex-col">
          <div className="text-slate-500 mb-4 pb-2 border-b border-slate-800/50 flex justify-between">
            <span>Live Execution Logs</span>
            <span>ReproX Automation Engine</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {logs.map((log, i) => (
              <div key={i} className={`
                ${log.includes('💥') ? 'text-rose-400 font-bold' : ''}
                ${log.includes('Successfully') ? 'text-emerald-400' : ''}
                ${!log.includes('💥') && !log.includes('Successfully') ? 'text-slate-300' : ''}
              `}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
