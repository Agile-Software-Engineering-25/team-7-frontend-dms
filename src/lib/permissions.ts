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
  viewDocuments: ['user', 'staff', 'admin'],
  filterDocuments: ['user', 'staff', 'admin'],
  searchDocuments: ['user', 'staff', 'admin'],
  navigateFolders: ['user', 'staff', 'admin'],
  downloadDocuments: ['user', 'staff', 'admin'],

  // only 'staff' and 'admin'
  uploadDocuments: ['staff', 'admin'],
  manageDocuments: ['staff', 'admin'],
};

export const useCanAccess = () => {
  const { hasRole } = useUser();

  const canAccess = (action: Action): boolean => {
    const allowedRoles = permissionsMap[action];
    return allowedRoles.some((role) => hasRole(role));
  };

  return { canAccess };
};
