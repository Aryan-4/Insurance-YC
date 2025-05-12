/**
 * Match utilities for comparing and analyzing claims
 */

import { ExtractedClaim } from './parser';

export interface ClaimMatch {
  claimA: ExtractedClaim & { fileName: string };
  claimB: ExtractedClaim & { fileName: string };
  matchScore: number;
  matchType: MatchType;
  reasons: string[];
}

export enum MatchType {
  DUPLICATE = 'duplicate',
  RELATED = 'related',
  DIFFERENT = 'different',
}

export type MatchResult = { insuredName: string; internalId?: string; confidence: number; };

export const INSUREDS: { internalId: string; name: string }[] = [
  { internalId: "A1B2", name: "Riley HealthCare LLC" },
  { internalId: "C3D4", name: "Quail Creek RE LLC" },
  { internalId: "E5F6", name: "William James Group LLC" },
  { internalId: "G7H8", name: "Northstar Logistics Inc." },
  { internalId: "I9J0", name: "Evergreen Farms Ltd." },
  { internalId: "K1L2", name: "Beacon Financial Services Corp" },
  { internalId: "M3N4", name: "Hudson Valley Medical Partners" },
  { internalId: "O5P6", name: "Sierra Manufacturing Co." },
  { internalId: "Q7R8", name: "Lakeside Property Holdings, LLC" },
  { internalId: "S9T0", name: "Atlas Retail Group, Inc." },
  { internalId: "U1V2", name: "Pioneer Energy Solutions" },
  { internalId: "W3X4", name: "Blue Ridge Hospitality Partners" },
  { internalId: "Y5Z6", name: "Copper Mountain Mining Corp." },
  { internalId: "B7C8", name: "Silverline Software Ltd." },
  { internalId: "D9E0", name: "Harbor Point Marine Services" },
  { internalId: "F1G2", name: "Metro Transit Authority" },
  { internalId: "H3I4", name: "Golden Gate Ventures LLC" },
  { internalId: "J5K6", name: "Cypress Pharmaceuticals, Inc." },
  { internalId: "L7M8", name: "Redwood Timber Holdings" },
  { internalId: "N9O0", name: "Summit Peak Outdoor Gear" },
  { internalId: "P1Q2", name: "Capital Square Investments" },
  { internalId: "R3S4", name: "Ironclad Security Solutions" },
  { internalId: "T5U6", name: "Frontier Airlines Group" },
  { internalId: "V7W8", name: "Majestic Resorts & Spas Ltd." },
  { internalId: "X9Y0", name: "Orchard Valley Foods" },
  { internalId: "Z1A2", name: "Starlight Entertainment Corp" },
  { internalId: "B3D4", name: "Cascade Water Works" },
  { internalId: "F5H6", name: "Urban Grid Construction" },
  { internalId: "J7L8", name: "Vertex Capital Management" }
];

/**
 * Normalize company name by converting to lowercase, removing punctuation 
 * and common corporate suffixes
 * @param name - The company name to normalize
 * @returns The normalized company name
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove punctuation (keeping alphanumeric and spaces)
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // Remove common corporate suffixes
  const suffixes = [
    ' inc', ' llc', ' ltd', ' corp', ' co', ' company', 
    ' group', ' corporation', ' incorporated', ' limited'
  ];
  
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.substring(0, normalized.length - suffix.length);
    }
  }
  
  // Trim any leading/trailing whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings using dynamic programming
 * @param a - First string
 * @param b - Second string
 * @returns The Levenshtein distance (number of edits needed to transform a into b)
 */
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Match an extracted company name against the INSUREDS list
 * @param extracted - The extracted company name from a claim
 * @returns The best match result with confidence score
 */
export function matchInsured(extracted: string): MatchResult {
  if (!extracted) {
    console.log("Empty extracted name, returning default result");
    return { insuredName: '', confidence: 0 };
  }
  
  console.log(`Matching extracted name: "${extracted}"`);
  const normalizedExtracted = normalizeName(extracted);
  console.log(`Normalized extracted name: "${normalizedExtracted}"`);
  
  let bestMatch: { insured: typeof INSUREDS[0]; score: number } | null = null;
  
  // Keep track of all scores to find the best and second best
  const allScores: Array<{insured: typeof INSUREDS[0]; score: number}> = [];
  
  for (const insured of INSUREDS) {
    const normalizedName = normalizeName(insured.name);
    const distance = levenshtein(normalizedExtracted, normalizedName);
    const maxLen = Math.max(normalizedExtracted.length, normalizedName.length);
    const score = maxLen === 0 ? 0 : 1 - distance / maxLen;
    
    // Store all scores
    allScores.push({ insured, score });
    
    // Only log the best matches to avoid console spam
    if (score > 0.5) {
      console.log(`Good match with "${insured.name}" (normalized: "${normalizedName}"), distance: ${distance}, score: ${score.toFixed(2)}`);
    }
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { insured, score };
    }
  }
  
  // Sort scores in descending order
  allScores.sort((a, b) => b.score - a.score);
  
  // If best match has score < 0.8, return just the extracted name
  if (!bestMatch || bestMatch.score < 0.8) {
    // IMPORTANT: bestMatch.score will be the actual Levenshtein-based score
    const actualScore = bestMatch?.score || 0;
    
    // For debugging purposes, log the top 3 matches
    console.log("Top matches:");
    for (let i = 0; i < Math.min(3, allScores.length); i++) {
      console.log(`${i+1}. ${allScores[i].insured.name}: ${(allScores[i].score * 100).toFixed(1)}%`);
    }
    
    console.log(`No match with confidence ≥ 0.8. Best match: ${bestMatch?.insured.name || 'none'} with score: ${actualScore.toFixed(2)}`);
    console.log(`Returning result with insuredName: "${extracted}", confidence: ${actualScore}`);
    
    return {
      insuredName: extracted,
      confidence: actualScore // This ensures the actual calculated score is used
    };
  }
  
  // Otherwise return the best match with internalId
  console.log(`Found match: "${bestMatch.insured.name}" with internalId: ${bestMatch.insured.internalId}, confidence: ${bestMatch.score.toFixed(2)}`);
  console.log(`Returning result with insuredName: "${bestMatch.insured.name}", internalId: "${bestMatch.insured.internalId}", confidence: ${bestMatch.score}`);
  
  return {
    insuredName: bestMatch.insured.name,
    internalId: bestMatch.insured.internalId,
    confidence: bestMatch.score
  };
}

