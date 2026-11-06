export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus = 'Submitted' | 'InReview' | 'AwaitingAdminVerification' | 'Resolved';

/**
 * Backend complaint category field is a free-text String with no enum validation.
 * The model default is 'GENERAL' (uppercase).
 * The service stores exactly what is sent: data.category.trim() || 'GENERAL'.
 *
 * Convention used in this app:
 * - UI labels are human-readable (e.g. "Plumbing")
 * - Payload values sent to backend are UPPERCASE (e.g. "PLUMBING")
 * - Exception: "Wi-Fi" → "WIFI"
 * - Default fallback maps to the backend default "GENERAL"
 */
export type ComplaintCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CLEANLINESS'
  | 'NOISE'
  | 'SECURITY'
  | 'GENERAL';

export const COMPLAINT_CATEGORIES: {
  value: ComplaintCategory;
  label: string;
  icon: string;
}[] = [
  { value: 'PLUMBING', label: 'Plumbing', icon: 'water-outline' },
  { value: 'ELECTRICAL', label: 'Electrical', icon: 'flash-outline' },
  { value: 'CLEANLINESS', label: 'Cleanliness', icon: 'sparkles-outline' },
  { value: 'NOISE', label: 'Noise', icon: 'volume-high-outline' },
  { value: 'SECURITY', label: 'Security', icon: 'shield-outline' },
  { value: 'GENERAL', label: 'General', icon: 'construct-outline' },
];

export const COMPLAINT_SEVERITIES: {
  tier: ComplaintSeverity;
  label: string;
  description: string;
}[] = [
  { tier: 'Low', label: 'Low', description: 'Minor issue (e.g. flickering bulb)' },
  { tier: 'Medium', label: 'Medium', description: 'Standard maintenance required' },
  { tier: 'High', label: 'High', description: 'Urgent, affects daily living' },
  { tier: 'Critical', label: 'Critical', description: 'Emergency / Safety hazard (Audit logged)' },
];

/**
 * Returns a human-readable display label for a stored category value.
 * Handles both UPPERCASE backend values and any legacy mixed-case stored values.
 */
export function categoryDisplayLabel(value: string): string {
  if (!value) return 'General';
  const found = COMPLAINT_CATEGORIES.find(
    (c) => c.value.toUpperCase() === value.toUpperCase()
  );
  return found ? found.label : value;
}

export interface ComplaintAssignedStaff {
  _id: string;
  name: string;
  /**
   * email is populated by the repository (.populate('assignedStaffId', 'name email')).
   * phone is NOT populated — do not display phone for assigned staff.
   */
  email?: string;
}

export interface ComplaintHostelInfo {
  _id: string;
  name: string;
  location: string;
}

export interface ComplaintResidentInfo {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ComplaintRoomInfo {
  _id: string;
  roomNumber: string;
  floor?: string;
  layoutType?: string;
}

export interface ComplaintStatusHistoryEntry {
  status: ComplaintStatus;
  changedBy: string;
  changedAt: string;
}

export interface Complaint {
  _id: string;
  residentId: ComplaintResidentInfo | string;
  hostelId: ComplaintHostelInfo | string;
  roomId?: ComplaintRoomInfo | string | null;
  roomNumberAtSubmission?: string | null;
  assignedStaffId?: ComplaintAssignedStaff | null;
  title?: string;
  category: string;
  description: string;
  photoUrls?: string[];
  severityTier: ComplaintSeverity;
  status: ComplaintStatus;
  statusHistory?: ComplaintStatusHistoryEntry[];
  repairNote?: string;
  repairProofImageUrl?: string | null;
  residentConfirmedAt?: string | null;
  /**
   * blockchainRef is a server-side record reference.
   * The mobile does not independently verify the record, but can request its
   * saved explorer URL from the backend for public-chain lookup.
   */
  blockchainRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  /**
   * title is backend-optional (Joi: optional, allow(''))
   * Omit entirely if empty — do not send empty string.
   */
  title?: string;
  /**
   * category MUST be a UPPERCASE value matching ComplaintCategory type.
   * Backend stores exactly what is sent; default in model is 'GENERAL'.
   */
  category: ComplaintCategory;
  /**
   * description is required. min 5, max 2000 chars.
   */
  description: string;
  /**
   * severityTier must be exactly: 'Low' | 'Medium' | 'High' | 'Critical'
   */
  severityTier: ComplaintSeverity;
  photoUrls?: string[];
}

export interface MarkComplaintFixedPayload {
  repairNote?: string;
  repairProofImageUrl?: string;
}
