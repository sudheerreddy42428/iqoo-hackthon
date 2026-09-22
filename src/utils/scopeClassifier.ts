export type ScopeClassification = 'CRASH_RELATED' | 'DEVELOPER_TOOL_RELATED' | 'OUT_OF_SCOPE' | 'AMBIGUOUS';

export const OUT_OF_SCOPE_MESSAGE = "I can only help with crash incidents, crash analysis, regression-test failures, debugging, and the developer tools related to investigating or fixing them. Please provide the crash, error, stack trace, regression failure, or relevant developer-tool issue.";
export const AMBIGUOUS_MESSAGE = "Please provide the crash incident, error message, stack trace, regression-test failure, or developer-tool problem you want me to investigate.";

export function classifyScope(message: string, hasActiveCrash: boolean): ScopeClassification {
  const lowerMsg = message.toLowerCase();

  const crashKeywords = [
    'crash', 'error', 'exception', 'stack trace', 'bug', 'fail', 'failing', 
    'regression', 'reproduce', 'null pointer', 'index out of bounds', 
    'root cause', 'patch', 'resolve', 'line', 'code', 
    'function', 'method', 'variable', 'throw', 'catch', 'unhandled'
  ];

  const devToolKeywords = [
    'analyzer', 'confidence', 'risk', 'approval', 'logs', 'history',
    'validation', 'test runner', 'auto-fix', 'telemetry', 'report'
  ];

  const outOfScopeKeywords = [
    'weather', 'poem', 'joke', 'president', 'movie', 'news', 'recipe',
    'eat', 'vacation', 'travel', 'sports', 'game', 'play', 'song', 'music',
    'teach me javascript', 'teach me react', 'teach me python',
    'build a website', 'write an email', 'write an essay', 'tell me a story',
    'explain object-oriented programming'
  ];

  // 1. Check for explicit out-of-scope phrases
  for (const keyword of outOfScopeKeywords) {
    if (lowerMsg.includes(keyword)) {
      return 'OUT_OF_SCOPE';
    }
  }

  // 2. Check for dev tool related
  let isDevToolRelated = false;
  for (const keyword of devToolKeywords) {
    if (lowerMsg.includes(keyword)) {
      isDevToolRelated = true;
      break;
    }
  }

  if (isDevToolRelated) {
    return 'DEVELOPER_TOOL_RELATED';
  }

  // 3. Check for crash related
  let isCrashRelated = false;
  for (const keyword of crashKeywords) {
    if (lowerMsg.includes(keyword)) {
      isCrashRelated = true;
      break;
    }
  }

  if (isCrashRelated) {
    return 'CRASH_RELATED';
  }

  // 4. Ambiguous (e.g. "How do I fix this?", "Why is this happening?")
  // If we have an active crash, we treat ambiguous as crash-related.
  // Otherwise, we flag it as ambiguous.
  if (hasActiveCrash) {
    return 'CRASH_RELATED';
  }

  return 'AMBIGUOUS';
}
