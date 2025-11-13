/**
 * Helper functions for study group operations
 */

/**
 * Parse studyGroupIds from API response
 * @param studyGroupIds - The studyGroupIds string from the API
 * @returns Array of study group IDs
 */
export function parseStudyGroupIds(studyGroupIds?: string): string[] {
  if (!studyGroupIds || studyGroupIds.length == 0) return [];
  // Remove outer brackets and spaces
  const trimmed = studyGroupIds.trim().replace(/^\[|\]$/g, '');
  // Split by commas, remove single quotes and trim
  return trimmed
    .split(',')
    .map((id) => id.replace(/'/g, '').trim())
    .filter((id) => id.length > 0);
}

/**
 * Format studyGroupIds for API request
 * The API expects it as a string array
 * @param groups - Array of group names
 * @returns Formatted array
 */
export function formatStudyGroupIds(groups: string[]): string[] {
  return groups;
}
