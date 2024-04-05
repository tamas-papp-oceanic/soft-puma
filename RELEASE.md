# Releasing of Puma

## Generating release for both architecture

```
In terminal window puma folder:

npm install
node_modules/.bin/electron-rebuild
npm run build

npm run electron-pack (for linux)
npm run electron-pack-win (for windows)
```
## Deploying generated files

### Ubuntu linux
```
The generated files:

  dist/latest-linux.yml
  dist/puma

They should be uploaded into the "puma.osukl.com" server's release folder:

  /usr/share/leopard/release/linux
```
### Windows
```
The generated files:

  dist/latest.yml
  dist/Puma Setup x.x.x.exe
  dist/Puma Setup x.x.x.exe.blockmap

They should be uploaded into the "updates.osukl.com/leopard" server's release folder:

  /usr/share/leopard/release/win64

Keep all previous files in release folder for windows release!
```
