/**
 * Utility functions for asset management
 */

import { Asset, AssetListLoader } from "playcanvas";

/**
 * Creates an asset list loader instance
 */
export const createAssetListLoader = (assets: Asset[], assetRegistry: any) => {
  return new AssetListLoader(assets, assetRegistry);
};

/**
 * Loads an asset list loader and returns a promise
 */
export const loadWithAssetLoader = (assetListLoader: AssetListLoader, assetsCount: number) => {
  return new Promise<void>((resolve, reject) => {
    assetListLoader.load((err, failed) => {
      if (err) {
        console.error(`${failed.length} assets failed to load`);
        reject(err);
      } else {
        console.log(`${assetsCount} assets loaded`);
        resolve();
      }
    });
  });
};

/**
 * Loads assets using a Promise-based wrapper around AssetListLoader
 */
export const loadAssets = (assets: Asset[], assetRegistry: any) => {
  const assetListLoader = createAssetListLoader(assets, assetRegistry);
  return loadWithAssetLoader(assetListLoader, assets.length);
}; 