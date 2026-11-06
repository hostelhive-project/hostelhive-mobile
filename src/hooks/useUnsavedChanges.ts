import { useEffect, useRef, useState } from 'react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { showDialog } from '../utils/dialog';

export function useUnsavedChanges(dirty: boolean) {
  const navigation = useNavigation();
  const [allowed, setAllowed] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const allowNavigation = (action: () => void) => {
    pending.current = action;
    setAllowed(true);
  };
  usePreventRemove(dirty && !allowed, ({ data }) => {
    showDialog('Discard unsaved changes?', 'Your changes have not been submitted. Stay here to continue editing, or discard them and leave.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard & leave', style: 'destructive', onPress: () => allowNavigation(() => navigation.dispatch(data.action)) },
    ]);
  });
  useEffect(() => {
    if (!allowed || !pending.current) return;
    const action = pending.current;
    pending.current = null;
    action();
  }, [allowed]);
  return { allowNavigation };
}
