import type { CollectedData, QualificationSummary, QualificationReason } from '../types';

/**
 * Deterministic Qualification Engine
 * 
 * Rules:
 * 1. Contact confirmed (name provided) — 1 point
 * 2. Location specified — 1 point
 * 3. Property type specified — 1 point
 * 4. Topology/subtype specified — 1 point
 * 5. Budget provided & parseable — 1 point
 * 6. Consent to sales call — 2 points (weighted higher)
 * 7. Properties available (count > 0) — 1 point
 * 
 * Qualified: score >= 5 out of 8 AND consent === true AND propertyCount > 0
 * Not Qualified: otherwise
 */

export function qualifyLead(
  leadId: string,
  data: CollectedData
): QualificationSummary {
  const reasons: QualificationReason[] = [];
  let score = 0;
  const maxScore = 8;

  // 1. Contact name confirmed
  const hasName = !!data.confirmedName && data.confirmedName.trim().length > 0;
  reasons.push({
    criterion: 'Contact Name Confirmed',
    passed: hasName,
    detail: hasName ? `Name: ${data.confirmedName}` : 'Name not confirmed',
  });
  if (hasName) score += 1;

  // 2. Location specified
  const hasLocation = !!data.location && data.location.trim().length > 0;
  reasons.push({
    criterion: 'Location Specified',
    passed: hasLocation,
    detail: hasLocation ? `Location: ${data.location}` : 'No location provided',
  });
  if (hasLocation) score += 1;

  // 3. Property type specified
  const hasPropertyType = !!data.propertyType;
  reasons.push({
    criterion: 'Property Type Specified',
    passed: hasPropertyType,
    detail: hasPropertyType ? `Type: ${data.propertyType}` : 'No property type specified',
  });
  if (hasPropertyType) score += 1;

  // 4. Topology/subtype
  const hasTopology = !!data.residentialTopology || !!data.commercialSubtype;
  const topologyValue = data.residentialTopology || data.commercialSubtype;
  reasons.push({
    criterion: 'Topology/Subtype Specified',
    passed: hasTopology,
    detail: hasTopology ? `Topology: ${topologyValue}` : 'No topology specified',
  });
  if (hasTopology) score += 1;

  // 5. Budget provided
  const hasBudget = data.budgetMin !== null || data.budgetMax !== null;
  reasons.push({
    criterion: 'Budget Provided',
    passed: hasBudget,
    detail: hasBudget
      ? `Budget range: ₹${(data.budgetMin || 0).toLocaleString()} - ₹${(data.budgetMax || 0).toLocaleString()}`
      : 'No budget provided',
  });
  if (hasBudget) score += 1;

  // 6. Consent (weighted 2 points)
  const hasConsent = data.consent === true;
  reasons.push({
    criterion: 'Sales Representative Consent',
    passed: hasConsent,
    detail: hasConsent
      ? 'User consented to sales follow-up'
      : data.consent === false
        ? 'User declined sales follow-up'
        : 'Consent not obtained',
  });
  if (hasConsent) score += 2;

  // 7. Properties available
  const hasProperties = (data.propertyCount || 0) > 0;
  reasons.push({
    criterion: 'Matching Properties Available',
    passed: hasProperties,
    detail: hasProperties
      ? `${data.propertyCount} matching properties found on realtyassistant.in`
      : 'No matching properties found',
  });
  if (hasProperties) score += 1;

  // Decision logic
  const isQualified = score >= 5 && hasConsent && hasProperties;

  return {
    leadId,
    decision: isQualified ? 'Qualified' : 'Not Qualified',
    reasons,
    collectedData: { ...data },
    propertyCount: data.propertyCount || 0,
    score,
    maxScore,
    timestamp: new Date().toISOString(),
  };
}
