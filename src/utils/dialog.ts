import { Alert, AlertButton, AlertOptions, Platform } from 'react-native';
import { triggerGlobalToast, ToastType } from '../components/ui/Toast';
import { openGlobalConfirmModal } from '../components/ui/GlobalModal';

export type DialogButton = AlertButton;
export type DialogOptions = AlertOptions;

/**
 * Modern cross-platform dialog utility.
 * - Multi-action dialogs (2+ buttons): Opens our custom ConfirmModal UI with smooth backdrop and buttons.
 * - Informative dialogs (0 or 1 button): Fires an animated custom Toast at the top of the screen.
 * - Native Alert.alert is only used as a fallback if the UI container is not yet ready.
 */
export const showDialog = (
  title: string,
  message?: string,
  buttons?: DialogButton[],
  options?: DialogOptions
): void => {
  const fullMessage = message || '';

  // 1. Multi-action Confirmation Dialog (e.g. Cancel Booking, Logout, Delete)
  if (buttons && buttons.length >= 2) {
    const handledByModal = openGlobalConfirmModal(title, fullMessage, buttons);
    if (handledByModal) {
      return;
    }

    // Fallback if modal container not mounted
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(title ? `${title}\n\n${fullMessage}` : fullMessage);
      const actionBtn = buttons.find((b) => b.style !== 'cancel' && !!b.onPress);
      const cancelBtn = buttons.find((b) => b.style === 'cancel' && !!b.onPress);
      if (confirmed && actionBtn?.onPress) actionBtn.onPress();
      else if (!confirmed && cancelBtn?.onPress) cancelBtn.onPress();
      return;
    }

    Alert.alert(title, fullMessage, buttons, options);
    return;
  }

  // 2. Informative Notification (0 or 1 button) -> Show custom animated Toast
  let toastType: ToastType = 'info';
  const combined = (title + ' ' + fullMessage).toLowerCase();

  if (
    combined.includes('error') ||
    combined.includes('failed') ||
    combined.includes('unable') ||
    combined.includes('required') ||
    combined.includes('invalid')
  ) {
    toastType = 'error';
  } else if (
    combined.includes('success') ||
    combined.includes('confirmed') ||
    combined.includes('submitted') ||
    combined.includes('completed') ||
    combined.includes('cancelled') ||
    combined.includes('approved') ||
    combined.includes('copied')
  ) {
    toastType = 'success';
  } else if (combined.includes('warning') || combined.includes('alert')) {
    toastType = 'warning';
  }

  triggerGlobalToast({
    type: toastType,
    title,
    message: fullMessage,
  });

  // Execute single button callback if provided
  if (buttons && buttons.length === 1 && buttons[0].onPress) {
    buttons[0].onPress();
  }
};
