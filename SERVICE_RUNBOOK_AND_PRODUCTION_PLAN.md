# Expense Tracker Service Runbook and Production Plan

Last updated: 2026-05-10

This project currently has these main pieces:

| Component | Type | Local folder | Default port | Main dependency |
| --- | --- | --- | --- | --- |
| `authService` | Spring Boot | `authService` | `9811` | MySQL, Kafka |
| `userService` | Spring Boot | `userService/userService` | `9810` | MySQL, Kafka |
| `expenseService` | Spring Boot | `expenseService` | `9820` | MySQL, Kafka |
| `dsService` | Flask/Python | `dsService` | `8010` | Kafka, LLM API |
| `expenseTrackerApp` | React Native | `expenseTrackerApp` | Metro default | Backend APIs |
| VM infrastructure | Docker on VM | outside repo | MySQL `3306`, Kafka `9092`, Zookeeper `2181` | VM network |

## Recommended Development Setup

For frontend development, the best setup is:

1. Keep MySQL, Kafka, and Zookeeper running in Docker on the VM.
2. Run all backend application services locally on your development machine.
3. Point every backend service to the same VM IP for MySQL and Kafka.
4. Point the React Native app to your development machine, not to `localhost`, when running on Android emulator or a physical phone.
5. Later, add a lightweight API gateway/reverse proxy so the frontend uses one base URL instead of separate service ports.

This gives fast local logs/debugging for the services while avoiding local database and Kafka setup pain.

## Current Important Finding

The services do not all point to the same VM IP today.

| Service | Current database/Kafka host in config |
| --- | --- |
| `authService` | `192.168.1.12` |
| `expenseService` | defaults to `192.168.1.12` |
| `userService` | hard-coded to `192.168.1.9` |
| `dsService` | `.env` has placeholder `KAFKA_HOST=your_vm_ip_or_alias` |

Before debugging the frontend, make this consistent. Pick the actual VM IP, then use it everywhere through environment variables.

Example target:

```properties
MYSQL_HOST=192.168.1.12
MYSQL_PORT=3306
KAFKA_HOST=192.168.1.12
KAFKA_PORT=9092
```

Do not keep secrets or real API keys in committed files. Rotate any keys/passwords that have already been committed.

## Local Startup Order

Start dependencies first:

```powershell
# On the VM
docker ps
docker logs -f <mysql-container-name>
docker logs -f <kafka-container-name>
```

From your Windows machine, verify the VM ports are reachable:

```powershell
Test-NetConnection 192.168.1.12 -Port 3306
Test-NetConnection 192.168.1.12 -Port 9092
```

Then run each backend service in its own terminal.

### Terminal 1: authService

```powershell
cd "R:\road to google\java\New folder\authService"
.\gradlew.bat :app:bootRun --args="--vm.host.ip=192.168.1.12 --spring.datasource.hikari.connection-timeout=5000 --spring.kafka.producer.properties.max.block.ms=5000 --spring.kafka.producer.properties.request.timeout.ms=5000"
```

Health check:

```powershell
Invoke-RestMethod http://localhost:9811/health -TimeoutSec 5
```

### Terminal 2: userService

`userService` should be changed to env-based config. Until then, override the hard-coded IP from the command line:

```powershell
cd "R:\road to google\java\New folder\userService\userService"
.\gradlew.bat bootRun --args="--spring.kafka.bootstrap-servers=192.168.1.12:9092 --spring.datasource.url=jdbc:mysql://192.168.1.12:3306/userservice?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true --spring.datasource.hikari.connection-timeout=5000"
```

Health check:

```powershell
Invoke-RestMethod http://localhost:9810/user/v1/health -TimeoutSec 5
```

### Terminal 3: expenseService

```powershell
cd "R:\road to google\java\New folder\expenseService"
$env:MYSQL_HOST="192.168.1.12"
$env:KAFKA_HOST="192.168.1.12"
.\gradlew.bat bootRun --args="--spring.datasource.hikari.connection-timeout=5000 --spring.kafka.consumer.properties.request.timeout.ms=5000"
```

Health check:

```powershell
Invoke-RestMethod http://localhost:9820/expense/v1/health -TimeoutSec 5
```

### Terminal 4: dsService

Fix the known Python issues listed later in this document before relying on this service.

Expected shape after fixes:

