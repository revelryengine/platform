import { System    } from 'revelryengine/ecs/lib/system.js';
import { Model     } from 'revelryengine/ecs/lib/model.js';
import { WeakCache } from 'revelryengine/ecs/lib/utils/weak-cache.js';
import { importUMD } from './utils/import-umd.js';
import { vec2, vec3, vec4, mat4, quat } from '../deps/gl-matrix.js';

const PhysXFactory = async () => {
    const url = import.meta.resolve('physx-js-webidl');
    return importUMD(url).then(async ({ PhysX }) => PhysX({ locateFile: () => new URL('./physx-js-webidl.wasm', url).toString() }));
}


// const DEBUG_DRAW_SHAPE_BIT          = 0x0001;
// const DEBUG_DRAW_JOINT_BIT          = 0x0002;
// const DEBUG_DRAW_AABB_BIT           = 0x0004;
// const DEBUG_DRAW_PAIR_BIT           = 0x0008;
// const DEBUG_DRAW_CENTER_OF_MASS_BIT = 0x0010;

/**
 * @typedef {import('revelryengine/ecs/lib/component.js').ComponentTypesDefinition} ComponentTypesDefinition
 */

/**
 * @typedef {{ readonly offset?: { x: number, y: number } }} Shape
 * @typedef {Shape & { readonly type: 'circle', radius: number }} CircleShape
 * @typedef {Shape & { readonly type: 'box', width: number, height: number }} BoxShape
 * @typedef {Shape & { readonly type: 'polygon', vertices: [number, number][] }} PolygonShape
 */

/**
 * @typedef {{ readonly body: string, readonly anchor1?: [number, number], readonly anchor2?: [number, number], readonly collideConnected?: boolean }} JointConstraint
 * @typedef {JointConstraint & {  readonly type: 'distance', length: number, stiffness?: number, damping?: number }} DistanceJointConstraint
 * @typedef {JointConstraint & ({ readonly type: 'revolute' } & ({ enableLimit: false | undefined } | { enableLimit: true, lowerAngle: number, upperAngle: number }) & ({ enableMotor: false | undefined } | { enableMotor: true, maxMotorTorque: number, motorSpeed: number })) } RevoluteJointConstraint
 */

/**
 * @typedef {{
 *     worldPhysics: { value: { gravity: [number, number, number], debugDraw?: string } },
 *     rigidBody: { value: {
 *          type:          'static'|'kinematic'|'dynamic',
 *          density:       number,
 *          friction:      number,
 *          restitution:   number,
 *          bullet?:       boolean,
 *          enabled?:      boolean,
 *          gravityScale?: number,
 *          allowSleep?:   boolean,
 *     } },
 *     collisionShapes:  { value: (CircleShape | BoxShape | PolygonShape)[] },
 *     jointConstraints: { value: (DistanceJointConstraint | RevoluteJointConstraint)[] },
 *     velocity: { value: [number, number, number] },
 * } &import('./game-object.js').ComponentTypes } ComponentTypes
 */

const types = /** @type {ComponentTypes} */({});
const TypedModel  = Model.Typed(types);
const TypedSystem = System.Typed(types);

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {import('revelryengine/ecs/lib/component.js').ComponentData<T, K>} ComponentData
 */

/**
 * @template {ComponentTypesDefinition} [T = ComponentTypesDefinition]
 * @template {Extract<keyof T, string>} [K = Extract<keyof T, string>]
 * @typedef {import('revelryengine/ecs/lib/component.js').ComponentJSON<T, K>} ComponentJSON
 */

/**
 * @template {Extract<keyof ComponentTypes, string>} [K = Extract<keyof ComponentTypes, string>]
 * @typedef {import('revelryengine/ecs/lib/component.js').ComponentReference<ComponentTypes, K>} ComponentReference
 */


export class WorldPhysicsModel extends TypedModel({
    components: {
        world: { type: 'worldPhysics' },
    }
}) { }

