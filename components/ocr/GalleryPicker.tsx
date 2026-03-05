import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { i18n } from '../../locales/i18n';

/**
 * Launches the system gallery picker and returns the selected image URI.
 * Returns null if the user cancels or permission is denied.
 */
export async function pickFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('scan.permissionGallery'));
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    allowsEditing: false,
    base64: false,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0]?.uri ?? null;
}
