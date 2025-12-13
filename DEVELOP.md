# Clone platform repo and all submodules

git clone --recurse-submodules git@github.com:revelryengine/platform.git

## Requirements

deno@2.5.5+

## Download vendor types

```
deno task dev:cache
```

## Start dev server

```
deno task dev:serve
```

## Run tests

```bash
# Run all tests
deno task test

# Run with coverage
deno task test --coverage

# Run specific package
deno task test --pkg=utils

# See test/README.md for more options
```


