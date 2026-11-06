import React, { useState, useEffect } from 'react';
import { ConfirmModal } from './ConfirmModal';
import { DialogButton } from '../../utils/dialog';

interface GlobalModalState {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
}

let globalModalListener: ((state: GlobalModalState) => void) | null = null;

export const openGlobalConfirmModal = (
  title: string,
  message: string,
  buttons: DialogButton[]
) => {
  if (globalModalListener) {
    globalModalListener({
      visible: true,
      title,
      message,
      buttons,
    });
    return true;
  }
  return false;
};

export const GlobalModalContainer: React.FC = () => {
  const [modalState, setModalState] = useState<GlobalModalState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    globalModalListener = setModalState;
    return () => {
      globalModalListener = null;
    };
  }, []);

  if (!modalState.visible) return null;

  const cancelBtn = modalState.buttons.find((b) => b.style === 'cancel');
  const actionBtn = modalState.buttons.find((b) => b.style !== 'cancel') || modalState.buttons[0];

  const isDestructive = actionBtn?.style === 'destructive';

  const handleClose = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
    if (cancelBtn?.onPress) {
      cancelBtn.onPress();
    }
  };

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
    if (actionBtn?.onPress) {
      actionBtn.onPress();
    }
  };

  return (
    <ConfirmModal
      visible={modalState.visible}
      title={modalState.title}
      message={modalState.message}
      onClose={handleClose}
      onConfirm={handleConfirm}
      cancelText={cancelBtn?.text || 'Cancel'}
      confirmText={actionBtn?.text || 'Confirm'}
      type={isDestructive ? 'destructive' : 'primary'}
    />
  );
};

