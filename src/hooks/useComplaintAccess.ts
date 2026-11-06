import { useResidencyStatus } from './useResidencyStatus';

export interface ComplaintAccess {
  /**
   * Whether the student is allowed to view complaints (GET /api/complaints/mine and /:id).
   * Backend requires Student role with ownership check; does NOT require active CheckedIn stay.
   * Both active residents and checked-out former residents can view historical complaints.
   */
  canViewComplaints: boolean;

  /**
   * Whether the student is allowed to file a new complaint (POST /api/complaints).
   * Backend requires active CheckedIn booking; returns 403 otherwise.
   */
  canCreateComplaint: boolean;

  /**
   * Whether the residency status query is currently loading.
   */
  isLoading: boolean;
}

/**
 * Authoritative access-control hook for resident complaints.
 * Separates read permissions (allowed for active & historical residents)
 * from create permissions (strict CheckedIn active resident requirement).
 */
export const useComplaintAccess = (): ComplaintAccess => {
  const { isActiveResident, isLoading } = useResidencyStatus();

  return {
    canViewComplaints: true,
    canCreateComplaint: isActiveResident,
    isLoading,
  };
};