/**
 * Calculate similarity between two strings
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score between 0 and 1
 */
export function calculateStringSimilarity(a?: string, b?: string): number {
  if (!a || !b) return 0;
  
  // Convert to lowercase
  const strA = a.toLowerCase();
  const strB = b.toLowerCase();
  
  // Simple implementation using Levenshtein distance
  // TODO: Replace with more sophisticated fuzzy matching
  
  // Check for exact match first
  if (strA === strB) return 1;
  
  // Calculate Levenshtein distance
  const distance = levenshtein(strA, strB);
  const maxLength = Math.max(strA.length, strB.length);
  
  // Return similarity as 1 - normalized distance
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Compare two claims to determine if they are duplicates or related
 * @param claimA - First claim
 * @param claimB - Second claim
 * @returns Match information
 */
export function compareClaims(
  claimA: ExtractedClaim & { fileName: string },
  claimB: ExtractedClaim & { fileName: string }
): ClaimMatch {
  const reasons: string[] = [];
  let totalScore = 0;
  let fieldsCompared = 0;
  
  // Compare policy numbers (high importance)
  const policyScore = calculateStringSimilarity(claimA.policyNumber, claimB.policyNumber);
  if (policyScore > 0) {
    totalScore += policyScore * 3; // Weight policy number heavily
    fieldsCompared += 3;
    
    if (policyScore > 0.8) {
      reasons.push(`Policy numbers match (${claimA.policyNumber} and ${claimB.policyNumber})`);
    }
  }
  
  // Compare claim numbers (high importance)
  const claimNumberScore = calculateStringSimilarity(claimA.claimNumber, claimB.claimNumber);
  if (claimNumberScore > 0) {
    totalScore += claimNumberScore * 3;
    fieldsCompared += 3;
    
    if (claimNumberScore > 0.8) {
      reasons.push(`Claim numbers match (${claimA.claimNumber} and ${claimB.claimNumber})`);
    }
  }
  
  // Compare insured parties (medium importance)
  const insuredScore = calculateStringSimilarity(claimA.insuredParty, claimB.insuredParty);
  if (insuredScore > 0) {
    totalScore += insuredScore * 2;
    fieldsCompared += 2;
    
    if (insuredScore > 0.7) {
      reasons.push(`Insured parties match (${claimA.insuredParty} and ${claimB.insuredParty})`);
    }
  }
  
  // Compare dates (medium importance)
  const dateScore = calculateStringSimilarity(claimA.incidentDate, claimB.incidentDate);
  if (dateScore > 0) {
    totalScore += dateScore * 2;
    fieldsCompared += 2;
    
    if (dateScore > 0.7) {
      reasons.push(`Incident dates match (${claimA.incidentDate} and ${claimB.incidentDate})`);
    }
  }
  
  // Compare locations (medium importance)
  const locationScore = calculateStringSimilarity(claimA.location, claimB.location);
  if (locationScore > 0) {
    totalScore += locationScore * 2;
    fieldsCompared += 2;
    
    if (locationScore > 0.7) {
      reasons.push(`Locations match (${claimA.location} and ${claimB.location})`);
    }
  }
  
  // Compare descriptions (low importance)
  const descriptionScore = calculateStringSimilarity(claimA.description, claimB.description);
  if (descriptionScore > 0) {
    totalScore += descriptionScore;
    fieldsCompared += 1;
    
    if (descriptionScore > 0.6) {
      reasons.push('Descriptions contain similar content');
    }
  }
  
  // Calculate final match score
  const matchScore = fieldsCompared > 0 ? totalScore / fieldsCompared : 0;
  
  // Determine match type
  let matchType = MatchType.DIFFERENT;
  if (matchScore > 0.8) {
    matchType = MatchType.DUPLICATE;
  } else if (matchScore > 0.5) {
    matchType = MatchType.RELATED;
  }
  
  return {
    claimA,
    claimB,
    matchScore,
    matchType,
    reasons: reasons.length > 0 ? reasons : ['No significant similarities found'],
  };
}

/**
 * Find duplicate or related claims in a set of claims
 * @param claims - Array of extracted claims
 * @returns Array of claim matches
 */
export function findRelatedClaims(
  claims: Array<ExtractedClaim & { fileName: string }>
): ClaimMatch[] {
  const matches: ClaimMatch[] = [];
  
  // Compare each claim with every other claim
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const match = compareClaims(claims[i], claims[j]);
      
      // Only include matches that are duplicates or related
      if (match.matchType !== MatchType.DIFFERENT) {
        matches.push(match);
      }
    }
  }
  
  return matches;
} 