```powershell
cd "R:\road to google\java\New folder\dsService\src"
$env:KAFKA_HOST="192.168.1.12"
$env:KAFKA_PORT="9092"
..\dsenv\Scripts\activate
$env:FLASK_APP="app.utlis"
python -m flask run --host 0.0.0.0 --port 8010
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8010/health -TimeoutSec 5
```

### Terminal 5: frontend

```powershell
cd "R:\road to google\java\New folder\expenseTrackerApp"
npm start
```

In another terminal:

```powershell
cd "R:\road to google\java\New folder\expenseTrackerApp"
npm run android
```

## Frontend API Base URL Rules

`localhost` inside a mobile app is not always your laptop.

| Frontend runtime | Backend running on your Windows machine | Backend running on VM |
| --- | --- | --- |
| Android emulator | `http://10.0.2.2:9811` | `http://<VM_IP>:9811` |
| Physical Android phone | `http://<YOUR_PC_LAN_IP>:9811` | `http://<VM_IP>:9811` |
| iOS simulator | `http://localhost:9811` | `http://<VM_IP>:9811` |
| Postman on Windows | `http://localhost:9811` | `http://<VM_IP>:9811` |

Recommended next frontend step:

```text
expenseTrackerApp/src/app/api/client.ts
```

Create one API client with environment-based base URLs and token injection. Do not hard-code service URLs inside screen components.

For development, start with:

```typescript
export const AUTH_BASE_URL = "http://10.0.2.2:9811";
export const USER_BASE_URL = "http://10.0.2.2:9810";
export const EXPENSE_BASE_URL = "http://10.0.2.2:9820";
export const DS_BASE_URL = "http://10.0.2.2:8010";
```

Use your PC LAN IP instead of `10.0.2.2` for a physical Android device.

## Endpoint Map

### authService: `http://localhost:9811`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Basic service check |
| `POST` | `/auth/v1/signup` | No | Creates auth user, stores refresh token, publishes Kafka user event |
| `POST` | `/auth/v1/login` | No | Authenticates user, returns access token and refresh token |
| `POST` | `/auth/v1/refreshToken` | No | Returns a new JWT from refresh token |
| `GET` | `/auth/v1/ping` | Bearer JWT | Returns authenticated user id |

There is already a Postman collection at:

```text
authService/apis.json
```

### userService: `http://localhost:9810`

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/user/v1/health` | Health check |
| `GET` | `/user/v1/getUser` | Currently expects body, which is not ideal for GET |
| `POST` | `/user/v1/createOrUpdate` | Creates or updates user data |

### expenseService: `http://localhost:9820`

| Method | Path | Auth header needed | Notes |
| --- | --- | --- | --- |
| `GET` | `/expense/v1/health` | No | Health check |
| `GET` | `/expense/v1/getExpense` | `X-User-Id` | Fetch expenses for user |
| `POST` | `/expense/v1/addExpense` | `X-User-Id` | Add expense |

### dsService: `http://localhost:8010`

| Method | Path | Auth header needed | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check |
| `POST` | `/v1/ds/message` | `x-user-id` | Should extract expense data and publish Kafka event |

The current route in code is missing the leading slash, so fix it to `/v1/ds/message`.

## Why authService Gets Stuck In Postman

Most likely causes, in order:

1. `authService` cannot connect to MySQL on the VM.
2. `authService` cannot connect to Kafka on the VM.
3. Kafka is reachable at `192.168.1.12:9092`, but the broker advertises an internal Docker hostname or wrong IP back to the Java client.
4. The request is `/auth/v1/signup`, and the signup flow reaches `kafkaTemplate.send(...)`, then waits for Kafka metadata.
5. The request is `/auth/v1/login`, and the login flow is blocked on database connection or password lookup.
6. The service is not actually listening on `9811`.

### Fast Debug Checklist

Check if the service itself is alive:

```powershell
Invoke-RestMethod http://localhost:9811/health -TimeoutSec 5
```

Check VM network:

```powershell
Test-NetConnection 192.168.1.12 -Port 3306
Test-NetConnection 192.168.1.12 -Port 9092
```

Check if Kafka topics exist on the VM:

```bash
docker exec -it <kafka-container-name> kafka-topics.sh --bootstrap-server localhost:9092 --list
```

You should have at least:

```text
user_service
expense_service
```

