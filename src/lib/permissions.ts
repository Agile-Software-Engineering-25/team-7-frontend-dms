/**
 * checks what the selected role is able to do.
 * These will be used in the frontend to only
 * show the relevant UI elements to the user.
 */
import useUser from '@/hooks/useUser';

export const usePermissions = () => {
  const { hasRole } = useUser();

  const canView = () => true; // everyone
  const canDownload = () => true; // everyone
  const canUpload = () => hasRole('staff') || hasRole('admin'); // staff and admin
  const canManage = () => hasRole('staff') || hasRole('admin'); // staff and admin
  const isAdmin = () => hasRole('admin'); // admin has it all

  return {
    canView,
    canDownload,
    canUpload,
    canManage,
    isAdmin,
  };
};
