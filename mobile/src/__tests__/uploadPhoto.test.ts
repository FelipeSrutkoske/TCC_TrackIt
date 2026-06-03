jest.mock('expo-image-manipulator', () => ({
  SaveFormat: {
    JPEG: 'jpeg',
  },
  manipulateAsync: jest.fn(async () => ({
    base64: 'compressed-base64',
    uri: 'file://compressed.jpg',
  })),
}));

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { prepareUploadPhoto } from '../utils/uploadPhoto';

describe('prepareUploadPhoto', () => {
  it('redimensiona e comprime a foto antes de montar o data URI', async () => {
    const photo = await prepareUploadPhoto({
      uri: 'file://original.jpg',
      width: 4000,
    });

    expect(manipulateAsync).toHaveBeenCalledWith(
      'file://original.jpg',
      [{ resize: { width: 1280 } }],
      {
        base64: true,
        compress: 0.55,
        format: SaveFormat.JPEG,
      },
    );
    expect(photo).toEqual({
      dataUri: 'data:image/jpeg;base64,compressed-base64',
      previewUri: 'file://compressed.jpg',
    });
  });
});
