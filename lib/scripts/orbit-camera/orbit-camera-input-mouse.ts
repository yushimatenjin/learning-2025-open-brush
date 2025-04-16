// @ts-nocheck
import { Script, Vec3, Vec2, Camera, Mouse, MouseEvent, MOUSEBUTTON_LEFT, MOUSEBUTTON_MIDDLE, MOUSEBUTTON_RIGHT, EVENT_MOUSEDOWN, EVENT_MOUSEUP, EVENT_MOUSEMOVE, EVENT_MOUSEWHEEL } from "playcanvas";
class OrbitCameraInputMouse extends Script {
  orbitSensitivity: number = 0.3;
  distanceSensitivity: number = 0.15;

  private orbitCamera: any;
  private lookButtonDown: boolean = false;
  private panButtonDown: boolean = false;
  private lastPoint: Vec2 = new Vec2();

  static fromWorldPoint: Vec3 = new Vec3();
  static toWorldPoint: Vec3 = new Vec3();
  static worldDiff: Vec3 = new Vec3();

  initialize() {
    this.orbitCamera = this.entity.script?.scripts[0];
    if (this.orbitCamera) {
      const onMouseOut = (e: MouseEvent) => this.onMouseOut(e);
      this.app.mouse.on(EVENT_MOUSEDOWN, this.onMouseDown, this);
      this.app.mouse.on(EVENT_MOUSEUP, this.onMouseUp, this);
      this.app.mouse.on(EVENT_MOUSEMOVE, this.onMouseMove, this);
      this.app.mouse.on(EVENT_MOUSEWHEEL, this.onMouseWheel, this);

      window.addEventListener('mouseout', onMouseOut, false);

      this.on('destroy', () => {
        this.app.mouse.off(EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.off(EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.off(EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.off(EVENT_MOUSEWHEEL, this.onMouseWheel, this);

        window.removeEventListener('mouseout', onMouseOut, false);
      });
    }

    this.app.mouse.disableContextMenu();
  }

  pan(screenPoint: Vec2) {
    const fromWorldPoint = OrbitCameraInputMouse.fromWorldPoint;
    const toWorldPoint = OrbitCameraInputMouse.toWorldPoint;
    const worldDiff = OrbitCameraInputMouse.worldDiff;

    const camera = this.entity.camera;
    const distance = this.orbitCamera.distance;

    camera.screenToWorld(screenPoint.x, screenPoint.y, distance, fromWorldPoint);
    camera.screenToWorld(this.lastPoint.x, this.lastPoint.y, distance, toWorldPoint);

    worldDiff.sub2(toWorldPoint, fromWorldPoint);

    this.orbitCamera.pivotPoint.add(worldDiff);
  }

  onMouseDown(event: MouseEvent) {
    switch (event.button) {
      case MOUSEBUTTON_LEFT:
        this.lookButtonDown = true;
        break;
      case MOUSEBUTTON_MIDDLE:
      case MOUSEBUTTON_RIGHT:
        this.panButtonDown = true;
        break;
    }
  }

  onMouseUp(event: MouseEvent) {
    switch (event.button) {
      case MOUSEBUTTON_LEFT:
        this.lookButtonDown = false;
        break;
      case MOUSEBUTTON_MIDDLE:
      case MOUSEBUTTON_RIGHT:
        this.panButtonDown = false;
        break;
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.lookButtonDown) {
      this.orbitCamera.pitch -= event.dy * this.orbitSensitivity;
      this.orbitCamera.yaw -= event.dx * this.orbitSensitivity;
    } else if (this.panButtonDown) {
      this.pan(event);
    }

    this.lastPoint.set(event.x, event.y);
  }

  onMouseWheel(event: MouseEvent) {
    this.orbitCamera.distance -= -event.wheelDelta * this.distanceSensitivity * (this.orbitCamera.distance * 0.1);
    event.event.preventDefault();
  }

  onMouseOut(event: MouseEvent) {
    this.lookButtonDown = false;
    this.panButtonDown = false;
  }
}

export { OrbitCameraInputMouse };