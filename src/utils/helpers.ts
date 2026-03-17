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

export function parseBudget(raw: string): { min: number | null; max: number | null } {
  const cleaned = raw.toLowerCase().replace(/,/g, '').trim();

  // Handle range like "50-80 lakhs" or "50L - 80L"
  const rangeMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*(?:l(?:akh?s?)?|lac)?\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:l(?:akh?s?)?|lac|cr(?:ore?s?)?)?/i
  );
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);
    const hasCrore = /cr(?:ore?s?)?/i.test(cleaned);
    const hasLakh = /l(?:akh?s?)?|lac/i.test(cleaned);
    if (hasCrore) {
      if (min < 100) min *= 10000000;
      if (max < 100) max *= 10000000;
    } else if (hasLakh || min < 1000) {
      if (min < 10000) min *= 100000;
      if (max < 10000) max *= 100000;
    }
    return { min, max };
  }

  // Handle single value like "50 lakhs", "1.5 crore", "5000000"
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(l(?:akh?s?)?|lac|cr(?:ore?s?)?|k|thousand|million)?/i);
  if (singleMatch) {
    let value = parseFloat(singleMatch[1]);
    const unit = singleMatch[2]?.toLowerCase() || '';

    if (unit.startsWith('cr')) {
      value *= 10000000;
    } else if (unit.startsWith('l') || unit === 'lac') {
      value *= 100000;
    } else if (unit === 'k' || unit === 'thousand') {
      value *= 1000;
    } else if (unit === 'million') {
      value *= 1000000;
    } else if (value < 1000) {
      // Assume lakhs if small number
      value *= 100000;
    }

    // Set a range of ±20%
    return { min: Math.round(value * 0.8), max: Math.round(value * 1.2) };
  }

  return { min: null, max: null };
}

export function formatBudgetDisplay(min: number | null, max: number | null): string {
  if (!min && !max) return 'Not specified';

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}
