import {
  ADDRESS_REPEAT,
  FILTER_LINEAR,
  FILTER_NEAREST_MIPMAP_LINEAR,
  PIXELFORMAT_SRGBA8,
  Texture,
  Asset
} from 'playcanvas';

/**
 * Creates a texture array from a list of PlayCanvas textures
 * @param device - The graphics device
 * @param textures - Array of textures to combine
 * @returns The created texture array
 */
export const createTextureArray = (device: any, textures: Texture[]): Texture => {
  const sources = textures.map(texture => texture.getSource());

  const textureArray = new Texture(device, {
    name: 'HatchTextureArray',
    format: PIXELFORMAT_SRGBA8,
    width: textures[0].width,
    height: textures[0].height,
    arrayLength: textures.length,
    magFilter: FILTER_LINEAR,
    minFilter: FILTER_NEAREST_MIPMAP_LINEAR,
    mipmaps: true,
    anisotropy: 16,
    addressU: ADDRESS_REPEAT,
    addressV: ADDRESS_REPEAT,
    levels: [sources as any]
  });

  textureArray.upload();
  return textureArray;
};

