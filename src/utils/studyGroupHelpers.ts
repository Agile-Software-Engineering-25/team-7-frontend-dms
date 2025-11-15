/**
 * Helper functions for study group operations
 */

/**
 * Parse studyGroupIds from API response
 * @param studyGroupIds - The studyGroupIds string from the API or array
 * @returns Array of study group IDs
 */
export function parseStudyGroupIds(studyGroupIds?: string | string[] | { name: string }[]): string[] {
  if (!studyGroupIds) return [];
  
  // Handle array of strings
  if (Array.isArray(studyGroupIds)) {
    // If it's an array of objects with name property
    if (studyGroupIds.length > 0 && typeof studyGroupIds[0] === 'object' && 'name' in studyGroupIds[0]) {
      return (studyGroupIds as { name: string }[]).map((item) => item.name);
    }
    // If it's already an array of strings
    return studyGroupIds as string[];
  }
  
  // Handle string case
  if (typeof studyGroupIds === 'string') {
    if (studyGroupIds.length === 0) return [];
    // Remove outer brackets and spaces
    const trimmed = studyGroupIds.trim().replace(/^\[|\]$/g, '');
    console.info('studyGroupIds type:', typeof studyGroupIds, studyGroupIds);
    // Split by commas, remove single quotes and trim
    return trimmed
      .split(',')
      .map((id) => id.replace(/'/g, '').trim())
      .filter((id) => id.length > 0);
  }
  
  return [];
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
