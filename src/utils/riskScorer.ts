import { RISK_THRESHOLDS, CONFIDENCE_THRESHOLD_AUTO_FIX, SAFETY_OVERRIDE_RULES } from '../config/riskConfig';
import { RiskAssessment, RiskFactor, SafetyOverride, EvidenceQuality, CrashReport, SuggestedFix } from '../types/reprox';

export interface StructuredAIEvidence {
  impactSeverityScore: number;
  impactSeverityReason: string;
  impactSeverityEvidence: string;
  
  criticalityScore: number;
  criticalityReason: string;
  criticalityEvidence: string;
  
  rootCauseStrengthScore: number;
  rootCauseStrengthReason: string;
  rootCauseStrengthEvidence: string;
  
  regressionImpactScore: number;
  regressionImpactReason: string;
  regressionImpactEvidence: string;
  
  changeScopeScore: number;
  changeScopeReason: string;
  changeScopeEvidence: string;
  
  reversibilityScore: number;
  reversibilityReason: string;
  reversibilityEvidence: string;
  
  aiConfidence: number; // 0-100
}

export function calculateDeterministicRisk(
  structuredEvidence: StructuredAIEvidence,
  report: CrashReport,
  suggestedFix?: SuggestedFix
): RiskAssessment {
  
  // 1. Calculate Factors (cap at max values)
  const factors: RiskFactor[] = [
    {
      name: 'Crash Impact Severity',
      score: Math.min(25, Math.max(0, structuredEvidence.impactSeverityScore)),
      maxScore: 25,
      reason: structuredEvidence.impactSeverityReason,
      evidence: structuredEvidence.impactSeverityEvidence,
      confidence: structuredEvidence.aiConfidence
    },
    {
      name: 'Affected Application Area / Criticality',
      score: Math.min(20, Math.max(0, structuredEvidence.criticalityScore)),
      maxScore: 20,
      reason: structuredEvidence.criticalityReason,
      evidence: structuredEvidence.criticalityEvidence,
      confidence: structuredEvidence.aiConfidence
    },
    {
      name: 'Root Cause Evidence Strength',
      score: Math.min(20, Math.max(0, structuredEvidence.rootCauseStrengthScore)),
      maxScore: 20,
      reason: structuredEvidence.rootCauseStrengthReason,
      evidence: structuredEvidence.rootCauseStrengthEvidence,
      confidence: structuredEvidence.aiConfidence
    },
    {
      name: 'Regression / Change Impact',
      score: Math.min(15, Math.max(0, structuredEvidence.regressionImpactScore)),
      maxScore: 15,
      reason: structuredEvidence.regressionImpactReason,
      evidence: structuredEvidence.regressionImpactEvidence,
      confidence: structuredEvidence.aiConfidence
    },
    {
      name: 'Change Scope / Number of Files Affected',
      score: Math.min(10, Math.max(0, structuredEvidence.changeScopeScore)),
      maxScore: 10,
      reason: structuredEvidence.changeScopeReason,
      evidence: structuredEvidence.changeScopeEvidence,
      confidence: structuredEvidence.aiConfidence
    },
    {
      name: 'Reversibility / Safety of Proposed Change',
      score: Math.min(10, Math.max(0, structuredEvidence.reversibilityScore)),
      maxScore: 10,
      reason: structuredEvidence.reversibilityReason,
      evidence: structuredEvidence.reversibilityEvidence,
      confidence: structuredEvidence.aiConfidence
    }
  ];

  const finalScore = factors.reduce((sum, factor) => sum + factor.score, 0);

  // 2. Map Evidence Strength to Quality Label
  let evidenceQuality: EvidenceQuality = 'WEAK';
  const strengthFactor = factors.find(f => f.name === 'Root Cause Evidence Strength');
  if (strengthFactor) {
    if (strengthFactor.score >= 15) {
      evidenceQuality = 'STRONG';
    } else if (strengthFactor.score >= 8) {
      evidenceQuality = 'MEDIUM';
    }
  }

  // 3. Determine Base Risk Level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (finalScore >= RISK_THRESHOLDS.HIGH_MIN) {
    riskLevel = 'HIGH';
  } else if (finalScore > RISK_THRESHOLDS.LOW_MAX) {
    riskLevel = 'MEDIUM';
  }

  // 4. Apply Safety Overrides
  const overrides: SafetyOverride[] = [];
  
  const textToScan = [
    report.errorType,
    report.message,
    report.stackTrace,
    report.method,
    report.screen,
    structuredEvidence.impactSeverityReason,
    structuredEvidence.criticalityReason,
    suggestedFix?.codeSnippet || ''
  ].join(' ');

  for (const rule of SAFETY_OVERRIDE_RULES) {
    if (rule.pattern.test(textToScan)) {
      overrides.push({
        reason: rule.reason,
        ruleMatched: rule.pattern.source,
        elevatedRiskTo: 'HIGH'
      });
    }
  }
  
  // Rule: Insufficient root cause evidence triggers override
  if (evidenceQuality === 'WEAK') {
    overrides.push({
      reason: "Root cause evidence is too weak to safely auto-fix.",
      ruleMatched: "EVIDENCE_QUALITY_WEAK",
      elevatedRiskTo: 'HIGH'
    });
  }

  if (overrides.length > 0) {
    riskLevel = 'HIGH';
  }

  // 5. Determine Auto-Fix Eligibility
  const isAutoFixEligible = 
    riskLevel === 'LOW' &&
    structuredEvidence.aiConfidence >= CONFIDENCE_THRESHOLD_AUTO_FIX &&
    overrides.length === 0;

  return {
    finalScore,
    riskLevel,
    factors,
    overrides,
    evidenceQuality,
    isAutoFixEligible
  };
}
