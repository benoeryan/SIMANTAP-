import { UserProfile } from '../context/AuthContext';
import { MarketingLead, MarketingStaff, AdminUser } from '../types';
import { isSuperAdminUser } from './authUtils';
import { INITIAL_MARKETING_STAFF } from '../data/crmSeedData';

export interface MarketingAccessInfo {
  isLeaderOrAdmin: boolean;
  userStaffProfile: MarketingStaff | null;
  staffName: string;
  staffEmail: string;
  roleTitle: string;
  accessModeLabel: string;
  canViewAllTeamData: boolean;
  canManageStaffTargets: boolean;
}

export type CanonicalPipelineStageKey =
  | 'LEAD_BARU'
  | 'KONTAK_AWAL'
  | 'KONSULTASI_LPK'
  | 'FOLLOW_UP'
  | 'DEAL_TERDAFTAR'
  | 'LOST_BATAL';

/**
 * Normalizes any lead status (such as KONSULTASI_VISIT, DIHUBUNGI, BATAL_REJECT, etc.)
 * into one of the 6 canonical Kanban Pipeline stages so that every lead is consistently
 * visible in its corresponding stage column across all views and accounts.
 */
export function getCanonicalPipelineStage(status: string | undefined | null): CanonicalPipelineStageKey {
  if (!status) return 'LEAD_BARU';
  const s = String(status).toUpperCase().trim();

  if (
    s === 'LEAD_BARU' ||
    s === 'BARU' ||
    s === 'NEW' ||
    s === 'INQUIRY' ||
    s.includes('BARU') ||
    s.includes('INQUIRY')
  ) {
    return 'LEAD_BARU';
  }

  if (
    s === 'KONTAK_AWAL' ||
    s === 'DIHUBUNGI' ||
    s === 'CONTACTED' ||
    s.includes('KONTAK') ||
    s.includes('HUBUNG')
  ) {
    return 'KONTAK_AWAL';
  }

  if (
    s === 'KONSULTASI_LPK' ||
    s === 'KONSULTASI_VISIT' ||
    s === 'KONSULTASI' ||
    s === 'VISIT' ||
    s.includes('KONSUL') ||
    s.includes('VISIT') ||
    s.includes('EDUKASI')
  ) {
    return 'KONSULTASI_LPK';
  }

  if (
    s === 'FOLLOW_UP' ||
    s === 'FOLLOWUP' ||
    s === 'PROSES_FOLLOW_UP' ||
    s.includes('FOLLOW')
  ) {
    return 'FOLLOW_UP';
  }

  if (
    s === 'DEAL_TERDAFTAR' ||
    s === 'CLOSING' ||
    s === 'TERDAFTAR' ||
    s === 'REGISTERED' ||
    s === 'PORTAL REGISTERED' ||
    s.includes('DEAL') ||
    s.includes('CLOSING') ||
    s.includes('TERDAFTAR') ||
    s.includes('REGISTERED')
  ) {
    return 'DEAL_TERDAFTAR';
  }

  if (
    s === 'LOST_BATAL' ||
    s === 'BATAL_REJECT' ||
    s === 'BATAL' ||
    s === 'REJECT' ||
    s === 'REJECTED' ||
    s === 'LOST' ||
    s.includes('BATAL') ||
    s.includes('REJECT') ||
    s.includes('LOST')
  ) {
    return 'LOST_BATAL';
  }

  return 'LEAD_BARU';
}

/**
 * Normalizes lead record fields ensuring PIC, assigned staff, and integration flags are uniform
 */
export function normalizeLeadData(lead: Partial<MarketingLead> | any): MarketingLead {
  if (!lead) return lead;
  const pic = lead.picMarketingStaff || lead.assignedStaff || 'Admin Marketing';
  const assigned = lead.assignedStaff || lead.picMarketingStaff || 'Admin Marketing';
  const isIntegrated = Boolean(lead.terintegrasiKeAdmin1 || lead.integratedToAdmin1);
  const studentId = lead.siswaId || lead.integratedStudentId || '';

  const rawFollowUps = Array.isArray(lead.riwayatFollowUp)
    ? lead.riwayatFollowUp
    : Array.isArray(lead.followUpLogs)
    ? lead.followUpLogs
    : [];

  return {
    ...lead,
    riwayatFollowUp: rawFollowUps,
    followUpLogs: rawFollowUps,
    picMarketingStaff: pic,
    assignedStaff: assigned,
    terintegrasiKeAdmin1: isIntegrated,
    integratedToAdmin1: isIntegrated,
    siswaId: studentId || (isIntegrated ? (lead.siswaId || lead.integratedStudentId) : undefined),
    integratedStudentId: studentId || (isIntegrated ? (lead.siswaId || lead.integratedStudentId) : undefined),
  };
}

/**
 * Checks if the current authenticated user has Leader or Admin level access in the Marketing CRM.
 * Admins, SuperAdmins, Marketing Managers, Heads, Supervisors, Directors, and Coordinators
 * have full team visibility. Regular marketing staff can only see their own assigned leads.
 */
