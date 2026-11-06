import AsyncStorage from '@react-native-async-storage/async-storage';

// IDs only, scoped to the signed-in account. No payment credentials are stored.
export async function rememberCheckout(userId: string | undefined, invoiceId: string) {
  if (userId) await AsyncStorage.setItem(`hostelhive.checkout.${userId}`, invoiceId);
}

export async function readCheckout(userId: string | undefined) {
  if (!userId) return null;
  const id = await AsyncStorage.getItem(`hostelhive.checkout.${userId}`);
  return id && /^[a-f\d]{24}$/i.test(id) ? id : null;
}
