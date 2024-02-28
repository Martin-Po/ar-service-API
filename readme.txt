in fly.toml change app name. Currently is equipos.

Defines the port
[env] 
  PORT = "8080"

Must be the same as this port
[[services]]
  http_checks = []
  internal_port = 8080

In fly.io env variables are not read from .env file, instead from fly.io secrets.
.env file is used in local executions

Node modules missint. Execute NPM INSTALL

Frontend build missing.