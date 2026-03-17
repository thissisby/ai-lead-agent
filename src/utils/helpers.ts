import type { CollectedData, FinalQualificationOutput } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Budget parser — handles Indian number formats robustly.
 * Examples: "50 lakhs", "1.5 crore", "80L-1Cr", "5000000", "30-50 lakhs"
 */
export function parseBudget(raw: string): { min: number | null; max: number | null } {
  const cleaned = raw.toLowerCase().replace(/,/g, '').trim();

  // Multipliers
  const getMultiplier = (str: string): number => {
    if (/cr(ore)?s?/i.test(str)) return 10_000_000;
    if (/l(akh?)?s?|lac/i.test(str)) return 100_000;
    if (/k|thousand/i.test(str)) return 1_000;
    if (/million/i.test(str)) return 1_000_000;
    return 1;
  };

  const applyUnit = (value: number, unit: string, raw: string): number => {
    const m = getMultiplier(unit || raw);
    if (m > 1) return value * m;
    // Heuristic: if no unit and small number, assume lakhs
    if (value < 1000) return value * 100_000;
    return value;
  };

  // Range: "50-80 lakhs", "50L - 1Cr", "30 to 50 lakh"
  const rangeMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*([a-z]*)\s*(?:[-–to]+)\s*(\d+(?:\.\d+)?)\s*([a-z]*)/i
  );
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[3]);
    const unitMin = rangeMatch[2] || '';
    const unitMax = rangeMatch[4] || unitMin; // inherit unit from second half if missing

    min = applyUnit(min, unitMin, cleaned);
    max = applyUnit(max, unitMax, cleaned);
    return { min: Math.round(min), max: Math.round(max) };
  }

  // Single: "50 lakhs", "1.5 crore", "5000000"
  const singleMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*(cr(?:ore)?s?|l(?:akh?)?s?|lac|k|thousand|million)?/i
  );
  if (singleMatch) {
    let value = parseFloat(singleMatch[1]);
    const unit = singleMatch[2] || '';
    value = applyUnit(value, unit, cleaned);
    // ±20% range around stated value
    return { min: Math.round(value * 0.8), max: Math.round(value * 1.2) };
  }

  return { min: null, max: null };
}

export function formatBudgetDisplay(min: number | null, max: number | null): string {
  if (!min && !max) return 'Not specified';

  const fmt = (n: number): string => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`;
    if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
  };

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

/**
 * Builds the final canonical qualification JSON matching the assignment spec.
 */
export function buildFinalOutput(
  data: CollectedData,
  decision: 'Qualified' | 'Not Qualified',
  reasons: Array<{ criterion: string; passed: boolean; detail: string }>
): FinalQualificationOutput {
  // Build a concise reason string
  const failedCriteria = reasons
    .filter(r => !r.passed)
    .map(r => r.criterion)
    .join(', ');

  const passedCriteria = reasons
    .filter(r => r.passed)
    .map(r => r.criterion)
    .join(', ');

  const reason = decision === 'Qualified'
    ? `All key criteria met: ${passedCriteria}.`
    : `Failed criteria: ${failedCriteria || 'None specified'}.`;

  const subtype = data.residentialTopology
    || data.commercialSubtype
    || 'Not specified';

  return {
    contact_name:   data.confirmedName    || 'Not provided',
    location:       data.location         || 'Not provided',
    property_type:  data.propertyType
      ? data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1)
      : 'Not specified',
    subtype,
    budget:         data.budgetRaw        || formatBudgetDisplay(data.budgetMin, data.budgetMax),
    consent:        data.consent === true  ? 'Yes'
                  : data.consent === false ? 'No'
                  : 'Not provided',
    property_count: data.propertyCount    ?? 0,
    qualification:  decision,
    reason,
  };
}
