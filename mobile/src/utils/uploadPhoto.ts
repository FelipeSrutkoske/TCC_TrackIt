import * as ImageManipulator from 'expo-image-manipulator';
import { ImagePickerAsset } from 'expo-image-picker';

const PHOTO_MAX_WIDTH = 1280;
const PHOTO_COMPRESS_QUALITY = 0.55;

export type PreparedUploadPhoto = {
  dataUri: string;
  previewUri: string;
};

export async function prepareUploadPhoto(asset: Pick<ImagePickerAsset, 'uri' | 'width'>): Promise<PreparedUploadPhoto | null> {
  const actions = asset.width > PHOTO_MAX_WIDTH ? [{ resize: { width: PHOTO_MAX_WIDTH } }] : [];
  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    base64: true,
    compress: PHOTO_COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!result.base64) {
    return null;
  }

  return {
    dataUri: `data:image/jpeg;base64,${result.base64}`,
    previewUri: result.uri,
  };
}
