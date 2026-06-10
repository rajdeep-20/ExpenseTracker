# Enable CORS globally
curl -i -X POST http://localhost:8001/plugins/ \
  -d "name=cors" \
  -d "config.origins=*" \
  -d "config.methods=GET" \
  -d "config.methods=POST" \
  -d "config.methods=PUT" \
  -d "config.methods=PATCH" \
  -d "config.methods=DELETE" \
  -d "config.methods=OPTIONS" \
  -d "config.headers=Accept" \
  -d "config.headers=Accept-Version" \
  -d "config.headers=Content-Length" \
  -d "config.headers=Content-MD5" \
  -d "config.headers=Content-Type" \
  -d "config.headers=Date" \
  -d "config.headers=X-Auth-Token" \
  -d "config.headers=Authorization" \
  -d "config.headers=X-Requested-With" \
  -d "config.headers=X-User-Id" \
  -d "config.credentials=true" \
  -d "config.max_age=3600"

# Auth Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=auth-service \
  --data url=http://auth-service:9811

curl -i -X POST http://localhost:8001/services/auth-service/routes \
  --data "paths[]=/auth" \
  --data "strip_path=false"

# User Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=user-service \
  --data url=http://user-service:9810

curl -i -X POST http://localhost:8001/services/user-service/routes \
  --data "paths[]=/user" \
  --data "strip_path=false"

# Expense Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=expense-service \
  --data url=http://expense-service:9820

curl -i -X POST http://localhost:8001/services/expense-service/routes \
  --data "paths[]=/expense" \
  --data "strip_path=false"

# DS Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=ds-service \
  --data url=http://ds-service:8010

curl -i -X POST http://localhost:8001/services/ds-service/routes \
  --data "paths[]=/ds" \
  --data "strip_path=false"

