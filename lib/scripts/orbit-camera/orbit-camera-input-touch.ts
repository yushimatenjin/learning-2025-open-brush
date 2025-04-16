// @ts-nocheck
import { Script, Vec3, Vec2, Camera, Touch, TouchEvent, EVENT_TOUCHSTART, EVENT_TOUCHEND, EVENT_TOUCHCANCEL, EVENT_TOUCHMOVE } from "playcanvas";


class OrbitCameraInputTouch extends Script {
  orbitSensitivity: number = 0.4;
  distanceSensitivity: number = 0.2;

  private orbitCamera: OrbitCamera;
  private lastTouchPoint: Vec2 = new Vec2();
  private lastPinchMidPoint: Vec2 = new Vec2();
  private lastPinchDistance: number = 0;

  static fromWorldPoint: Vec3 = new Vec3();
  static toWorldPoint: Vec3 = new Vec3();
  static worldDiff: Vec3 = new Vec3();
  static pinchMidPoint: Vec2 = new Vec2();

  initialize() {
    this.orbitCamera = this.entity.script?.scripts[0];

    if (this.orbitCamera && this.app.touch) {
      this.app.touch.on(EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
      this.app.touch.on(EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
      this.app.touch.on(EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);
      this.app.touch.on(EVENT_TOUCHMOVE, this.onTouchMove, this);

      this.on('destroy', () => {
        this.app.touch.off(EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
        this.app.touch.off(EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
        this.app.touch.off(EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);
        this.app.touch.off(EVENT_TOUCHMOVE, this.onTouchMove, this);
      });
    }
  }

  getPinchDistance(pointA: Touch, pointB: Touch): number {
    const dx = pointA.x - pointB.x;
    const dy = pointA.y - pointB.y;
    return Math.sqrt((dx * dx) + (dy * dy));
  }

  calcMidPoint(pointA: Touch, pointB: Touch, result: Vec2) {
    result.set(pointB.x - pointA.x, pointB.y - pointA.y);
    result.mulScalar(0.5);
    result.x += pointA.x;
    result.y += pointA.y;
  }

  onTouchStartEndCancel(event: TouchEvent) {
    const touches = event.touches;
    if (touches.length === 1) {
      this.lastTouchPoint.set(touches[0].x, touches[0].y);
    } else if (touches.length === 2) {
      this.lastPinchDistance = this.getPinchDistance(touches[0], touches[1]);
      this.calcMidPoint(touches[0], touches[1], this.lastPinchMidPoint);
    }
  }

  pan(midPoint: Vec2) {
    const fromWorldPoint = OrbitCameraInputTouch.fromWorldPoint;
    const toWorldPoint = OrbitCameraInputTouch.toWorldPoint;
    const worldDiff = OrbitCameraInputTouch.worldDiff;

    const camera = this.entity.camera as Camera;
    const distance = this.orbitCamera.distance;

    camera.screenToWorld(midPoint.x, midPoint.y, distance, fromWorldPoint);
    camera.screenToWorld(this.lastPinchMidPoint.x, this.lastPinchMidPoint.y, distance, toWorldPoint);

    worldDiff.sub2(toWorldPoint, fromWorldPoint);

    this.orbitCamera.pivotPoint.add(worldDiff);
  }

  onTouchMove(event: TouchEvent) {
    const pinchMidPoint = OrbitCameraInputTouch.pinchMidPoint;
    const touches = event.touches;

    if (touches.length === 1) {
      const touch = touches[0];
      this.orbitCamera.pitch -= (touch.y - this.lastTouchPoint.y) * this.orbitSensitivity;
      this.orbitCamera.yaw -= (touch.x - this.lastTouchPoint.x) * this.orbitSensitivity;
      this.lastTouchPoint.set(touch.x, touch.y);
    } else if (touches.length === 2) {
      const currentPinchDistance = this.getPinchDistance(touches[0], touches[1]);
      const diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
      this.lastPinchDistance = currentPinchDistance;

      this.orbitCamera.distance -= (diffInPinchDistance * this.distanceSensitivity * 0.1) * (this.orbitCamera.distance * 0.1);

      this.calcMidPoint(touches[0], touches[1], pinchMidPoint);
      this.pan(pinchMidPoint);
      this.lastPinchMidPoint.copy(pinchMidPoint);
    }
  }
}

export { OrbitCameraInputTouch };