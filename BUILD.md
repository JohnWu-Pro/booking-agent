
# Setup
The [http-server](https://github.com/http-party/http-server) is used for local development and manual testing.

To install http-server (globally):
```
npm install --global http-server
```

To setup local directory structure
```
# Windows commands
cd <project-dir>
mkdir ..\http-server.public
mklink /J ..\http-server.public\booking-agent .
```
OR
```
# Linux/Unix commands
cd <project-dir>
mkdir -p ../http-server.public
ln ./ ../http-server.public/booking-agent/
```

# Running locally
```
http-server ../http-server.public/ -c-1 -p 9088

# then, open http://localhost:9088/booking-agent/index.html
```
