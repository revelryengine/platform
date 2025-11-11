# Clone platform repo and all submodules

git clone --recurse-submodules git@github.com:revelryengine/platform.git

## Requirements

docker
deno@2.5.5+

## Download vendor types

```
deno cache --reload ./packages/**/deps/*.js
deno cache --reload ./test/*.js
deno cache --reload ./tasks/*.js
```

## Start dev server

```powershell
docker compose up -d
```


