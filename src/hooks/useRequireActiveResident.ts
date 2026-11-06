import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useResidencyStatus, type ResidencyStatus } from './useResidencyStatus';

export interface RequireActiveResidentResult {
  isActiveResident: boolean;
  isLoading: boolean;
  residency: ResidencyStatus;
}

/**
 * Access guard hook for future Resident-only features.
 * Guarantees that the student currently holds an active 'CheckedIn' booking.
 * Derived solely from server booking state (never locally persisted).
 *
 * @param redirectToStayOnDenied If true, automatically navigates to StayTab if non-resident.
 */
export const useRequireActiveResident = (
  redirectToStayOnDenied = false
): RequireActiveResidentResult => {
  const navigation = useNavigation<any>();
  const residency = useResidencyStatus();

  useEffect(() => {
    if (redirectToStayOnDenied && !residency.isLoading && !residency.isActiveResident) {
      navigation.navigate('StudentTabs', { screen: 'StayTab' });
    }
  }, [redirectToStayOnDenied, residency.isLoading, residency.isActiveResident, navigation]);

  return {
    isActiveResident: residency.isActiveResident,
    isLoading: residency.isLoading,
    residency,
  };
};
