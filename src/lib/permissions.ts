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
  viewDocuments: ['area-2-team-7-read', 'area-2-team-7-readwriteupdate-documents'],
  filterDocuments: ['area-2-team-7-read', 'area-2-team-7-readwriteupdate-documents'],
  searchDocuments: ['area-2-team-7-read', 'area-2-team-7-readwriteupdate-documents'],
  navigateFolders: ['area-2-team-7-read', 'area-2-team-7-readwriteupdate-documents'],
  downloadDocuments: ['area-2-team-7-read', 'area-2-team-7-readwriteupdate-documents'],

  // only 'staff', 'dozent' and 'admin'
  uploadDocuments: ['area-2-team-7-readwriteupdate-documents'],
  manageDocuments: ['area-2-team-7-readwriteupdate-documents'],
};

export const useCanAccess = () => {
  const { hasRole } = useUser();

  const canAccess = (action: Action): boolean => {
    const allowedRoles = permissionsMap[action];
    return allowedRoles.some((role) => hasRole(role));
  };

  return { canAccess };
};
