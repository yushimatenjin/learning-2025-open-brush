import { Color, GraphicsDevice, PIXELFORMAT_R8_G8_B8_A8, ShaderMaterial, Texture } from 'playcanvas'; // Import pc namespace

/**
 * Type for DiamondHull material parameters based on OpenBrush/TiltBrush
 */
export type DiamondHullMaterialParams = {
  mainTex?: Texture | null;
  color: Color;
}

/**
 * Default values for DiamondHull material parameters based on OpenBrush
 */
export const DEFAULT_PARAMS: DiamondHullMaterialParams = {
  mainTex: null,
  color: new Color(1, 1, 1, 1),
};

/**
 * Applies parameters to the DiamondHull shader material
 * @param device - The graphics device
 * @param material - The shader material to apply parameters to
 * @param params - Parameters to apply
 */
export const applyMaterialParams = (
  device: GraphicsDevice,
  material: ShaderMaterial,
  params: DiamondHullMaterialParams
): void => {
  // Merge with default parameters, ensuring deep copies for objects
  const mergedParams: DiamondHullMaterialParams = {
    ...DEFAULT_PARAMS,
    ...params
  };

  // Create a 1x1 white texture to use as default
  const textureWhite = new Texture(device, {
    width: 1,
    height: 1,
    format: PIXELFORMAT_R8_G8_B8_A8,
    mipmaps: false
  });

  // Apply textures
  material.setParameter('uMainTex', mergedParams.mainTex || textureWhite);
  material.setParameter('uColor', [mergedParams.color.r, mergedParams.color.g, mergedParams.color.b, mergedParams.color.a]);
}; 
