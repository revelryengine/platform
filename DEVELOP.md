# Clone platform repo and all submodules

git clone --recurse-submodules git@github.com:revelryengine/platform.git

# Requirements

docker
deno


# To start

```powershell
deno run -A dev.js
```


# Releasing a package

1. Push changes package to GitHub
2. List current releases
```
gh release list --limit 1
```
3. Create new release incrementing version
```
gh release create <version> -p
```
4. Replace version references in platform packages
