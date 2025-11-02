import { ComponentSchemas, ComponentDataMapSerialized } from '../../ecs/lib/ecs.js';

import { TransformSystem,    TransformSchema                      } from './transform.js';
import { GameObjectSystem,   MetaSchema                           } from './game-object.js';
import { OutlineSystem,      OutlineSchema                        } from './outline.js';
import { OrbitControlSystem, OrbitControlSchema                   } from './orbit-controls.js';
import { RendererSystem,     CameraSchema,      LightSchema       } from './renderer.js';
import { MeshSystem,         MeshSchema,        MeshLoader        } from './mesh.js';
import { SpriteSystem,       SpriteSchema,      SpriteLoader      } from './sprite.js';
import { EnvironmentSystem,  EnvironmentSchema, EnvironmentLoader } from './environment.js';
import { AnimationSystem,    AnimationsSchema                     } from './animation.js';
import { PrefabSystem,       PrefabSchema,      PrefabLoader      } from './prefab.js';
import { DOMSystem                                                } from './dom.js';

declare module '../../ecs/lib/ecs.js' {
    interface ComponentSchemas {
        transform:    typeof TransformSchema,
        meta:         typeof MetaSchema,
        outline:      typeof OutlineSchema,
        orbitControl: typeof OrbitControlSchema,
        camera:       typeof CameraSchema,
        light:        typeof LightSchema,
        mesh:         typeof MeshSchema,
        sprite:       typeof SpriteSchema,
        environment:  typeof EnvironmentSchema,
        animations:   typeof AnimationsSchema,
        prefab:       typeof PrefabSchema,
    }

    interface AssetLoaders {
        'revelry/mesh':        typeof MeshLoader,
        'revelry/sprite':      typeof SpriteLoader,
        'revelry/environment': typeof EnvironmentLoader,
        'revelry/prefab':      typeof PrefabLoader,
    }

    interface SystemContexts {
        'transform':   TransformSystem,
        'game-object': GameObjectSystem,
        'outline':     OutlineSystem,
        'orbit':       OrbitControlSystem,
        'renderer':    RendererSystem,
        'mesh':        MeshSystem,
        'sprite':      SpriteSystem,
        'environment': EnvironmentSystem,
        'animation':   AnimationSystem,
        'prefab':      PrefabSystem,
        'dom':         DOMSystem,
    }
}


declare global {
    interface HTMLElementTagNameMap {
        'rev-game':  import('./dom.js').RevGameElement;
        'rev-stage': import('./dom.js').RevStageElement;
    }
}
