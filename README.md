# Revelry Engine ECS
> The Entity Component System for the Revelry Game Engine


## Running tests

```sh
rm -rf cov_profile && deno test --coverage=cov_profile --importmap test/importmap.json && deno coverage cov_profile
```