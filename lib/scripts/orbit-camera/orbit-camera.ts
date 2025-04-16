// @ts-nocheck
import { Script, Entity, Vec3, BoundingBox, Quat, Camera, Application, math } from "playcanvas";

class OrbitCamera extends Script {
  distanceMax: number = 0;
  distanceMin: number = 0;
  pitchAngleMax: number = 90;
  pitchAngleMin: number = -90;
  inertiaFactor: number = 0.2;
  focusEntity: Entity | null = null;
  frameOnStart: boolean = true;

  private _targetDistance: number = 0;
  private _targetYaw: number = 0;
  private _targetPitch: number = 0;
  private _yaw: number = 0;
  private _pitch: number = 0;
  private _distance: number = 0;
  private _pivotPoint: Vec3 = new Vec3();
  private _modelsAabb: BoundingBox = new BoundingBox();

  static quatWithoutYaw: Quat = new Quat();
  static yawOffset: Quat = new Quat();
  static distanceBetween: Vec3 = new Vec3();

  initialize() {
    const onWindowResize = () => this._checkAspectRatio();
    window.addEventListener('resize', onWindowResize, false);

    this._checkAspectRatio();

    this._modelsAabb = new BoundingBox(new Vec3(1, 1.2, 0), new Vec3(1, 0.25, 0.1));
    this._buildAabb(this.focusEntity || this.app.root);

    this.entity.lookAt(this._modelsAabb.center);

    this._pivotPoint = new Vec3();
    this._pivotPoint.copy(this._modelsAabb.center);

    const cameraQuat = this.entity.getRotation();

    this._yaw = this._calcYaw(cameraQuat);
    this._pitch = this._clampPitchAngle(this._calcPitch(cameraQuat, this._yaw));
    this.entity.setLocalEulerAngles(this._pitch, this._yaw, 0);

    this._distance = 0;

    this._targetYaw = this._yaw;
    this._targetPitch = this._pitch;

    if (this.frameOnStart) {
      this.focus(this.focusEntity || this.app.root);
    } else {
      const distanceBetween = new Vec3();
      distanceBetween.sub2(this.entity.getPosition(), this._pivotPoint);
      this._distance = this._clampDistance(distanceBetween.length());
    }

    this._targetDistance = this._distance;

    this.on('attr:distanceMin', (value: number) => {
      this._distance = this._clampDistance(this._distance);
    });

    this.on('attr:distanceMax', (value: number) => {
      this._distance = this._clampDistance(this._distance);
    });

    this.on('attr:pitchAngleMin', (value: number) => {
      this._pitch = this._clampPitchAngle(this._pitch);
    });

    this.on('attr:pitchAngleMax', (value: number) => {
      this._pitch = this._clampPitchAngle(this._pitch);
    });

    this.on('attr:focusEntity', (value: Entity) => {
      if (this.frameOnStart) {
        this.focus(value || this.app.root);
      } else {
        this.resetAndLookAtEntity(this.entity.getPosition(), value || this.app.root);
      }
    });

    this.on('attr:frameOnStart', (value: boolean) => {
      if (value) {
        this.focus(this.focusEntity || this.app.root);
      }
    });

    this.on('destroy', () => {
      window.removeEventListener('resize', onWindowResize, false);
    });
  }

  update(dt: number) {
    const t = this.inertiaFactor === 0 ? 1 : Math.min(dt / this.inertiaFactor, 1);
    this._distance = math.lerp(this._distance, this._targetDistance, t);
    this._yaw = math.lerp(this._yaw, this._targetYaw, t);
    this._pitch = math.lerp(this._pitch, this._targetPitch, t);

    this._updatePosition();
  }

  focus(focusEntity: Entity) {
    this._buildAabb(focusEntity);

    const halfExtents = this._modelsAabb.halfExtents;
    const radius = Math.max(halfExtents.x, Math.max(halfExtents.y, halfExtents.z));

    this.distance = (radius * 1.5) / Math.sin(0.5 * this.entity.camera.fov * math.DEG_TO_RAD);

    this._removeInertia();

    this._pivotPoint.copy(this._modelsAabb.center);
  }

