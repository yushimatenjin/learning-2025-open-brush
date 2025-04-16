import { Asset, Color, Entity, Texture, Vec3, Vec4 } from "playcanvas";
import { createDiamondHullMaterial } from "../../lib/brushes";
import { BrushMaterial } from "../../lib/brushes/diamond-hull/material";
import { loadAssets } from "../../lib/utils";
import { createScene } from "./scene";

// Define all required assets with proper paths
const assets = {
  diamond: new Asset("diamond", "container", { url: "./assets/diamond.glb" }, {}),
  mainTex: new Asset("diamond-hull-MainTex", "texture", { url: "./openbrush/brushes/DiamondHull-c8313697-2563-47fc-832e-290f4c04b901/DiamondHull-c8313697-2563-47fc-832e-290f4c04b901-v10.0-MainTex.png" }, {}),
};

const canvasElement = document.getElementById('application-canvas') as HTMLCanvasElement;

async function init() {
  try {
    const { root, app, light, camera: cameraEntity, OrbitCamera } = await createScene(canvasElement);
    await loadAssets(Object.values(assets), app.assets);
    const diamondHullConfig = {
      mainTex: assets.mainTex.resource as unknown as Texture,
      color: new Color(0, 0, 1.0, 1),
    };

    // カスタムシェーダーマテリアルを作成
    const diamondHullMaterial = createDiamondHullMaterial(app.graphicsDevice, diamondHullConfig) as BrushMaterial;


    const diamond = assets.diamond.resource.instantiateRenderEntity();
    root.addChild(diamond);
    diamond.setLocalScale(5, 5, 5);

    // ダイアモンドモデルの全てのメッシュインスタンスにカスタムマテリアルを適用
    const renders = diamond.findComponents("render");
    renders.forEach(function (render) {
      render.meshInstances.forEach(function (meshInstance) {
        meshInstance.material = diamondHullMaterial;
      });
    });

    let time = 0;
    // uTimeはvec2でdeltaTimeとtimeを渡す
    const timeUniform = app.graphicsDevice.scope.resolve('uTime');
    app.on('update', (dt: number) => {
      time += dt;
      timeUniform.setValue([time, dt]);
    });

  } catch (error) {
    console.error("Error initializing application:", error);
  }
}

export { init };
