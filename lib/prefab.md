# Prefabs

A prefab is a predifined set of components that are loaded at runtime. 

## Entity UUIDs

When a prefab is loaded, each component entity will be translated to a new UUID.

`@assets/example.revfab`:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: [0, 0, 0] } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: [1, 0, 0] } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | transform | { translation: [2, 0, 0] } |

Prefab:
  path: `@assets/example.revfab`

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |
    | 4a05b5f3-53a6-4719-b2d2-d8a842906d60 | transform | { translation: [0, 0, 0] } |
    | 360f15ca-1064-4823-ac52-3693632c2c2b | transform | { translation: [1, 0, 0] } |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | transform | { translation: [2, 0, 0] } |

### Reference Values

When a component value contains a reference to one of the entities within the prefab, the value will also be translated to the new UUID via string replace on the `JSON.stringify()` value.

`@assets/example.revfab`:
  components:
    | entity                               | type | value                                                              |
    | ------------------------------------ | ---- | ------------------------------------------------------------------ |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | meta | { name: 'parent' }                                                 |
    | ab408d66-39f7-4747-ac95-1968edd184bb | meta | { name: 'childA', parent: 'efd16ae1-3c90-4d3c-923b-258be07f8259' } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | meta | { name: 'childA', parent: 'efd16ae1-3c90-4d3c-923b-258be07f8259' } |

Prefab:
  path: `@assets/example.revfab`

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |

Stage:
  components:
    | entity                               | type   | value                                                              |
    | ------------------------------------ | ------ | ------------------------------------------------------------------ |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab | Prefab                                                             |
    | 4a05b5f3-53a6-4719-b2d2-d8a842906d60 | meta   | { name: 'parent' }                                                 |
    | 360f15ca-1064-4823-ac52-3693632c2c2b | meta   | { name: 'childA', parent: '4a05b5f3-53a6-4719-b2d2-d8a842906d60' } |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | meta   | { name: 'childA', parent: '4a05b5f3-53a6-4719-b2d2-d8a842906d60' } |

## References

When a prefab has a `references` map, it will use the provided UUIDs during translation.

`@assets/example.revfab`:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: [0, 0, 0] } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: [1, 0, 0] } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | transform | { translation: [2, 0, 0] } |

Prefab:
  path: `@assets/example.revfab`
  references:
    | key                                  | value                                |
    | ------------------------------------ | ------------------------------------ |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | 6b82083c-3eb6-41c7-92a2-9fe0664dff49 |
    | ab408d66-39f7-4747-ac95-1968edd184bb | 2ae1c489-0205-4f85-9553-9a6efd121858 |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |
    | 6b82083c-3eb6-41c7-92a2-9fe0664dff49 | transform | { translation: [0, 0, 0] } |
    | 2ae1c489-0205-4f85-9553-9a6efd121858 | transform | { translation: [1, 0, 0] } |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | transform | { translation: [2, 0, 0] } |

### Superflous References

As a prefab's components are added to the stage, the prefab system will look for any current `ComponentReference` to any entity contained within the prefab. If there are none, any corresponding reference will be removed from the `references` map.

## Overrides

When a prefab has an `overrides` set, it will merge the override value with the original component value at load time.

`@assets/example.revfab`:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: [0, 0, 0] } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: [1, 0, 0] } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | transform | { translation: [2, 0, 0] } |

Prefab:
  path: `@assets/example.revfab`
  overrides:
    | entity                               | type      | value                       |
    | ------------------------------------ | --------- | --------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: { "1": 1 } } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: { "2": 1 } } |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |
    | 4a05b5f3-53a6-4719-b2d2-d8a842906d60 | transform | { translation: [0, 1, 0] } |
    | 360f15ca-1064-4823-ac52-3693632c2c2b | transform | { translation: [1, 0, 1] } |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | transform | { translation: [2, 0, 0] } |

### Superflous Overrides

When a prefab is loaded, it will compare all overrides to the original values and update the set of `overrides` to only include the necessary delta.

## Omit

When a prefab has an `omit` set, it will refrain from loading any components of the set.

Prefab:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: [0, 0, 0] } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: [1, 0, 0] } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | transform | { translation: [2, 0, 0] } |
  omit:
    | entity                               | type      |
    | ------------------------------------ | --------- |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |

Stage:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | Prefab                     |
    | 4a05b5f3-53a6-4719-b2d2-d8a842906d60 | transform | { translation: [0, 0, 0] } |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | transform | { translation: [2, 0, 0] } |

## Recursion

When a prefab contains another component of type `prefab`, it will recursively load the components at runtime.

`@assets/parent.revfab`:
  components:
    | entity                               | type   | value                            |
    | ------------------------------------ | ------ | -------------------------------- |
    | 8869a246-f39d-4c6e-9bb1-42b2bedc48ab | prefab | { path: `@assets/child.revfab` } |

`@assets/child.revfab`:
  components:
    | entity                               | type      | value                      |
    | ------------------------------------ | --------- | -------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | transform | { translation: [0, 0, 0] } |
    | ab408d66-39f7-4747-ac95-1968edd184bb | transform | { translation: [1, 0, 0] } |
    | 995daeea-8445-4e2e-bcc5-ae26cd0836b5 | transform | { translation: [2, 0, 0] } |

Stage:
  components:
    | entity                               | type   | value                             |
    | ------------------------------------ | ------ | --------------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab | { path: `@assets/parent.revfab` } |

Stage:
  components:
    | entity                               | type      | value                             |
    | ------------------------------------ | --------- | --------------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab    | { path: `@assets/parent.revfab` } |
    | bd90b3b0-053c-4248-8149-7d4c035ef7e3 | prefab    | { path: `@assets/child.revfab`  } |
    | 4a05b5f3-53a6-4719-b2d2-d8a842906d60 | transform | { translation: [0, 1, 0] }        |
    | 360f15ca-1064-4823-ac52-3693632c2c2b | transform | { translation: [1, 0, 1] }        |
    | a1ce97dd-4b42-4509-96ed-106e66fd7c37 | transform | { translation: [2, 0, 0] }        |

### Recursive loops

If a prefab contains another component of type `prefab` that has already been loaded as part of the recursion, it will throw an error at load time.

`@assets/parent.revfab`:
  components:
    | entity                               | type   | value                            |
    | ------------------------------------ | ------ | -------------------------------- |
    | 8869a246-f39d-4c6e-9bb1-42b2bedc48ab | prefab | { path: `@assets/child.revfab` } |

`@assets/child.revfab`:
  components:
    | entity                               | type   | value                             |
    | ------------------------------------ | ------ | --------------------------------- |
    | efd16ae1-3c90-4d3c-923b-258be07f8259 | prefab | { path: `@assets/parent.revfab` } |

Stage:
  components:
    | entity                               | type   | value                             |
    | ------------------------------------ | ------ | --------------------------------- |
    | e5ee7a2f-550e-43e0-b3f1-609693ca2a63 | prefab | { path: `@assets/parent.revfab` } |

Load time error: `Asset recursive loop detected`
