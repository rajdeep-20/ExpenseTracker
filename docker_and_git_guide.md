# GetGreen — Production Docker & Git Setup Guide

## Your Architecture (What We're Building)

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                           │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐            │
│  │ Zookeeper│→ │   Kafka   │  │    MySQL     │            │
│  │  :2181   │  │   :9092   │  │    :3306     │            │
│  └──────────┘  └─────┬─────┘  └──────┬───────┘            │
│                      │               │                     │
│  ┌───────────┐ ┌─────┴─────┐ ┌──────┴───────┐            │
│  │authService│ │userService│ │expenseService│            │
│  │  :9811    │ │  :9810    │ │    :9820     │            │
│  └─────┬─────┘ └─────┬─────┘ └──────┬───────┘            │
│        │              │              │                     │
│  ┌─────┴──────────────┴──────────────┴───┐                │
│  │          dsService (Python)           │                │
│  │              :8010                    │                │
│  └───────────────┬───────────────────────┘                │
│                  │                                         │
│  ┌───────────────┴───────────────────────┐                │
│  │         KONG API Gateway              │                │
│  │          :8000 (proxy)                │                │
│  │          :8001 (admin)                │                │
│  └───────────────┬───────────────────────┘                │
│                  │                                         │
└──────────────────┼─────────────────────────────────────────┘
                   │ :8000
          ┌────────┴────────┐
          │  GetGreen App   │
          │  (React Native) │
          └─────────────────┘
```

---

## Part 1: Git Setup (Do This FIRST)

### Where to `git init`

Run `git init` at the **`New folder/`** level — one single repo for everything.

```powershell
cd "R:\road to google\java\New folder"

# Step 1: Remove existing nested .git folders
# (Back up uncommitted work first!)
Remove-Item -Recurse -Force authService\.git
Remove-Item -Recurse -Force GetGreen\.git

# Step 2: Initialize ONE repo at root
git init
```

### Root `.gitignore`

Create this file at `R:\road to google\java\New folder\.gitignore`:

```gitignore
# === JAVA / GRADLE ===
*.class
*.jar
*.war
build/
.gradle/
.idea/
*.iml
out/
target/
local.properties

# === PYTHON ===
dsService/dsEnv/
__pycache__/
*.pyc
*.pyo
.env
*.egg-info/

