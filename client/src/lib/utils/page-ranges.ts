/**
 * Parses user-entered page ranges like "1-3, 5, 8-10"
 * Returns 0-based page indices sorted without duplicates.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) {
    return [];
  }

  const result = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid range specification: "${part}". Ensure numbers are positive and start <= end.`);
      }

      for (let i = start; i <= Math.min(end, totalPages); i++) {
        result.add(i - 1); // 0-based index
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error(`Invalid page number: "${part}". Must be a positive integer.`);
      }
      if (pageNum <= totalPages) {
        result.add(pageNum - 1); // 0-based index
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Parses ranges into distinct groups (e.g. for split into multiple files)
 * "1-3, 5-7" -> [[0, 1, 2], [4, 5, 6]]
 */
export function parsePageRangeGroups(rangeStr: string, totalPages: number): number[][] {
  if (!rangeStr.trim()) {
    return [];
  }

  const groups: number[][] = [];
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const groupSet = new Set<number>();
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid range: "${part}"`);
      }

      for (let i = start; i <= Math.min(end, totalPages); i++) {
        groupSet.add(i - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error(`Invalid page: "${part}"`);
      }
      if (pageNum <= totalPages) {
        groupSet.add(pageNum - 1);
      }
    }

    if (groupSet.size > 0) {
      groups.push(Array.from(groupSet).sort((a, b) => a - b));
    }
  }

  return groups;
}

/**
 * Formats a list of 0-based page numbers into human-readable compact string e.g. "1-3, 5, 8"
 */
export function formatPageIndices(indices: number[]): string {
  if (indices.length === 0) return '';
  const sorted = [...indices].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);

  return ranges.join(', ');
}
