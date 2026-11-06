import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StudentStackParamList } from '../../navigation/types';
import { BookingApplicationScreen } from './BookingApplicationScreen';

type Props = NativeStackScreenProps<StudentStackParamList, any>;

/**
 * Backward compatibility wrapper for RoomPreviewScreen.
 * Delegates directly to the full BookingApplicationScreen.
 */
export const RoomPreviewScreen: React.FC<Props> = (props) => {
  return <BookingApplicationScreen {...(props as any)} />;
};

