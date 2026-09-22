export const RISK_THRESHOLDS = {
  LOW_MAX: 30,
  MEDIUM_MAX: 70,
  HIGH_MIN: 71,
};

export const CONFIDENCE_THRESHOLD_AUTO_FIX = 80;

export const SAFETY_OVERRIDE_RULES = [
  {
    pattern: /(auth|login|token|jwt|session|permission|role|security|password)/i,
    reason: "Modifies authentication, authorization, or security-sensitive code.",
  },
  {
    pattern: /(pay|billing|checkout|creditcard|stripe|financial|transaction)/i,
    reason: "Modifies payment or financial processing logic.",
  },
  {
    pattern: /(delete|drop|truncate|remove.*all|destroy|clear.*data)/i,
    reason: "Contains destructive operations or user data deletion.",
  },
  {
    pattern: /(migration|schema.*change|alter.*table)/i,
    reason: "Database migrations or schema changes are inherently risky.",
  },
  {
    pattern: /(secret|key|encryption|crypto|cipher|password)/i,
    reason: "Modifies encryption or secrets management.",
  },
];
