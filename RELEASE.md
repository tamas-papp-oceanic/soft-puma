# Releasing of Puma

## Generating release for both architecture

```
In terminal window puma folder:

npm install
npm run electron-pack
```
## Deploying generated files
<br />

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

They should be uploaded into the "puma.osukl.com" server's release folder:

  /usr/share/leopard/release/win64
```
