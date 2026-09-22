import { describe, it, expect } from 'vitest';
import { classifyScope } from './scopeClassifier';

describe('Scope Classifier', () => {
  it('should return OUT_OF_SCOPE for general questions', () => {
    expect(classifyScope('What is the weather?', false)).toBe('OUT_OF_SCOPE');
    expect(classifyScope('Tell me a poem about code', false)).toBe('OUT_OF_SCOPE');
    expect(classifyScope('Can you teach me React?', true)).toBe('OUT_OF_SCOPE');
    expect(classifyScope('Who is the president?', false)).toBe('OUT_OF_SCOPE');
  });

  it('should return CRASH_RELATED for crash terms', () => {
    expect(classifyScope('Why did this crash?', false)).toBe('CRASH_RELATED');
    expect(classifyScope('Explain this stack trace', false)).toBe('CRASH_RELATED');
    expect(classifyScope('I have a null pointer exception', false)).toBe('CRASH_RELATED');
    expect(classifyScope('What line caused the error?', false)).toBe('CRASH_RELATED');
    expect(classifyScope('Generate a patch for this bug', false)).toBe('CRASH_RELATED');
  });

  it('should return DEVELOPER_TOOL_RELATED for tool terms', () => {
    expect(classifyScope('Why is the confidence score so low?', false)).toBe('DEVELOPER_TOOL_RELATED');
    expect(classifyScope('What is the risk of this fix?', false)).toBe('DEVELOPER_TOOL_RELATED');
    expect(classifyScope('Approve the auto-fix', false)).toBe('DEVELOPER_TOOL_RELATED');
  });

  it('should return AMBIGUOUS for vague questions without active crash', () => {
    expect(classifyScope('How do I fix this?', false)).toBe('AMBIGUOUS');
    expect(classifyScope('Why is this happening?', false)).toBe('AMBIGUOUS');
  });

  it('should return CRASH_RELATED for vague questions WITH active crash', () => {
    expect(classifyScope('How do I fix this?', true)).toBe('CRASH_RELATED');
    expect(classifyScope('Why is this happening?', true)).toBe('CRASH_RELATED');
  });
});
