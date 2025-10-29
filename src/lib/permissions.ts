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
  viewDocuments: ['Area-2.Team-7.Read.read-document'],
  filterDocuments: ['Area-2.Team-7.Read.read-document'],
  searchDocuments: ['Area-2.Team-7.Read.read-document'],
  navigateFolders: ['Area-2.Team-7.Read.read-document'],
  downloadDocuments: ['Area-2.Team-7.Read.read-document'],

  // only 'staff', 'dozent' and 'admin'
  uploadDocuments: ['Area-2.Team-7.ReadUpdateDelete.readwrite-document'],
  manageDocuments: ['Area-2.Team-7.ReadUpdateDelete.readwrite-document'],
};

export const useCanAccess = () => {
  const { hasRole } = useUser();

  const canAccess = (action: Action): boolean => {
    const allowedRoles = permissionsMap[action];
    return allowedRoles.some((role) => hasRole(role));
  };

  return { canAccess };
};
