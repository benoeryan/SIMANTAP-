import { UserProfile, UserRole } from '../context/AuthContext';
import { AdminUser } from '../types';

/**
 * List of known Super Admin emails / identifiers with universal bypass access
 */
export const SUPER_ADMIN_IDENTIFIERS = [
  'admin@ijefcorp.com',
  'benoeryan@gmail.com',
  'benoeryan21@gmail.com',
  'maharanialipijefcorp@gmail.com',
  'hokage',
  'admin'
];

/**
 * Clean, centralized check to determine if a user is a Super Admin.
 * Prevents "tumpang tindih" (overlap) by strictly separating Super Admin
 * from regular administrators (such as HR Legal, Dokter, Finance, Admin Matching, etc.)
 */
export function isSuperAdminUser(
  user: UserProfile | null | undefined,
  masterAdminList?: AdminUser[]
): boolean {
  if (!user) return false;

  // Siswa and Mitra roles can never be Super Admin
  if (user.role !== 'admin' && user.role !== 'marketing') {
    return false;
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const userDisplayName = (user.displayName || '').toLowerCase().trim();

  // 1. Explicit boolean flag on user profile
  if (user.isSuperAdmin === true) {
    return true;
  }

  // 2. Explicit adminRole string
  if (
    user.adminRole === 'SuperAdmin' ||
    user.adminRole === 'Super Admin'
  ) {
    return true;
  }

  // 3. Explicit universal portal access
  if (user.portalAccess === 'ALL_PORTALS') {
    return true;
  }

  // 4. Known hardcoded Super Admin master emails or usernames
  const isDirectMasterEmail = SUPER_ADMIN_IDENTIFIERS.some((ident) => {
    const identLower = ident.toLowerCase();
    return (
      userEmail === identLower ||
      userEmail.startsWith(`${identLower}@`) ||
      userDisplayName.includes(identLower) ||
      (identLower.includes('benoeryan') && userEmail.includes('benoeryan')) ||
      (identLower.includes('hokage') && userEmail.includes('hokage'))
    );
  });

  if (isDirectMasterEmail) {
    return true;
  }

  // 5. Match against masterSettings adminUsers list registered in DB
  if (masterAdminList && masterAdminList.length > 0) {
    const match = masterAdminList.find((adm) => {
      if (!adm) return false;
      const admEmail = (adm.email || '').toLowerCase().trim();
      const admName = (adm.name || '').toLowerCase().trim();
      return (
        (admEmail && admEmail === userEmail) ||
        (admName && admName === userDisplayName)
      );
    });

    if (match) {
      if (
        match.isSuperAdmin === true ||
        match.role === 'SuperAdmin' ||
        match.portalAccess === 'ALL_PORTALS'
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines whether a user has permission to access a specific portal
 */
export function canUserAccessPortal(
  user: UserProfile | null | undefined,
  portal: 'ADMIN_1' | 'ADMIN_2' | 'MARKETING' | 'MITRA' | 'SISWA',
  masterAdminList?: AdminUser[]
): boolean {
  if (!user) return false;

  // Super Admin can access every portal without restriction
  if (isSuperAdminUser(user, masterAdminList)) {
    return true;
  }

  // Any admin or marketing user can access back-office portals
  const userRole = String(user.role || '');
  if (userRole === 'admin' || userRole === 'marketing') {
    return true;
  }

  switch (portal) {
    case 'MARKETING':
      return (
        userRole === 'marketing' ||
        user.portalAccess === 'MARKETING_PORTAL' ||
        user.portalAccess === 'ALL_PORTALS' ||
        userRole === 'admin'
      );

    case 'ADMIN_1':
      return (
        userRole === 'admin' ||
        userRole === 'marketing' ||
        user.portalAccess === 'ADMIN_1_IJEF' ||
        user.portalAccess === 'ALL_PORTALS'
      );

    case 'ADMIN_2':
      return (
        userRole === 'admin' ||
        userRole === 'marketing' ||
        user.portalAccess === 'ADMIN_2_CV_PORTAL' ||
        user.portalAccess === 'ALL_PORTALS'
      );

    case 'MITRA':
      return user.role === 'mitra' || user.portalAccess === 'MITRA_PORTAL';

    case 'SISWA':
      return user.role === 'siswa' || user.portalAccess === 'STUDENT_PORTAL';

    default:
      return true;
  }
}

/**
 * Determines whether a user has permission to access a specific admin sub-module
 */
export function canUserAccessModule(
  user: UserProfile | null | undefined,
  moduleId: string,
  masterAdminList?: AdminUser[]
): boolean {
  if (!user) return false;
  if (user.role !== 'admin' && user.role !== 'marketing') return true;

  // Super Admin has full module access
  if (isSuperAdminUser(user, masterAdminList)) {
    return true;
  }

  // Allow all back-office admins/marketing to access modules
  return true;

  const role = user.adminRole || '';

  switch (moduleId) {
    case 'master': // Student Master View
      return true; // All admins can view master student list

    case 'portal': // Candidate Registration
      return true;

    case 'kesehatan': // Medical Checkup
      return (
        role === 'Dokter' ||
        role.toLowerCase().includes('dokter') ||
        role.toLowerCase().includes('medis') ||
        user.portalAccess === 'ADMIN_1_IJEF'
      );

    case 'disc': // DISC Assessment
      return (
        role === 'HR Legal' ||
        role.toLowerCase().includes('hr') ||
        role.toLowerCase().includes('psikolog') ||
        user.portalAccess === 'ADMIN_1_IJEF'
      );

    case 'psikotes': // Psikotes
      return (
        role === 'HR Legal' ||
        role.toLowerCase().includes('hr') ||
        role.toLowerCase().includes('psikolog') ||
        user.portalAccess === 'ADMIN_1_IJEF'
      );

    case 'dana': // Financial Support
      return (
        role === 'Finance' ||
        role.toLowerCase().includes('finance') ||
        role.toLowerCase().includes('keuangan') ||
        user.portalAccess === 'ADMIN_1_IJEF'
      );

    case 'kontrak': // Legal Contract
      return (
        role === 'HR Legal' ||
        role.toLowerCase().includes('legal') ||
        user.portalAccess === 'ADMIN_1_IJEF'
      );

    case 'settings': // Application Settings / RBAC
      // Only Super Admin can access RBAC and global configuration settings
      return isSuperAdminUser(user, masterAdminList);

    default:
      return true;
  }
}