export class CollisionShapeModel extends TypedModel({
    components: {
        transform:       { type: 'transform'   },
        collisionShapes: { type: 'collisionShapes' },
    }
}) { }

export class RigidBodyModel extends TypedModel({
    components: {
        transform:       { type: 'transform'       },
        collisionShapes: { type: 'collisionShapes' },
        rigidBody:       { type: 'rigidBody'       },
    }
}) { }

export class KinematicRigidBodyModel extends TypedModel({
    components: {
        transform:       { type: 'transform'       },
        collisionShapes: { type: 'collisionShapes' },
        rigidBody:       { type: 'rigidBody'       },
        velocity:        { type: 'velocity'        },
    }
}) {}

export class JointConstraintModel extends TypedModel({
    components: {
        transform:        { type: 'transform'        },
        rigidBody:        { type: 'rigidBody'        },
        jointConstraints: { type: 'jointConstraints' },
    }
}) {

    /**
    * @param {import('revelryengine/ecs/lib/stage.js').Stage<ComponentTypes>} stage
    * @param {string} entity
    */
    constructor(stage, entity) {
        super(stage, entity);

        this.#resolveJointRelationships();
        this.watch('jointConstraints:change', () => this.#resolveJointRelationships());
    }

    /** @type {ComponentReference<'rigidBody'>[]} */
    #jointRefs = [];

    async #resolveJointRelationships() {
        this.cleanup();

        for(const jointConstraint of this.jointConstraints) {
            const { body } = jointConstraint;
            const jointRef = this.stage.components.references.add(this.entity, { entity: body, type: 'rigidBody' });

            this.#jointRefs.push(jointRef);
        }

        await Promise.all(this.#jointRefs.map(ref => ref.state === 'pending' && ref.waitFor('resolve')));

        this.notify('joints:resolve');
    }

    cleanup() {
        for(const ref of this.#jointRefs) {
            ref.release();
        }

        this.#jointRefs.length = 0;
    }

}

const PhysXPromise = PhysXFactory();

export class PhysicsSystem extends TypedSystem({
    models: {
        world:            { model: WorldPhysicsModel                    },
        rigidBodies:      { model: RigidBodyModel,          isSet: true },
        kinematicBodies:  { model: KinematicRigidBodyModel, isSet: true },
        jointConstraints: { model: JointConstraintModel,    isSet: true },
    }
}) {
    id = 'physics2d';

    #physics = {}

    /** @type {Box2D.b2World|null} */
    #world = null;

    /** @type {Map<string, Box2D.b2Body>} */
    #bodies = new Map();

    #velocities = new Map();

    /**
     * @param {WorldPhysicsModel|RigidBodyModel|KinematicRigidBodyModel|JointConstraintModel} model
     */
    async onModelAdd(model) {
        const PhysX = await PhysXPromise;

        if(model instanceof WorldPhysicsModel) {
            this.createPhysicsWorld(model);
        } else if(model instanceof RigidBody2dModel && this.#world) {
            const bodyDef = new Box2D.b2BodyDef();
            switch(model.rigidBody2d.type) {
                case 'static':
                    bodyDef.set_type(Box2D.b2_staticBody);
                    break;
                case 'kinematic':
                    bodyDef.set_type(Box2D.b2_kinematicBody);
                    break;
                case 'dynamic':
                    bodyDef.set_type(Box2D.b2_dynamicBody);
                    break;
            }

            const translation = model.transform.getWorldTranslation();
            const scale       = model.transform.getWorldScale();

            bodyDef.set_position(new Box2D.b2Vec2(translation[0], translation[1]));

            const body = this.#world.CreateBody(bodyDef);

            for(const collisionShape of model.collisionShapes2d) {
                const offset      = collisionShape.offset ?? { x: 0, y: 0 };
                const b2Offset    = new Box2D.b2Vec2((offset.x ?? 0) * scale[0], (offset.y ?? 0) * scale[1]);

                let shape;
                switch(collisionShape.type) {
                    case 'circle':
                        shape = new Box2D.b2CircleShape();
                        shape.set_m_radius((collisionShape.radius ?? 1) * scale[0]);
                        shape.set_m_p(b2Offset);
                        break
                    case 'box':
                        shape = new Box2D.b2PolygonShape();
                        shape.SetAsBox((collisionShape.width ?? 1) * scale[0] / 2, (collisionShape.height ?? 1) * scale[1] / 2, b2Offset, 0);
                        break;
                    case 'polygon':
                        shape = new Box2D.b2PolygonShape();
                        shape.set_m_centroid(b2Offset);
                        break;
                }

                const fixtureDef = new Box2D.b2FixtureDef();
                fixtureDef.shape       = shape;
                fixtureDef.density     = model.rigidBody2d.density;
                fixtureDef.friction    = model.rigidBody2d.friction;
                fixtureDef.restitution = model.rigidBody2d.restitution;

                body.CreateFixture(fixtureDef);
            }

            this.#bodies.set(model.entity, body);
        } else if(model instanceof JointConstraint2dModel) {
            model.watch('joints:resolve', () => this.#reconcileJointConstraints(Box2D, model));
        } else if(model instanceof KinematicRigidBody2dModel) {
            this.#velocities.set(model.entity, new Box2D.b2Vec2(0, 0));
        }
    }

    /**
     * @param {WorldPhysicsModel} model
     */
    async createPhysicsWorld(model) {
        const PhysX = await PhysXPromise;
    }

    async createRigidBody(model) {
        const PhysX = await PhysXPromise;
    }

    /**
     * @type {WeakCache<{ jointDefs: ({ constraint: DistanceJointConstraint | RevoluteJointConstraint, joint: Box2D.b2Joint })[] }> }
     */
    #jointConstraints = new WeakCache();

    /**
     * @param {Box2D} Box2D
     * @param {JointConstraint2dModel} model
     */
    #reconcileJointConstraints(Box2D, model) {
        if(!this.#world) return console.warn('Physics2d World not created');

        const cache = this.#jointConstraints.ensure(model, () => ({ jointDefs: [] }));

        for(let i = 0; i < model.jointConstraints2d.length; i++) {
            const constraint = model.jointConstraints2d[i];

            if(cache.jointDefs[i]?.constraint !== constraint) {
                if(cache.jointDefs[i]) {
                    this.#world.DestroyJoint(cache.jointDefs[i].joint);
                }

                const bodyA = this.#bodies.get(model.entity);
                const bodyB = this.#bodies.get(constraint.body);

                if(!bodyA || !bodyB) throw new Error(`Joint constraint reference not found: ${constraint.body}`);

                let jointDef;
                switch(constraint.type) {
                    case 'distance':
                        jointDef = new Box2D.b2DistanceJointDef();
                        jointDef.set_damping(constraint.damping ?? 1);
                        jointDef.set_stiffness(constraint.stiffness ?? 1);
                        jointDef.set_length(constraint.length)
                        jointDef.Initialize(bodyA, bodyB, bodyA.GetWorldCenter(), bodyB.GetWorldCenter());
                        break;
                    case 'revolute':
                        jointDef = new Box2D.b2RevoluteJointDef();
                        if(constraint.enableLimit) {
                            jointDef.set_enableLimit(true);
                            jointDef.set_lowerAngle(constraint.lowerAngle);
                            jointDef.set_upperAngle(constraint.upperAngle);
                        }
                        if(constraint.enableMotor){
                            jointDef.set_enableMotor(true);
                            jointDef.set_maxMotorTorque(constraint.maxMotorTorque);
                            jointDef.set_motorSpeed(constraint.motorSpeed);
                        }
                        jointDef.Initialize(bodyA, bodyB, bodyA.GetWorldCenter());
                        break;
                }

                jointDef.set_collideConnected(constraint.collideConnected ?? false);

                const joint = this.#world.CreateJoint(jointDef);
                cache.jointDefs.push({ constraint, joint });
            } else { //update existing joint
                let joint;
                switch(constraint.type) {
                    case 'distance':
                        joint = Box2D.castObject(cache.jointDefs[i].joint, Box2D.b2DistanceJoint);
                        joint.SetLength(constraint.length);
                        joint.SetDamping(constraint.damping ?? 1);
                        joint.SetStiffness(constraint.stiffness ?? 1);
                        break;
                    case 'revolute':
                        joint = Box2D.castObject(cache.jointDefs[i].joint, Box2D.b2RevoluteJoint);
                        if(constraint.enableLimit) {
                            joint.EnableLimit(true);
                            joint.SetLimits(constraint.lowerAngle, constraint.upperAngle);
                        } else {
                            joint.EnableLimit(false);
                        }

                        if(constraint.enableMotor) {
                            joint.EnableMotor(true);
                            joint.SetMaxMotorTorque(constraint.maxMotorTorque);
                            joint.SetMotorSpeed(constraint.motorSpeed);
                        } else {
                            joint.EnableMotor(false);
                        }
                        break;
                }
            }
        }

        if(cache.jointDefs.length > model.jointConstraints2d.length) {
            for(let i = cache.jointDefs.length; i > model.jointConstraints2d.length; i--) {
                this.#world.DestroyJoint(cache.jointDefs[i].joint);
            }

            cache.jointDefs.length = model.jointConstraints2d.length;
        }
    }

    /**
     * @param {WorldPhysics2dModel|RigidBody2dModel|KinematicRigidBody2dModel} model
     */
    async onModelDelete(model) {
        if(model instanceof WorldPhysics2dModel && this.#world) {
            const Box2D = await Box2DPromise;
            Box2D.destroy(this.#world);
            this.#world = null;
        } else if(model instanceof RigidBody2dModel) {
            const body = this.#bodies.get(model.entity);
            if(body) {
                this.#world?.DestroyBody(body);
            }
        } else if(model instanceof JointConstraint2dModel) {

        } else if(model instanceof KinematicRigidBody2dModel) {
            this.#velocities.delete(model.entity);
        }
    }

    #translation = vec3.create();

    /** @param {number} hrTime */
    update(hrTime) {
        this.#world?.Step(hrTime / 1000, 1, 1);

        for(const model of this.rigidBodies) {
            const body  = this.#bodies.get(model.entity);
            const awake = body?.IsAwake();
            if(body && awake) {
                const pos = body.GetPosition();
                model.transform.setWorldTranslation([pos.get_x(), pos.get_y(), model.transform.getWorldTranslation(this.#translation)[2]]);
                model.transform.setWorldAxisAngle([0, 0, 1], body.GetAngle());
            }
        }

        for(const model of this.kinematicBodies) {
            const body = this.#bodies.get(model.entity);
            if(body) {
                const b2Vec2 = this.#velocities.get(model.entity);
                b2Vec2.set_x(model.velocity[0]);
                b2Vec2.set_y(model.velocity[1]);
                body.SetLinearVelocity(b2Vec2);
            }
        }
    }

    render() {
        this.#debugDraw?.();
    }

    /** @type {(() => void)|null} */
    #debugDraw = null;

    /**
     * @param {Box2D} Box2D
     * @param {string} cameraEntityId
     */
    #setupDebugDraw(Box2D, cameraEntityId) {
        const element = this.game.element ?? document.body;

        const renderer = this.stage.getContext('renderer');

        let frustum  = renderer.getCameraFrustum(cameraEntityId);

        const canvas = document.createElement('canvas');

        if(!canvas) return;

        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.pointerEvents = 'none';
        element.appendChild(canvas);

        const debugDraw = new Box2D.JSDraw();

        debugDraw.SetFlags(DEBUG_DRAW_SHAPE_BIT | DEBUG_DRAW_JOINT_BIT);

        const context = /** @type {CanvasRenderingContext2D} */(canvas.getContext('2d'));

        /** @param {number} colorPtr */
        const setColor = (colorPtr) => {
            const c = Box2D.wrapPointer(colorPtr, Box2D.b2Color);
            const r = (c.get_r() * 255)|0;
            const g = (c.get_g() * 255)|0;
            const b = (c.get_b() * 255)|0;
            const str = `${r}, ${g}, ${b}`;
            context.fillStyle = `rgba(${str}, 0.5)`;
            context.strokeStyle = `rgb(${str})`;
        }
        /**
         * @param {number} vert1Ptr
         * @param {number} vert2Ptr
         */
        const drawSegment = (vert1Ptr, vert2Ptr) => {
            const proj1 = this.#projectDebugVertex(frustum, Box2D, vert1Ptr);
            const proj2 = this.#projectDebugVertex(frustum, Box2D, vert2Ptr);

            context.beginPath();
            context.moveTo(proj1[0], proj1[1]);
            context.lineTo(proj2[0], proj2[1]);
            context.stroke();
        }

        /**
         * @param {number} verticesPtr
         * @param {number} vertexCount
         * @param {boolean} fill
         */
        const drawPolygon = (verticesPtr, vertexCount, fill) => {
            context.beginPath();
            for(let i=0; i < vertexCount; i++) {
                // const vert = Box2D.wrapPointer(verticesPtr + (i * 8), Box2D.b2Vec2);
                const proj = this.#projectDebugVertex(frustum, Box2D, verticesPtr + (i * 8));
                if ( i == 0 ) {
                    context.moveTo(proj[0], proj[1]);
                } else {
                    context.lineTo(proj[0], proj[1]);
                }
            }
            context.closePath();
            if (fill){
                context.fill();
            }
            context.stroke();
        }

        /**
         * @param {number} centerPtr
         * @param {number} radius
         * @param {number} axisPtr
         * @param {boolean} fill
         */
        const drawCircle = (centerPtr, radius, axisPtr, fill) => {
            const center     = Box2D.wrapPointer(centerPtr, Box2D.b2Vec2);
            const projCenter = this.#projectDebugVertex(frustum, Box2D, centerPtr);

            context.beginPath();

            const n = 24;
            [...Array(n + 1)].forEach((_,i) => {
                const proj = this.#projectDebugPoint(frustum, center.get_x() + Math.cos(i * 2 * Math.PI / n) * radius, center.get_y() + Math.sin(i * 2 * Math.PI / n) * radius);
                context.lineTo(proj[0], proj[1]);
            });

            context.stroke();

            if (fill) {
                //render axis marker
                const axis     = Box2D.wrapPointer(axisPtr, Box2D.b2Vec2);
                const projAxis = this.#projectDebugPoint(frustum, center.get_x() + (axis.get_x() * radius), center.get_y() + (axis.get_y() * radius));
                context.beginPath();
                context.moveTo(projCenter[0], projCenter[1]);
                context.lineTo(projAxis[0], projAxis[1]);
                context.stroke();
            }
        }

        const drawAxes = () => {
            context.strokeStyle = 'rgb(192,0,0)';
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(1, 0);
            context.stroke();
            context.strokeStyle = 'rgb(0,192,0)';
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, 1);
            context.stroke();
        }

        /**
         * @param {number} transformPtr
         */
        const drawTransform = (transformPtr) => {

            const transform = Box2D.wrapPointer(transformPtr, Box2D.b2Transform);
            const pos  = transform.get_p();
            const rot  = transform.get_q();
            const proj = this.#projectDebugPoint(frustum, pos.get_x(), pos.get_y());

            context.save();
            context.translate(proj[0], proj[1]);
            context.scale(0.5, 0.5);
            context.rotate(rot.GetAngle());
            context.lineWidth *= 2;
            drawAxes();
            context.restore();
        }

        /**
         * @param {number} centerPtr
         * @param {number} radius
         */
        const drawPoint = (centerPtr, radius) => {
            const center     = Box2D.wrapPointer(centerPtr, Box2D.b2Vec2);
            context.beginPath();

            const n = 24;
            [...Array(n + 1)].forEach((_,i) => {
                const proj = this.#projectDebugPoint(frustum, center.get_x() + Math.cos(i * 2 * Math.PI / n) * radius, center.get_y() + Math.sin(i * 2 * Math.PI / n) * radius);
                context.lineTo(proj[0], proj[1]);
            });

            context.stroke();
        }

        const dummyAxis = Box2D.getPointer(new Box2D.b2Vec2(0,0));
        /**
         * @param {number} vert1Ptr
         * @param {number} vert2Ptr
         * @param {number} colorPtr
         */
        debugDraw.DrawSegment = (vert1Ptr, vert2Ptr, colorPtr) => {
            setColor(colorPtr);
            drawSegment(vert1Ptr, vert2Ptr);
        }

        /**
         * @param {number} verticesPtr
         * @param {number} vertexCount
         * @param {number} colorPtr
         */
        debugDraw.DrawPolygon = (verticesPtr, vertexCount, colorPtr) => {
            setColor(colorPtr);
            drawPolygon(verticesPtr, vertexCount, false)
        }

        /**
         * @param {number} verticesPtr
         * @param {number} vertexCount
         * @param {number} colorPtr
         */
        debugDraw.DrawSolidPolygon = (verticesPtr, vertexCount, colorPtr) => {
            setColor(colorPtr);
            drawPolygon(verticesPtr, vertexCount, true)
        }

        /**
         * @param {number} centerPtr
         * @param {number} radius
         * @param {number} colorPtr
         */
        debugDraw.DrawCircle = (centerPtr, radius, colorPtr) => {
            setColor(colorPtr);
            drawCircle(centerPtr, radius, dummyAxis, false)
        }

        /**
         * @param {number} centerPtr
         * @param {number} radius
         * @param {number} axisPtr
         * @param {number} colorPtr
         */
        debugDraw.DrawSolidCircle = (centerPtr, radius, axisPtr, colorPtr) => {
            setColor(colorPtr);
            drawCircle(centerPtr, radius, axisPtr, true)
        }

        /**
         * @param {number} transformPtr
         */
        debugDraw.DrawTransform = (transformPtr) => {
            drawTransform(transformPtr);
        }

        /**
         * @param {number} centerPtr
         * @param {number} size
         * @param {number} colorPtr
         */
        debugDraw.DrawPoint = (centerPtr, size, colorPtr) => {
            setColor(colorPtr);
            drawPoint(centerPtr, size / 2);
        }


        this.#world.SetDebugDraw(debugDraw);

        this.#debugDraw = () => {
            frustum       = renderer.getCameraFrustum(cameraEntityId);
            if(!frustum) return;

            canvas.width  = frustum.size.width;
            canvas.height = frustum.size.height;
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.#world.DebugDraw();
        };
    }

    #projected = vec3.create();

    /**
     * @param {import('revelryengine/renderer/frustum.js').Frustum} frustum
     * @param {Box2D} Box2D
     * @param {number} vertPtr
     */
    #projectDebugVertex(frustum, Box2D, vertPtr, out = vec2.create()) {
        const vert = Box2D.wrapPointer(vertPtr, Box2D.b2Vec2);
        return this.#projectDebugPoint(frustum, vert.get_x(), vert.get_y(), out);
    }

    /**
     * @param {import('revelryengine/renderer/frustum.js').Frustum} frustum
     * @param {number} x
     * @param {number} y
     */
    #projectDebugPoint(frustum, x, y, out = vec2.create()) {
        const [offsetX, offsetY, width, height] = frustum.uniformViewport;
        const proj = frustum.project([x, -y, 0], this.#projected);

        return vec2.set(out, offsetX + (proj[0] * 0.5 + 0.5) * (width), offsetY + (proj[1] * 0.5 + 0.5) * (height));
    }
}
