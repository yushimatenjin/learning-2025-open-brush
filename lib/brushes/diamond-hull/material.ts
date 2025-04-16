import {
  GraphicsDevice,
  SEMANTIC_NORMAL,
  SEMANTIC_POSITION,
  SEMANTIC_TEXCOORD0,
  SEMANTIC_COLOR,
  ShaderMaterial,
  CULLFACE_BACK,
  BLEND_NORMAL,
  FUNC_LESSEQUAL,
} from 'playcanvas';
import { fragmentShader } from './fragment';
import { vertexShader } from './vertex';
import { applyMaterialParams, DiamondHullMaterialParams } from './params';

/**
 * OpenBrushマテリアルのインターフェース拡張
 */
export interface BrushMaterial extends ShaderMaterial { }

/**
 * DiamondHullブラシマテリアルを作成する
 * @param device - PlayCanvasのグラフィックデバイス
 * @param params - マテリアルのパラメータ
 * @returns 生成されたDiamondHullマテリアル
 */
const createDiamondHullMaterial = (device: GraphicsDevice, params: DiamondHullMaterialParams): ShaderMaterial => {
  const material = new ShaderMaterial({
    uniqueName: 'DiamondHullShader-' + Math.random().toString(36).substring(2, 15),
    vertexCode: vertexShader,
    fragmentCode: fragmentShader,
    attributes: {
      aPosition: SEMANTIC_POSITION,
      aNormal: SEMANTIC_NORMAL,
      aUv0: SEMANTIC_TEXCOORD0,
      aColor: SEMANTIC_COLOR,
    }
  }) as BrushMaterial;

  material.blendType = BLEND_NORMAL;

  // 深度設定
  material.depthTest = true;
  material.depthWrite = false;
  material.depthFunc = FUNC_LESSEQUAL;

  // カリング設定
  material.cull = CULLFACE_BACK;

  // パラメータの適用
  applyMaterialParams(device, material, params);
  return material;
};


export { createDiamondHullMaterial };