# === REACT NATIVE ===
GetGreen/node_modules/
GetGreen/.expo/
GetGreen/*.log

# === BUILT ARTIFACTS ===
jars/

# === GENERAL ===
.DS_Store
Thumbs.db
*.log
```

> [!CAUTION]
> **Your `jars/` folder is ~229 MB of binaries.** Never commit this. Docker will build fresh JARs instead.

### First Commit

```powershell
git add .
git commit -m "chore: initial monorepo setup"
```

### Create GitHub Repo & Push

```powershell
git remote add origin https://github.com/YOUR_USERNAME/getgreen-platform.git
git branch -M main
git push -u origin main
git checkout -b develop
git push -u origin develop
```

---

## Part 2: Dockerfiles (One Per Service)

### 2A. authService Dockerfile

Create `authService/Dockerfile`:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew :app:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/app/build/libs/*.jar app.jar
EXPOSE 9811
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2B. userService Dockerfile

Create `userService/Dockerfile`:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/build/libs/*.jar app.jar
EXPOSE 9810
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2C. expenseService Dockerfile

Create `expenseService/Dockerfile`:

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/build/libs/*.jar app.jar
EXPOSE 9820
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2D. dsService Dockerfile

Create `dsService/Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY setup.py .
COPY src/ src/

RUN pip install --no-cache-dir -e .

EXPOSE 8010

CMD ["python", "-m", "flask", "run", "--host", "0.0.0.0", "--port", "8010"]

ENV FLASK_APP=app
```

> [!NOTE]
> We use `setup.py` instead of `requirements.txt` since your project already has one with all dependencies defined.

---

## Part 3: Docker Compose (The Heart of It All)

Create `docker-compose.yml` at the project root (`New folder/docker-compose.yml`):

```yaml
version: "3.9"

services:
  # ─── INFRASTRUCTURE ───────────────────────────
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"
    networks:
      - getgreen-net

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - getgreen-net
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 5s
      retries: 10

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-Rajdeep1234}
      MYSQL_USER: ${MYSQL_USER:-RAJ}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-Rajdeep1234}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - getgreen-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 10

  # ─── BACKEND SERVICES ─────────────────────────
  auth-service:
    build: ./authService
    ports:
      - "9811:9811"
    environment:
      VM_HOST_IP: mysql
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/expense_tracker_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-RAJ}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-Rajdeep1234}
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      mysql:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - getgreen-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9811/health"]
      interval: 15s
      timeout: 5s
      retries: 5

  user-service:
    build: ./userService
    ports:
      - "9810:9810"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/userservice?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-RAJ}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-Rajdeep1234}
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      mysql:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - getgreen-net

  expense-service:
    build: ./expenseService
    ports:
      - "9820:9820"
    environment:
      MYSQL_HOST: mysql
      MYSQL_PORT: 3306
      MYSQL_USER: ${MYSQL_USER:-RAJ}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-Rajdeep1234}
      KAFKA_HOST: kafka
      KAFKA_PORT: 9092
    depends_on:
      mysql:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - getgreen-net

  ds-service:
    build: ./dsService
    ports:
      - "8010:8010"
    environment:
      KAFKA_HOST: kafka
      KAFKA_PORT: 9092
      MISTRAL_API_KEY: ${MISTRAL_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      kafka:
        condition: service_healthy
    networks:
      - getgreen-net

  # ─── API GATEWAY ───────────────────────────────
  kong-database:
    image: postgres:15
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kongpass
    volumes:
      - kong-db-data:/var/lib/postgresql/data
    networks:
      - getgreen-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kong"]
      interval: 5s
      timeout: 5s
      retries: 5

  kong-migration:
    image: kong:3.7
    depends_on:
      kong-database:
        condition: service_healthy
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kongpass
    command: kong migrations bootstrap
    networks:
      - getgreen-net

  kong:
    image: kong:3.7
    depends_on:
      kong-migration:
        condition: service_completed_successfully
      auth-service:
        condition: service_started
      user-service:
        condition: service_started
      expense-service:
        condition: service_started
      ds-service:
        condition: service_started
    ports:
      - "8000:8000"   # Proxy (your app calls THIS)
      - "8001:8001"   # Admin API (configure routes here)
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kongpass
      KONG_PROXY_LISTEN: 0.0.0.0:8000
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    networks:
      - getgreen-net

volumes:
  mysql-data:
  kong-db-data:

networks:
  getgreen-net:
    driver: bridge
```

### MySQL Init Script

Create `init-db.sql` at the root:

```sql
-- Creates all the databases your services need
CREATE DATABASE IF NOT EXISTS expense_tracker_db;
CREATE DATABASE IF NOT EXISTS userservice;
CREATE DATABASE IF NOT EXISTS expenseservice;

-- Grant access
GRANT ALL PRIVILEGES ON expense_tracker_db.* TO 'RAJ'@'%';
GRANT ALL PRIVILEGES ON userservice.* TO 'RAJ'@'%';
GRANT ALL PRIVILEGES ON expenseservice.* TO 'RAJ'@'%';
FLUSH PRIVILEGES;
```

### Production `.env` File

Create `.env` at the root (this is gitignored):

```env
MYSQL_ROOT_PASSWORD=<strong-password-here>
MYSQL_USER=RAJ
MYSQL_PASSWORD=<strong-password-here>
MISTRAL_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

---

## Part 4: Kong API Gateway Routes

After `docker compose up`, configure Kong routes via its Admin API:

```bash
# Auth Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=auth-service \
  --data url=http://auth-service:9811

curl -i -X POST http://localhost:8001/services/auth-service/routes \
  --data "paths[]=/api/auth" \
  --data "strip_path=true"

# User Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=user-service \
  --data url=http://user-service:9810

curl -i -X POST http://localhost:8001/services/user-service/routes \
  --data "paths[]=/api/user" \
  --data "strip_path=true"

# Expense Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=expense-service \
  --data url=http://expense-service:9820

curl -i -X POST http://localhost:8001/services/expense-service/routes \
  --data "paths[]=/api/expense" \
  --data "strip_path=true"

# DS Service routes
curl -i -X POST http://localhost:8001/services/ \
  --data name=ds-service \
  --data url=http://ds-service:8010

curl -i -X POST http://localhost:8001/services/ds-service/routes \
  --data "paths[]=/api/ds" \
  --data "strip_path=true"
```

After this, your app calls **one URL** → `http://<server-ip>:8000/api/...`:

| App Request | Kong Routes To |
|---|---|
| `GET :8000/api/auth/v1/login` | `auth-service:9811/auth/v1/login` |
| `GET :8000/api/user/v1/getUser` | `user-service:9810/user/v1/getUser` |
| `POST :8000/api/expense/v1/addExpense` | `expense-service:9820/expense/v1/addExpense` |
| `POST :8000/api/ds/v1/ds/message` | `ds-service:8010/v1/ds/message` |

> [!TIP]
> Save the Kong setup as a script `kong-setup.sh` so you can re-run it after a fresh deploy.

---

## Part 5: How to Run Everything

### First Time Setup

```powershell
cd "R:\road to google\java\New folder"

# Build and start everything
docker compose up --build -d

# Watch the logs
docker compose logs -f
```

### Startup Order (Handled Automatically)

Docker Compose `depends_on` + `healthcheck` ensures:

```
1. Zookeeper starts
2. Kafka + MySQL start (wait for Zookeeper)
3. Backend services start (wait for Kafka + MySQL healthy)
4. Kong starts (wait for backends + its own Postgres)
```

### Useful Commands

```powershell
# See status of all containers
docker compose ps

# Rebuild only one service after code changes
docker compose up --build auth-service -d

# View logs for a specific service
docker compose logs -f ds-service

# Stop everything
docker compose down

# Stop and DELETE all data (databases, volumes)
docker compose down -v
```

---

## Part 6: Critical Code Fix Needed

Your Java services currently **hardcode** the MySQL/Kafka host IPs. For Docker to work, these must come from environment variables. The `expenseService` already does this correctly. The others need fixing:

### authService — Fix `application.properties`

The Docker environment variables like `SPRING_DATASOURCE_URL` will **override** properties automatically in Spring Boot. So the Dockerfiles will work as-is. But for cleanliness, update to:

```properties
vm.host.ip=${VM_HOST_IP:192.168.1.12}
```

### userService — Fix `application.properties`

Change the hardcoded `192.168.1.9` lines:

```properties
spring.kafka.bootstrap-servers=${SPRING_KAFKA_BOOTSTRAP_SERVERS:192.168.1.12:9092}
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://192.168.1.12:3306/userservice?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true}
```

### dsService — Fix `__init__.py`

Change `host="localhost"` to `host="0.0.0.0"` (already fixed in the Dockerfile CMD, but fix the source too):

```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8010, debug=True)
```

---

## Final Project Structure

```
New folder/                      ← git init HERE
├── .gitignore                   ← unified (created above)
├── .env                         ← secrets (gitignored)
├── .env.example                 ← template (committed)
├── docker-compose.yml           ← orchestrates everything
├── init-db.sql                  ← MySQL init script
├── kong-setup.sh                ← Kong route configuration
├── README.md
│
├── authService/
│   ├── Dockerfile               ← NEW (multi-stage build)
│   ├── app/src/...
│   └── ...
│
├── userService/
│   ├── Dockerfile               ← NEW
│   ├── src/...
│   └── ...
│
├── expenseService/
│   ├── Dockerfile               ← NEW (replaces old root one)
│   ├── src/...
│   └── ...
│
├── dsService/
│   ├── Dockerfile               ← NEW
│   ├── setup.py
│   ├── src/app/...
│   └── ...
│
└── GetGreen/                    ← NOT in Docker (it's a phone app)
    ├── src/...
    └── ...
```

> [!IMPORTANT]
> **GetGreen (React Native) does NOT go in Docker.** It's a mobile app that runs on phones. It just points to Kong's URL (`http://<your-server>:8000/api/...`).
