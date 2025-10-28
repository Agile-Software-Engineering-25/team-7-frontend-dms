/**
 * checks what the selected role is able to do.
 * These will be used in the frontend to only
 * show the relevant UI elements to the user.
 */
import useUser from '@/hooks/useUser';

export type Action =
  | 'viewDocuments'
  | 'filterDocuments'
  | 'searchDocuments'
  | 'navigateFolders'
  | 'downloadDocuments'
  | 'uploadDocuments'
  | 'manageDocuments'; // rename, move, delete, createFolder

const permissionsMap: Record<Action, string[]> = {
  // everyone
  viewDocuments: ['student', 'dozent', 'staff', 'admin'],
  filterDocuments: ['student', 'dozent', 'staff', 'admin'],
  searchDocuments: ['student', 'dozent', 'staff', 'admin'],
  navigateFolders: ['student', 'dozent', 'staff', 'admin'],
  downloadDocuments: ['student', 'dozent', 'staff', 'admin'],

  // only 'staff', 'dozent' and 'admin'
  uploadDocuments: ['staff', 'dozent', 'admin'],
  manageDocuments: ['staff', 'dozent', 'admin'],
};

export const useCanAccess = () => {
  const { hasRole } = useUser();

  const canAccess = (action: Action): boolean => {
    const allowedRoles = permissionsMap[action];
    return allowedRoles.some((role) => hasRole(role));
  };

  return { canAccess };
};