If Java services can reach Kafka but requests still hang, inspect Kafka advertised listeners. For a single VM broker, the advertised listener must be reachable from your Windows machine:

```text
PLAINTEXT://192.168.1.12:9092
```

Depending on the Kafka Docker image, the env var is usually one of these:

```text
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.1.12:9092
KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://192.168.1.12:9092
```

Also make sure the listener binds publicly:

```text
PLAINTEXT://0.0.0.0:9092
```

### Make authService Fail Fast During Development

Use lower timeouts while debugging:

```powershell
cd "R:\road to google\java\New folder\authService"
.\gradlew.bat :app:bootRun --args="--vm.host.ip=192.168.1.12 --spring.datasource.hikari.connection-timeout=5000 --spring.kafka.producer.properties.max.block.ms=5000 --spring.kafka.producer.properties.request.timeout.ms=5000"
```

This turns long silent waits into visible failures.

### Minimal Postman Test Order

1. `GET /health`
2. `POST /auth/v1/signup`
3. `POST /auth/v1/login`
4. `GET /auth/v1/ping` with `Authorization: Bearer <accessToken>`
5. `GET /user/v1/health`
6. `GET /expense/v1/health`
7. `POST /expense/v1/addExpense` with `X-User-Id: <userId>`

Signup currently returns only an access token. Run login after signup to capture both access token and refresh token in Postman.

Do not test the frontend until these are passing in Postman.

## Config Cleanup Needed

Create a consistent env-based style for all Spring services.

Preferred pattern:

```properties
spring.kafka.bootstrap-servers=${KAFKA_HOST:192.168.1.12}:${KAFKA_PORT:9092}
spring.datasource.url=jdbc:mysql://${MYSQL_HOST:192.168.1.12}:${MYSQL_PORT:3306}/${MYSQL_DB:service_db}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=${MYSQL_USER}
spring.datasource.password=${MYSQL_PASSWORD}
spring.datasource.hikari.connection-timeout=${DB_CONNECTION_TIMEOUT_MS:5000}
```

Use service-specific database names:

```text
authService      -> expense_tracker_db
userService      -> userservice
expenseService   -> expenseservice
```

For production, set:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
```

Use Flyway or Liquibase migrations instead of `ddl-auto=create` or `ddl-auto=update`.

## Known Code/Config Issues To Fix

These are the highest-impact items found during the scan.

| Area | Issue | Why it matters |
| --- | --- | --- |
| `userService` config | Hard-coded `192.168.1.9` | Breaks when VM IP is `192.168.1.12` |
| Secrets | DB passwords and API keys are in local config files | Rotate leaked secrets and move to env vars |
| `authService` Kafka producer | No short producer timeout configured | Signup can appear stuck when Kafka metadata is unreachable |
| Kafka VM config | Advertised listener may be wrong | Common reason clients connect but cannot send |
| `authService` CORS | `.cors(CorsConfigurer::disable)` | Browser-based frontend testing can fail |
| `userService` repository | `CrudRepository<UserInfo, Long>` but entity id is `String` | Can cause repository/id behavior bugs |
| `userService` API | `GET /user/v1/getUser` expects request body | Many clients/proxies do not handle GET bodies reliably |
| `expenseService` JPA | `ddl-auto=create` and `hbm2ddl.auto=update` both present | Dangerous in production |
| `expenseService` Dockerfile | Exposes `9898`, service uses `9820` | Container port mapping will be confusing/wrong |
| `expenseService` Dockerfile | Uses `openjdk21` | Prefer a real base like `eclipse-temurin:21-jre` |
| Spring Boot versions | `authService/userService` use `3.2.2`, `expenseService` uses `4.0.2` | Align versions before production |
| `dsService` route | `@app.route('v1/ds/message')` missing `/` | Endpoint will not match expected URL |
| `dsService` run config | `app.run(host=localhost...)` uses undefined variable | Service will crash on direct run |
| `dsService` LLM code | `seld.llm` typo | Service will crash during initialization |
| `dsService` imports | Imports from `.service...` under `app.utlis` | Likely package path issue |

## Best Long-Term Architecture

For local dev:

```text
React Native app
  -> local backend services on Windows
      -> MySQL/Kafka/Zookeeper on VM
```

For production:

```text
Mobile app
  -> HTTPS API gateway / reverse proxy
      -> authService
      -> userService
      -> expenseService
      -> dsService
          -> Kafka
          -> MySQL
          -> external LLM provider
