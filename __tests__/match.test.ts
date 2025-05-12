import { describe, expect, test } from '@jest/globals';
import { 
  calculateStringSimilarity, 
  compareClaims, 
  MatchType, 
  normalizeName,
  levenshtein,
  matchInsured
} from '@/lib/match';
import { ExtractedClaim } from '@/lib/parser';

describe('normalizeName', () => {
  test('removes LLC suffix', () => {
    const result = normalizeName('Riley HealthCare LLC');
    expect(result).toBe('riley healthcare');
  });
  
  test('removes punctuation', () => {
    const result = normalizeName('Acme, Inc.');
    expect(result).toBe('acme');
  });
  
  test('removes multiple corporate suffixes', () => {
    const result = normalizeName('Global Trading Co., Ltd.');
    expect(result).toBe('global trading');
  });
  
  test('handles empty strings', () => {
    const result = normalizeName('');
    expect(result).toBe('');
  });
  
  test('doesn\'t modify words that aren\'t suffixes', () => {
    const result = normalizeName('Group Therapy LLC');
    expect(result).toBe('group therapy');
  });
});

describe('levenshtein', () => {
  test('returns 0 for identical strings', () => {
    const distance = levenshtein('test', 'test');
    expect(distance).toBe(0);
  });
  
  test('returns length of string for completely different string', () => {
    const distance = levenshtein('abc', 'def');
    expect(distance).toBe(3);
  });
  
  test('computes edit distance for similar strings', () => {
    const distance = levenshtein('kitten', 'sitting');
    expect(distance).toBe(3); // k→s, e→i, add g
  });
  
  test('computes edit distance for strings with insertions', () => {
    const distance = levenshtein('abc', 'ab');
    expect(distance).toBe(1); // delete c
  });
});

describe('matchInsured', () => {
  test('matches Riley HealthCare LLC', () => {
    const result = matchInsured('Riley HealthCare LLC');
    expect(result.insuredName).toBe('Riley HealthCare LLC');
    expect(result.internalId).toBe('A1B2');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });
  
  test('matches normalized "riley healthcare"', () => {
    const result = matchInsured('riley healthcare');
    expect(result.insuredName).toBe('Riley HealthCare LLC');
    expect(result.internalId).toBe('A1B2');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });
  
  test('returns no match for "Foo Bar"', () => {
    const result = matchInsured('Foo Bar');
    expect(result.insuredName).toBe('Foo Bar');
    expect(result.internalId).toBeUndefined();
    expect(result.confidence).toBeLessThan(0.8);
  });
});

describe('calculateStringSimilarity', () => {
  test('returns 1 for identical strings', () => {
    const result = calculateStringSimilarity('test', 'test');
    expect(result).toBe(1);
  });
  
  test('returns 0 for completely different strings', () => {
    const result = calculateStringSimilarity('test', 'abcd');
    expect(result).toBeLessThan(0.5);
  });
  
  test('handles case insensitivity', () => {
    const result = calculateStringSimilarity('Test', 'test');
    expect(result).toBe(1);
  });
  
  test('handles undefined values', () => {
    expect(calculateStringSimilarity(undefined, 'test')).toBe(0);
    expect(calculateStringSimilarity('test', undefined)).toBe(0);
    expect(calculateStringSimilarity(undefined, undefined)).toBe(0);
  });
  
  test('handles similar strings', () => {
    const result = calculateStringSimilarity('policy123', 'policy-123');
    expect(result).toBeGreaterThan(0.8);
  });
});

describe('compareClaims', () => {
  const baseClaim: ExtractedClaim & { fileName: string } = {
    fileName: 'claim1.pdf',
    policyNumber: 'POL123',
    claimNumber: 'CLM456',
    insuredParty: 'Acme Corp',
    incidentDate: '2024-01-15',
    claimType: 'Property Damage',
    location: '123 Main St',
    description: 'Water damage from burst pipe',
    confidence: 0.8
  };
  
  test('identifies duplicate claims', () => {
    // Create an almost identical claim with minor differences
    const duplicateClaim = {
      ...baseClaim,
      fileName: 'claim2.pdf',
      description: 'Water damage from a burst pipe on third floor'
    };
    
    const result = compareClaims(baseClaim, duplicateClaim);
    
    expect(result.matchScore).toBeGreaterThan(0.8);
    expect(result.matchType).toBe(MatchType.DUPLICATE);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
  
  test('identifies related claims', () => {
    // Create a claim with some matching fields but significant differences
    const relatedClaim = {
      ...baseClaim,
      fileName: 'claim3.pdf',
      claimNumber: 'CLM789',
      incidentDate: '2024-01-16',
      description: 'Different issue at same location',
      insuredParty: 'Acme Company'
    };
    
    const result = compareClaims(baseClaim, relatedClaim);
    
    expect(result.matchScore).toBeGreaterThan(0.5);
    expect(result.matchScore).toBeLessThan(0.9);
    expect(result.matchType).toBe(MatchType.RELATED);
  });
  
  test('identifies different claims', () => {
    // Create a completely different claim
    const differentClaim: ExtractedClaim & { fileName: string } = {
      fileName: 'claim4.pdf',
      policyNumber: 'POL999',
      claimNumber: 'CLM888',
      insuredParty: 'Other Corp',
      incidentDate: '2024-03-15',
      claimType: 'Liability',
      location: '456 Other Ave',
      description: 'Completely different issue',
      confidence: 0.8
    };
    
    const result = compareClaims(baseClaim, differentClaim);
    
    expect(result.matchScore).toBeLessThan(0.5);
    expect(result.matchType).toBe(MatchType.DIFFERENT);
  });
}); 