export function getMarketingAccessInfo(
  user: UserProfile | null | undefined,
  masterAdminList?: AdminUser[],
  customStaffList?: MarketingStaff[]
): MarketingAccessInfo {
  if (!user) {
    return {
      isLeaderOrAdmin: false,
      userStaffProfile: null,
      staffName: 'Tamu / Belum Login',
      staffEmail: '',
      roleTitle: 'Staff Marketing',
      accessModeLabel: 'Mode Akses Terbatas',
      canViewAllTeamData: false,
      canManageStaffTargets: false
    };
  }

  const email = (user.email || '').toLowerCase().trim();
  const displayName = (user.displayName || '').toLowerCase().trim();
  const adminRole = (user.adminRole || '').toLowerCase().trim();
  const staffList = customStaffList && customStaffList.length > 0 ? customStaffList : INITIAL_MARKETING_STAFF;

  // 1. SuperAdmin or System Admin
  const isSuperAdmin = isSuperAdminUser(user, masterAdminList);
  const isSystemAdminRole = user.role === 'admin';

  // 2. Title keywords indicating leader / manager / head / supervisor / coordinator / director
  const leaderKeywords = [
    'head',
    'manager',
    'leader',
    'supervisor',
    'spv',
    'direktur',
    'director',
    'superadmin',
    'admin',
    'lead',
    'koordinator',
    'kepala'
  ];

  const hasLeaderKeywordInRole = leaderKeywords.some((kw) => adminRole.includes(kw));

  // 3. Find matching staff record in marketing staff list
  const staffMatch = staffList.find((st) => {
    const stEmail = (st.email || '').toLowerCase().trim();
    const stName = (st.nama || '').toLowerCase().trim();
    const firstName = stName.split(' ')[0];
    return (
      (email && stEmail === email) ||
      (displayName && stName === displayName) ||
      (email && firstName.length >= 3 && email.includes(firstName)) ||
      (displayName && firstName.length >= 3 && displayName.includes(firstName))
    );
  }) || null;

  const isStaffLeaderRole = staffMatch
    ? leaderKeywords.some((kw) => (staffMatch.roleMarketing || '').toLowerCase().includes(kw))
    : false;

  const isLeaderOrAdmin = isSuperAdmin || isSystemAdminRole || hasLeaderKeywordInRole || isStaffLeaderRole;

  const resolvedName = staffMatch?.nama || user.displayName || user.email?.split('@')[0] || 'Staff Marketing';
  const resolvedEmail = staffMatch?.email || user.email || '';
  const resolvedRole = isSuperAdmin
    ? 'Super Administrator'
    : staffMatch?.roleMarketing || user.adminRole || (isLeaderOrAdmin ? 'Marketing Manager / Leader' : 'Staff Marketing CRM');

  return {
    isLeaderOrAdmin,
    userStaffProfile: staffMatch,
    staffName: resolvedName,
    staffEmail: resolvedEmail,
    roleTitle: resolvedRole,
    accessModeLabel: isLeaderOrAdmin
      ? '👑 Mode Akses: Level Leader & Admin (Seluruh Tim)'
      : `🔒 Mode Akses: Data Pribadi (${resolvedName})`,
    canViewAllTeamData: isLeaderOrAdmin,
    canManageStaffTargets: isLeaderOrAdmin
  };
}

/**
 * Checks if a specific lead belongs to the current user
 */
export function isLeadBelongsToUser(
  lead: MarketingLead,
  accessInfo: MarketingAccessInfo
): boolean {
  if (!lead) return false;

  const leadPic = (lead.picMarketingStaff || '').toLowerCase().trim();
  const leadAssigned = (lead.assignedStaff || '').toLowerCase().trim();
  const leadEmail = (lead.assignedStaffEmail || '').toLowerCase().trim();

  const userEmail = (accessInfo.staffEmail || '').toLowerCase().trim();
  const userName = (accessInfo.staffName || '').toLowerCase().trim();
  const userFirstName = userName.split(' ')[0];

  // Exact or partial email match
  if (userEmail && leadEmail && (userEmail === leadEmail || leadEmail.includes(userEmail) || userEmail.includes(leadEmail))) {
    return true;
  }

  // Exact or partial name match
  if (userName && leadPic && (userName === leadPic || leadPic.includes(userName) || userName.includes(leadPic))) {
    return true;
  }

  if (userName && leadAssigned && (userName === leadAssigned || leadAssigned.includes(userName) || userName.includes(leadAssigned))) {
    return true;
  }

  // First name match if at least 3 characters
  if (userFirstName && userFirstName.length >= 3) {
    if (leadPic.includes(userFirstName) || leadAssigned.includes(userFirstName) || leadEmail.includes(userFirstName)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter leads array according to user access level and optional inspector staff filter
 */
export function getScopedLeadsForUser(
  allLeads: MarketingLead[],
  accessInfo: MarketingAccessInfo,
  selectedStaffFilterOverride: string = 'ALL'
): MarketingLead[] {
  if (!allLeads || allLeads.length === 0) return [];

  // Normalize leads
  const normalized = allLeads.map(normalizeLeadData);

  // Leader / Admin with Full Access
  if (accessInfo.isLeaderOrAdmin) {
    if (!selectedStaffFilterOverride || selectedStaffFilterOverride === 'ALL') {
      return normalized;
    }
    // Filter to selected staff if Leader chooses to inspect an individual staff
    const targetFilter = selectedStaffFilterOverride.toLowerCase().trim();
    const targetFirstName = targetFilter.split(' ')[0];
    return normalized.filter((l) => {
      const pic = (l.picMarketingStaff || '').toLowerCase().trim();
      const assigned = (l.assignedStaff || '').toLowerCase().trim();
      const email = (l.assignedStaffEmail || '').toLowerCase().trim();
      return (
        pic === targetFilter ||
        assigned === targetFilter ||
        email === targetFilter ||
        pic.includes(targetFilter) ||
        assigned.includes(targetFilter) ||
        (targetFirstName.length >= 3 && (pic.includes(targetFirstName) || assigned.includes(targetFirstName) || email.includes(targetFirstName)))
      );
    });
  }

  // Regular Marketing Staff -> Strictly isolated to their own leads
  return normalized.filter((lead) => isLeadBelongsToUser(lead, accessInfo));
}
