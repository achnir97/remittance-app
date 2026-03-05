import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export async function prepareImageForOCR(uri: string): Promise<{
  base64: string;
  localPath: string;
  mediaType: 'image/jpeg';
}> {
  // Resize to max 1024px width, compress to JPEG
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  // Save local copy using UUID (collision-safe)
  const uuid = Crypto.randomUUID();
  const dir = `${FileSystem.documentDirectory}receipts/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const localPath = `${dir}${uuid}.jpg`;
  await FileSystem.copyAsync({ from: resized.uri, to: localPath });

  return { base64: resized.base64!, localPath, mediaType: 'image/jpeg' };
}

export async function readImageAsBase64(localPath: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(localPath);
  if (!info.exists) throw new Error(`Image not found: ${localPath}`);
  return FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function deleteLocalImage(localPath: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    await FileSystem.deleteAsync(localPath, { idempotent: true });
  }
}
