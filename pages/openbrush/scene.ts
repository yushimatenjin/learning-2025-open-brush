import {
  AnimationComponentSystem,
  AnimationHandler,
  AnimClipHandler,
  AnimComponentSystem,
  AnimStateGraphHandler,
  AppBase,
  AppOptions,
  AudioHandler,
  AudioListenerComponentSystem,
  BinaryHandler,
  ButtonComponentSystem,
  CameraComponentSystem,
  CollisionComponentSystem,
  ContainerHandler,
  createGraphicsDevice,
  CssHandler,
  CubemapHandler,
  ElementComponentSystem,
  Entity,
  FILLMODE_FILL_WINDOW,
  FolderHandler,
  FontHandler,
  GSplatComponentSystem,
  GSplatHandler,
  HierarchyHandler,
  HtmlHandler,
  JointComponentSystem,
  JsonHandler,
  Keyboard,
  LayoutChildComponentSystem,
  LayoutGroupComponentSystem,
  LightComponentSystem,
  MaterialHandler,
  ModelComponentSystem,
  ModelHandler,
  ParticleSystemComponentSystem,
  RenderComponentSystem,
  RenderHandler,
  RESOLUTION_AUTO,
  RigidBodyComponentSystem,
  SceneHandler,
  ScreenComponentSystem,
  ScriptComponentSystem,
  ScriptHandler,
  ScrollbarComponentSystem,
  ScrollViewComponentSystem,
  ShaderHandler,
  SoundComponentSystem,
  SpriteComponentSystem,
  SpriteHandler,
  TemplateHandler,
  TextHandler,
  TextureAtlasHandler,
  TextureHandler,
  ZoneComponentSystem,
  Mouse,
  TouchDevice,
  Color
} from "playcanvas";
import { OrbitCameraInputMouse, OrbitCameraInputTouch, OrbitCamera } from "../../lib/scripts/orbit-camera";
export const createScene = async (canvas: HTMLCanvasElement) => {
  const gfxOptions = {
    deviceTypes: ["webgl2"],
    glslangUrl: "./glslang/glslang.js",
    twgslUrl: "./twgsl/twgsl.js",
  };

  const device = await createGraphicsDevice(canvas, gfxOptions);
  device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);
  const createOptions = new AppOptions();
  createOptions.graphicsDevice = device;
  createOptions.keyboard = new Keyboard(canvas);
  createOptions.mouse = new Mouse(canvas);
  createOptions.touch = new TouchDevice(canvas);

  createOptions.componentSystems = [
    RigidBodyComponentSystem,
    CollisionComponentSystem,
    JointComponentSystem,
    AnimationComponentSystem,
    AnimComponentSystem,
    ModelComponentSystem,
    RenderComponentSystem,
    CameraComponentSystem,
    LightComponentSystem,
    ScriptComponentSystem,
    SoundComponentSystem,
    AudioListenerComponentSystem,
    ParticleSystemComponentSystem,
    ScreenComponentSystem,
    ElementComponentSystem,
    ButtonComponentSystem,
    ScrollViewComponentSystem,
    ScrollbarComponentSystem,
    SpriteComponentSystem,
    LayoutGroupComponentSystem,
    LayoutChildComponentSystem,
    ZoneComponentSystem,
    GSplatComponentSystem,
  ];

  createOptions.resourceHandlers = [
    RenderHandler,
    AnimationHandler,
    AnimClipHandler,
    AnimStateGraphHandler,
    ModelHandler,
    MaterialHandler,
    TextureHandler,
    TextHandler,
    JsonHandler,
    AudioHandler,
    ScriptHandler,
    SceneHandler,
    CubemapHandler,
    HtmlHandler,
    CssHandler,
    ShaderHandler,
    HierarchyHandler,
    FolderHandler,
    FontHandler,
    BinaryHandler,
    TextureAtlasHandler,
    SpriteHandler,
    TemplateHandler,
    ContainerHandler,
    GSplatHandler,
  ].filter(Boolean);

  const app = new AppBase(canvas);
  app.init(createOptions);

  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  window.addEventListener("resize", () => app.resizeCanvas());

  const camera = new Entity("Camera");
  camera.addComponent("camera", {
    clearColor: new Color(0.3, 0.3, 0.3, 1),
  });
  camera.setPosition(0, 0, 0);

  camera.addComponent("script");
  camera.script?.create(OrbitCamera);
  camera.script?.create(OrbitCameraInputMouse);
  camera.script?.create(OrbitCameraInputTouch);

  app.root.addChild(camera);

  const light = new Entity("Light");
  light.addComponent("light");
  app.root.addChild(light);
  light.setEulerAngles(45, 0, 0);

  app.start();
  return { canvas, app, root: app.root, light, camera, OrbitCamera };
};