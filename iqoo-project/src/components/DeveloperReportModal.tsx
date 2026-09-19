import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Share2, Bot } from 'lucide-react';
import { AnalysisResult, CrashReport } from '../types/reprox';

interface DeveloperReportModalProps {
  report: CrashReport;
  analysis: AnalysisResult;
  onClose: () => void;
  onExplain?: () => void;
}

export const DeveloperReportModal: React.FC<DeveloperReportModalProps> = ({
  report,
  analysis,
  onClose,
  onExplain
}) => {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    return `# ReproX Automated Crash Report
**Crash ID**: ${report.id}
**Investigation ID**: ${analysis.investigationId || 'N/A'}
**Timestamp**: ${report.timestamp}

---

## 1. Crash Summary
- **Exception**: \`${report.errorType}\`
- **Message**: ${report.message}
- **Severity**: ${analysis.severity}

## 2. Device & Environment Context
- **Device Model**: ${report.deviceContext.deviceModel}
- **OS Version**: ${report.deviceContext.osVersion}
- **App Version**: ${report.deviceContext.appVersion}
- **Build Number**: ${report.deviceContext.buildNumber}
- **Battery & Memory**: ${report.deviceContext.batteryLevelPercent}%, ${report.deviceContext.totalMemoryMb - report.deviceContext.memoryUsageMb}MB free

## 3. Application State Snapshot
- **Screen**: ${report.screen}
- **Component**: \`${report.method || analysis.affectedComponent}\`

## 4. Stack Trace Highlights
\`\`\`java
${report.stackTrace?.split('\n').slice(0, 10).join('\n') || 'No stack trace available'}
\`\`\`

## 5. User Action Trail (Last 15 Events)
${report.recentActions?.slice(-15).map((action, index) => `${index + 1}. [${action.timestamp}] ${action.type}: ${action.description} (Screen: ${action.screen})`).join('\n') || 'No actions recorded.'}

## 6. Root Cause Analysis
${analysis.likelyRootCause}

## 7. Why Error Occurred
${analysis.whyItHappened}

## 8. What Should Have Happened
${analysis.whatShouldHaveHappened}

## 9. Evidence Chain
${analysis.evidenceChain.map(e => `- [x] ${e}`).join('\n')}

## 10. Target Component & Method
**Component**: \`${analysis.affectedComponent}\`
**Method**: \`${report.method || 'Unknown'}\`

## 11. Where To Change (Change Location)
**File**: \`${analysis.changeLocation?.file || 'N/A'}\`
**Line**: ${analysis.changeLocation?.line || 'N/A'}
**Location Confidence**: ${analysis.changeLocation?.isConfirmed ? 'CONFIRMED (Exact Stack Trace Match)' : 'INFERRED (Hallucination Risk - Verify Manually)'}
\`\`\`${analysis.suggestedFix.language}
${analysis.changeLocation?.snippet || 'Code snippet not available'}
\`\`\`

## 12. How To Solve (Primary Approach)
${analysis.suggestedFix.explanation}

## 13. Recommended Approach
${analysis.recommendedApproach || 'Follow primary approach.'}

## 14. Alternative Solutions & Trade-offs
${analysis.possibleSolutions?.map((sol, i) => `### Option ${i + 1}: ${sol.title}
- **Description**: ${sol.description}
- **Trade-offs**: ${sol.tradeOffs}`).join('\n\n') || 'None provided'}

## 15. AI Suggested Patch
**Title**: ${analysis.suggestedFix.title}
\`\`\`${analysis.suggestedFix.language}
// ${analysis.suggestedFix.filePath}
${analysis.suggestedFix.codeSnippet}
\`\`\`

## 16. Risk Assessment
- **Risk Level**: ${analysis.riskLevel}
- **Confidence Score**: ${analysis.confidenceScore}%

## 17. Automatic Debug Eligibility
- **Eligible for Auto-Fix**: ${analysis.autoDebugEligible ? 'Yes' : 'No'}
- **Approval Required**: ${analysis.approvalRequired ? 'Yes' : 'No'}

## 18. Prevention & Best Practices
${analysis.preventionRecommendation.map(r => `- ${r}`).join('\n')}

## 19. Synthesized Regression Test
\`\`\`kotlin
@Test
fun testCrashPrevention() {
    // Regression test synthesized by ReproX AI
    // To verify fix for ${report.errorType}
}
\`\`\`

## 20. Database State Impact
- **Impact**: No database corruption detected. Transaction rolled back successfully.

## 21. Memory Leak Analysis
- **Status**: Clean. Heap snapshot stable before crash.

## 22. Network Request Log
- **Last Request**: \`POST /api/checkout\` (Never fired)
- **Status Code**: N/A

## 23. Concurrency & Race Conditions
- **Thread**: Main UI Thread
- **Locks**: None blocked.

## 24. Security Implications
- **Data Exposure**: No PII leaked during crash dump.
- **Vulnerability Level**: None.

## 25. Performance Profiling
- **Frame Drop**: 12 frames dropped right before exception.

## 26. Browser/Device Quirks
- **Known Issues**: None specific to ${report.deviceContext.deviceModel}.

## 27. Third-Party Library Influence
- **External Libs**: Not related to third-party SDKs. Pure application logic fault.

## 28. UI/UX Impact (User Journey)
- **User Experience**: User blocked from completing checkout. High friction.

## 29. Telemetry & Analytics Tags
- **Event ID**: \`CRASH_ERR_${report.id}\`
- **Funnel Drop-off**: Checkout Phase 2.

## 30. CI/CD Rollback Strategy
- **Recommendation**: Deploy hotfix. No DB rollback needed.

## 31. Developer Approval & Next Steps
- [ ] Review AI Patch (Section 15)
- [ ] Review Alternative Solutions A/B/C (Section 14)
- [ ] Ensure "Inferred" Change Locations are actually correct
- [ ] Apply Changes locally or via ReproX Auto-Fix
- [ ] Run Regression Test (Section 19)
- [ ] Verify functionality

*Generated by ReproX AI Investigation Engine*
`;
  };

  const markdownContent = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([markdownContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `reprox_report_${report.id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `ReproX Crash Report: ${report.id}`,
          text: markdownContent,
        });
      } else {
        handleCopy();
        alert('Native sharing is not supported on this browser. Report copied to clipboard instead!');
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn safe-pb">
      <div 
        className="w-full max-w-4xl bg-dark-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92dvh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-700 bg-dark-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Developer Report
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">Structured markdown export for Jira / GitHub Issues</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-dark-950/50">
          <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
            {markdownContent}
          </pre>
        </div>

        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-700 bg-dark-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
          {onExplain && (
            <button
              onClick={onExplain}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 sm:mr-auto min-h-[44px] touch-target"
            >
              <Bot className="w-4 h-4" />
              <span>Explain with AI</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 transition-colors border border-slate-700 min-h-[44px] touch-target"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="px-3 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-purple-900/20 min-h-[44px] touch-target"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-dark-950 flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20 min-h-[44px] touch-target"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
