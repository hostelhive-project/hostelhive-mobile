import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { showDialog } from './dialog';

/**
 * Normalizes an ImagePicker asset and creates a robust cross-platform FormData
 * object suitable for the HostelHive backend (/api/upload/image).
 */
export async function createUploadFormData(
  asset: ImagePicker.ImagePickerAsset,
  folder: string = '/cnic'
): Promise<FormData> {
  const formData = new FormData();
  let uri = asset.uri;

  // On Android, ensure URI has a proper scheme for native OkHttp file reading
  // If URI already starts with a scheme (file://, content://, or any other scheme), preserve it.
  // Only prepend file:// if the URI is a raw local filesystem path starting with '/'
  if (Platform.OS === 'android') {
    if (!uri.includes('://') && uri.startsWith('/')) {
      uri = `file://${uri}`;
    }
  }

  // Extract base filename without query string
  let rawName = asset.fileName || uri.split('/').pop() || `upload_${Date.now()}.jpg`;
  rawName = rawName.split('?')[0];

  const extMatch = /\.(\w+)$/.exec(rawName);
  let ext = extMatch ? extMatch[1].toLowerCase() : '';

  // Determine safe, allowed MIME type
  let mimeType = asset.mimeType?.toLowerCase();
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!mimeType || !allowedMime.includes(mimeType)) {
    if (ext === 'png') {
      mimeType = 'image/png';
    } else if (ext === 'webp') {
      mimeType = 'image/webp';
    } else {
      // Common mobile fallback for camera/gallery (including HEIC converted by expo)
      mimeType = 'image/jpeg';
      ext = 'jpg';
    }
  }

  // Ensure filename has an allowed extension matching MIME type
  let filename = rawName;
  if (!/\.(jpe?g|png|webp)$/i.test(filename)) {
    const validExt = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    if (filename.includes('.')) {
      filename = filename.replace(/\.[^/.]+$/, `.${validExt}`);
    } else {
      filename = `${filename}.${validExt}`;
    }
  }

  if (Platform.OS === 'web') {
    // For Web, fetch the blob from uri and append as Blob
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('image', blob, filename);
    } catch {
      if ((asset as any).file) {
        formData.append('image', (asset as any).file, filename);
      }
    }
  } else {
    // For React Native (Android / iOS), append React Native file descriptor object
    formData.append('image', {
      uri,
      name: filename,
      type: mimeType,
    } as any);
  }

  formData.append('folder', folder);
  return formData;
}

/**
 * Capture a photo using the device camera.
 * Automatically checks and requests camera permissions.
 */
export async function captureImageFromCamera(
  options?: ImagePicker.ImagePickerOptions
): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showDialog(
        'Camera Permission Required',
        'Please enable camera permissions in your device settings to take photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      ...options,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (err: any) {
    showDialog('Camera Error', err?.message || 'Unable to open camera. Please try again.');
    return null;
  }
}

/**
 * Select a photo from the device media gallery.
 * Automatically checks and requests gallery permissions.
 */
export async function pickImageFromGallery(
  options?: ImagePicker.ImagePickerOptions
): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showDialog(
        'Gallery Permission Required',
        'Please enable media library permissions in your device settings to select photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      ...options,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (err: any) {
    showDialog('Gallery Error', err?.message || 'Unable to open gallery. Please try again.');
    return null;
  }
}

export interface PromptImageSourceOptions {
  title?: string;
  message?: string;
  pickerOptions?: ImagePicker.ImagePickerOptions;
  onImageSelected: (asset: ImagePicker.ImagePickerAsset) => void | Promise<void>;
}

/**
 * Prompts the user to choose between Camera or Gallery, then executes the selection callback.
 * Silently handles cancellation.
 */
export function promptImageSource({
  title = 'Select Photo',
  message = 'Choose how you want to upload this photo:',
  pickerOptions,
  onImageSelected,
}: PromptImageSourceOptions): void {
  Alert.alert(title, message, [
    {
      text: 'Take Photo',
      onPress: async () => {
        const asset = await captureImageFromCamera(pickerOptions);
        if (asset) {
          await onImageSelected(asset);
        }
      },
    },
    {
      text: 'Choose from Gallery',
      onPress: async () => {
        const asset = await pickImageFromGallery(pickerOptions);
        if (asset) {
          await onImageSelected(asset);
        }
      },
    },
    {
      text: 'Cancel',
      style: 'cancel',
    },
  ]);
}
