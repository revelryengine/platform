# Revelry Engine ECS
> The Entity Component System for the Revelry Game Engine


## Running tests

```sh
rm -rf cov_profile && deno test --coverage=cov_profile --reporter=dot && deno coverage cov_profile
```

#### Install testing types

```sh
find test/*.test.js | xargs deno vendor --force
```