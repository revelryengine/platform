# Prefabs

A prefab is a predifined set of components that are loaded at runtime.

## Entity UUIDs

When a prefab is loaded, each component entity will be translated to a new UUID that combines the prefab entity and the underlying entity.

`@assets/example.revfab`:
  components:
    | entity                                 | type      | value                      |
    | -------------------------------------- | --------- | -------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |

Prefab:
  asset: `@assets/example.revfab`

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type      | value                      |
    | --------------------------------------------------------------------------- | --------- | -------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab    | Prefab                     |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |

### Reference Values

When a component value contains a reference to one of the entities within the prefab, the value will also be translated to the new UUID.

`@assets/example.revfab`:
  components:
    | entity                                 | type | value                                                              |
    | -------------------------------------- | ---- | ------------------------------------------------------------------ |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | meta | { name: 'parent' }                                                 |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | meta | { name: 'childA', parent: `efd16ae1-3c90-4d3c-923b-258be07f8259` } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | meta | { name: 'childA', parent: `efd16ae1-3c90-4d3c-923b-258be07f8259` } |

Prefab:
  asset: `@assets/example.revfab`

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type   | value                                                                                                   |
    | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab | Prefab                                                                                                  |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | meta   | { name: 'parent' }                                                                                      |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|ab408d66-39f7-4747-ac95-1968edd184bb` | meta   | { name: 'childA', parent: `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | meta   | { name: 'childA', parent: `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` } |

## Overrides

When a prefab has an `overrides` set, it will apply the override as a json patch to the original component value at load time.

`@assets/example.revfab`:
  components:
    | entity                                 | type      | value                      |
    | -------------------------------------- | --------- | -------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |

Prefab:
  asset: `@assets/example.revfab`
  overrides:
    | entity                                 | type      | value                                                             |
    | -------------------------------------- | --------- | ----------------------------------------------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | [{ op: "replace", path: "/value/translation", value: [1, 1, 1] }] |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | [{ op: "replace", path: "/value/translation", value: [2, 2, 2] }] |

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type      | value                      |
    | --------------------------------------------------------------------------- | --------- | -------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab    | Prefab                     |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [1, 1, 1] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [2, 2, 2] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |


## Omit

When a prefab has an `omit` set, it will refrain from loading any components of the set.

Prefab:
  components:
    | entity                                 | type      | value                      |
    | -------------------------------------- | --------- | -------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |
  omit:
    | ------------------------------------------------ |
    | `----------------------------------------------` |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5:transform` |

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type      | value                      |
    | --------------------------------------------------------------------------- | --------- | -------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab    | Prefab                     |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |

## Append

When a prefab has an `append` set, it will add additional components to the set. This is useful for adding components to entities within the prefab at load time.

Prefab:
  components:
    | entity                                 | type | value               |
    | -------------------------------------- | ---- | ------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | meta | { name: 'entityA' } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | meta | { name: 'entityB' } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | meta | { name: 'entityC' } |
  append:
    | entity                                 | type      | value                      |
    | -------------------------------------- | --------- | -------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type      | value                      |
    | --------------------------------------------------------------------------- | --------- | -------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab    | Prefab                     |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | meta      | { name: 'entityA' }        |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|ab408d66-39f7-4747-ac95-1968edd184bb` | meta      | { name: 'entityB' }        |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | meta      | { name: 'entityC' }        |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |



## Recursion

When a prefab contains another component of type `prefab`, it will recursively load the components at runtime.

`@assets/parent.revfab`:
  components:
    | entity                                 | type   | value                             |
    | -------------------------------------- | ------ | --------------------------------- |
    | `8869a246-f39d-4c6e-9bb1-42b2bedc48ab` | prefab | { asset: `@assets/child.revfab` } |

`@assets/child.revfab`:
  components:
    | entity                                 | type      | value                      |
    | -------------------------------------- | --------- | -------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 0, 0] } |
    | `ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 0] } |
    | `995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] } |

Stage:
  components:
    | entity                                 | type   | value                              |
    | -------------------------------------- | ------ | ---------------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | { asset: `@assets/parent.revfab` } |

Stage at Runtime:
  components:
    | entity                                                                                                           | type      | value                              |
    | ---------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                                                           | prefab    | { asset: `@assets/parent.revfab` } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|8869a246-f39d-4c6e-9bb1-42b2bedc48ab`                                      | prefab    | { asset: `@assets/child.revfab`  } |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|8869a246-f39d-4c6e-9bb1-42b2bedc48ab|efd16ae1-3c90-4d3c-923b-258be07f8259` | transform | { translation: [0, 1, 0] }         |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|8869a246-f39d-4c6e-9bb1-42b2bedc48ab|ab408d66-39f7-4747-ac95-1968edd184bb` | transform | { translation: [1, 0, 1] }         |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|8869a246-f39d-4c6e-9bb1-42b2bedc48ab|995daeea-8445-4e2e-bcc5-ae26cd0836b5` | transform | { translation: [2, 0, 0] }         |

### Recursive loops

If a prefab contains another component of type `prefab` that has already been loaded as part of the recursion, it will throw an error at load time.

`@assets/parent.revfab`:
  components:
    | entity                                 | type   | value                            |
    | -------------------------------------- | ------ | -------------------------------- |
    | `8869a246-f39d-4c6e-9bb1-42b2bedc48ab` | prefab | { path: `@assets/child.revfab` } |

`@assets/child.revfab`:
  components:
    | entity                                 | type   | value                             |
    | -------------------------------------- | ------ | --------------------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | prefab | { path: `@assets/parent.revfab` } |

Stage at Runtime:
  components:
    | entity                                 | type   | value                             |
    | -------------------------------------- | ------ | --------------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | { path: `@assets/parent.revfab` } |

Load time error: `Recursive prefab reference detected @assets/parent.revfab -> @assets/child.revfab -> @assets/parent.revfab`


## Root Reparenting

When an entity withing a prefab has a `meta` component that does not have the parent set, the parent will be set to the loading prefab at load time

`@assets/example.revfab`:
  components:
    | entity                                 | type | value                 |
    | -------------------------------------- | ---- | --------------------- |
    | `efd16ae1-3c90-4d3c-923b-258be07f8259` | meta | { parent: undefined } |

Prefab:
  asset: `@assets/example.revfab`

Stage:
  components:
    | entity                                 | type   | value  |
    | -------------------------------------- | ------ | ------ |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` | prefab | Prefab |

Stage at Runtime:
  components:
    | entity                                                                      | type   | value                                              |
    | --------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63`                                      | prefab | Prefab                                             |
    | `e5ee7a2f-550e-43e0-b3f1-609693ca2a63|efd16ae1-3c90-4d3c-923b-258be07f8259` | meta   | { parent: `e5ee7a2f-550e-43e0-b3f1-609693ca2a63` } |
