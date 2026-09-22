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
    pattern: /(pay|billing|checkout|creditcard|stripe|financial|transaction|505|5xx|gateway)/i,
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
  {
    pattern: /(location|gps|coordinates|geofence)/i,
    reason: "Modifies location or tracking services (Privacy/Security Risk).",
  },
  {
    pattern: /(memory|oom|allocation|leak|bitmap)/i,
    reason: "Modifies memory allocation or fixes OOM which requires manual verification.",
  },
  {
    pattern: /(concurrent|race.*condition|multithread|synchronized)/i,
    reason: "Concurrency bugs require manual review to ensure thread safety.",
  },
  {
    pattern: /(background|lifecycle|onpause|onresume)/i,
    reason: "App lifecycle changes can cause severe UX and background execution issues.",
  }
];