```

The frontend should call one public API base URL. The gateway routes to internal services.

Example public paths:

```text
/api/auth/**     -> authService:9811
/api/users/**    -> userService:9810
/api/expenses/** -> expenseService:9820
/api/ds/**       -> dsService:8010
```

## Production Readiness Plan

### Phase 1: Stabilize Local Development

- Replace hard-coded IPs with env vars across all services.
- Add `.env.example` files with placeholders only.
- Add health checks for every service.
- Add short dev timeouts for database and Kafka.
- Fix `dsService` startup errors.
- Create a single Postman environment with `authBaseUrl`, `userBaseUrl`, `expenseBaseUrl`, and `dsBaseUrl`.
- Add a simple smoke-test script that checks all health endpoints.

### Phase 2: API Contract And Frontend Integration

- Create a frontend API client layer.
- Store JWT and refresh token securely with `react-native-keychain`.
- Add refresh-token handling in one place.
- Standardize headers:

```text
Authorization: Bearer <jwt>
X-User-Id: <userId>
Content-Type: application/json
```

- Add typed request/response models for auth, user, expense, and ds APIs.
- Add clear error handling for network timeout, unauthorized, and server errors.

### Phase 3: Containerize All Services

- Add a Dockerfile per service.
- Use `eclipse-temurin:21-jre` or a slim JRE base for Java runtime images.
- Align exposed ports with actual `server.port`.
- Add health checks to Docker Compose.
- Put all services on one Docker network.
- Keep MySQL and Kafka persistent volumes.
- Use Docker Compose for staging and VM deployment.

### Phase 4: Database And Messaging Hardening

- Replace `ddl-auto` schema creation with Flyway or Liquibase.
- Add indexes for common lookup fields like username and user id.
- Create Kafka topics explicitly on startup/deploy.
- Decide topic retention and partitions.
- Add retry/DLT handling for Kafka consumers.
- Make signup resilient if downstream `userService` is temporarily down.

### Phase 5: Security

- Move all secrets to environment variables or a secret manager.
- Rotate committed API keys/passwords.
- Add CORS allow-list for dev and production origins.
- Use HTTPS at the gateway.
- Use strong JWT signing secret from env.
- Add password policy and rate limiting on login/signup.
- Do not expose MySQL/Kafka publicly to the internet.

### Phase 6: Observability

- Add Spring Actuator health/readiness endpoints.
- Add structured JSON logs.
- Add request IDs/correlation IDs.
- Track metrics:

```text
request count
request latency
error rate
DB connection pool usage
Kafka consumer lag
Kafka producer failures
login/signup failures
```

- For the VM, start with Docker logs plus a simple dashboard. Later use Prometheus/Grafana or a managed logging tool.

### Phase 7: CI/CD

- Add build/test workflow:

```text
authService: ./gradlew.bat :app:test
userService: ./gradlew.bat test
expenseService: ./gradlew.bat test
expenseTrackerApp: npm test
```

- Build Docker images on merge.
- Tag images by version/commit.
- Deploy to staging first.
- Run smoke tests after deploy.
- Promote to production only after smoke tests pass.

## Maintenance Checklist

Daily while developing:

- Confirm VM IP has not changed.
- Confirm `GET /health` passes for all running services.
- Check backend logs when a frontend call fails.
- Keep Postman collection updated with real request examples.

Weekly:

- Run all tests.
- Check dependency updates.
- Review logs for repeated exceptions.
- Back up MySQL data.
- Check Kafka disk usage and topic retention.

Before every release:

- Run backend tests and frontend tests.
- Run smoke tests against staging.
- Verify migrations apply cleanly.
- Verify no secrets are committed.
- Verify Docker images start from a clean environment.
- Verify the mobile app points to the production gateway URL.

## Immediate Next Actions

1. Confirm the real VM IP.
2. Update `userService` and `dsService` to use that same VM IP through env vars.
3. Verify VM ports `3306` and `9092` from Windows.
4. Fix Kafka advertised listeners if producers still hang.
5. Run `authService` with fail-fast DB/Kafka timeouts.
6. Test auth in Postman before touching the frontend.
7. Add the frontend API client layer.
8. Fix `dsService` before connecting it to the UI.
9. Containerize all app services after local integration is stable.