  resetAndLookAtPoint(resetPoint: Vec3, lookAtPoint: Vec3) {
    this.pivotPoint.copy(lookAtPoint);
    this.entity.setPosition(resetPoint);

    this.entity.lookAt(lookAtPoint);

    const distance = OrbitCamera.distanceBetween;
    distance.sub2(lookAtPoint, resetPoint);
    this.distance = distance.length();

    this.pivotPoint.copy(lookAtPoint);

    const cameraQuat = this.entity.getRotation();
    this.yaw = this._calcYaw(cameraQuat);
    this.pitch = this._calcPitch(cameraQuat, this.yaw);

    this._removeInertia();
    this._updatePosition();
  }

  resetAndLookAtEntity(resetPoint: Vec3, entity: Entity) {
    this._buildAabb(entity);
    this.resetAndLookAtPoint(resetPoint, this._modelsAabb.center);
  }

  reset(yaw: number, pitch: number, distance: number) {
    this.pitch = pitch;
    this.yaw = yaw;
    this.distance = distance;

    this._removeInertia();
  }

  get distance(): number {
    return this._targetDistance;
  }

  set distance(value: number) {
    this._targetDistance = this._clampDistance(value);
  }

  get pitch(): number {
    return this._targetPitch;
  }

  set pitch(value: number) {
    this._targetPitch = this._clampPitchAngle(value);
  }

  get yaw(): number {
    return this._targetYaw;
  }

  set yaw(value: number) {
    this._targetYaw = value;

    const diff = this._targetYaw - this._yaw;
    const reminder = diff % 360;
    if (reminder > 180) {
      this._targetYaw = this._yaw - (360 - reminder);
    } else if (reminder < -180) {
      this._targetYaw = this._yaw + (360 + reminder);
    } else {
      this._targetYaw = this._yaw + reminder;
    }
  }

  get pivotPoint(): Vec3 {
    return this._pivotPoint;
  }

  set pivotPoint(value: Vec3) {
    this._pivotPoint.copy(value);
  }

  private _updatePosition() {
    this.entity.setLocalPosition(0, 0, 0);
    this.entity.setLocalEulerAngles(this._pitch, this._yaw, 0);

    const position = this.entity.getPosition();
    position.copy(this.entity.forward);
    position.mulScalar(-this._distance);
    position.add(this.pivotPoint);
    this.entity.setPosition(position);
  }

  private _removeInertia() {
    this._yaw = this._targetYaw;
    this._pitch = this._targetPitch;
    this._distance = this._targetDistance;
  }

  private _checkAspectRatio() {
    const height = (this.app as Application).graphicsDevice.height;
    const width = (this.app as Application).graphicsDevice.width;

    this.entity.camera.horizontalFov = height > width;
  }

  private _buildAabb(entity: Entity) {
    const meshInstances: any[] = [];

    const renders = entity.findComponents("render");
    for (const render of renders) {
      meshInstances.push(...render.meshInstances);
    }

    const models = entity.findComponents("model");
    for (const model of models) {
      meshInstances.push(...model.meshInstances);
    }

    for (let i = 0; i < meshInstances.length; i++) {
      if (i === 0) {
        this._modelsAabb.copy(meshInstances[i].aabb);
      } else {
        this._modelsAabb.add(meshInstances[i].aabb);
      }
    }
  }

  private _calcYaw(quat: Quat): number {
    const transformedForward = new Vec3();
    quat.transformVector(Vec3.FORWARD, transformedForward);

    return Math.atan2(-transformedForward.x, -transformedForward.z) * math.RAD_TO_DEG;
  }

  private _clampDistance(distance: number): number {
    if (this.distanceMax > 0) {
      return math.clamp(distance, this.distanceMin, this.distanceMax);
    }
    return Math.max(distance, this.distanceMin);
  }

  private _clampPitchAngle(pitch: number): number {
    return math.clamp(pitch, -this.pitchAngleMax, -this.pitchAngleMin);
  }

  private _calcPitch(quat: Quat, yaw: number): number {
    const quatWithoutYaw = OrbitCamera.quatWithoutYaw;
    const yawOffset = OrbitCamera.yawOffset;

    yawOffset.setFromEulerAngles(0, -yaw, 0);
    quatWithoutYaw.mul2(yawOffset, quat);

    const transformedForward = new Vec3();

    quatWithoutYaw.transformVector(Vec3.FORWARD, transformedForward);

    return Math.atan2(transformedForward.y, -transformedForward.z) * math.RAD_TO_DEG;
  }
}

export { OrbitCamera };