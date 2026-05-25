# DsService — How It Works & Phone Setup Guide

## Part 1: How DsService Works

### What Is DsService?

The **DsService** (Data Science Service) is a Python/Flask microservice that acts as an **AI-powered expense extractor**. It takes raw bank SMS text, passes it through a Mistral AI LLM, and extracts structured expense data (amount, merchant, currency). That extracted data is then published to Kafka so the `expenseService` can save it to the database — **automatically, without the user manually typing their expenses**.

### The Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FULL REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

  📱 Phone (GetGreen App)
    │
    │  POST /api/ds/v1/ds/message
    │  Headers: { x-user-id: "abc-123" }
    │  Body:    { "message": "Rs 450 spent at Swiggy on HDFC card" }
    │
    ▼
  🌐 Kong API Gateway (:8000)
    │
    │  Routes /api/ds/* → ds-service:8010
    │  (strips /api/ds prefix)
    │
    ▼
  🐍 DsService (Flask, :8010)
    │
    │  1. Receives POST /v1/ds/message
    │  2. Validates x-user-id header
    │  3. MessagesUtil.isBankSms() checks if text looks like a bank SMS
    │     (searches for words: "spent", "bank", "card")
    │  4. If yes → LLMService.runLLM() sends text to Mistral AI
    │  5. Mistral extracts: { amount: "450", merchant: "Swiggy", currency: "Rs" }
    │  6. Attaches user_id to the result
    │  7. Publishes to Kafka topic: "expense_service"
    │  8. Returns the extracted data as JSON response
    │
    ▼
  📨 Kafka (topic: "expense_service")
    │
    │  Message: { amount: "450", merchant: "Swiggy",
    │             currency: "Rs", user_id: "abc-123" }
    │
    ▼
  ☕ ExpenseService (Spring Boot, :9820)
    │
    │  ExpenseConsumer.java listens on "expense_service" topic
    │  Deserializes into ExpenseDto
    │  Calls expenseService.createExpense(eventData)
    │  Saves to MySQL database
    │
    ▼
  🗄️ MySQL — expense saved permanently
```

### What Triggers DsService?

**Currently:** The DsService is triggered by an **HTTP POST request** from the mobile app (or Postman). The app would send the bank SMS text to `POST /v1/ds/message`.

**Who sends that request?** Two possible triggering patterns:

| Trigger | How It Works | Status |
|---|---|---|
| **Manual (current)** | User pastes/types a bank SMS into the app, app sends it to DsService | Works once the frontend screen is built |
| **Automatic SMS reading (future)** | App reads incoming SMS in the background, filters bank messages, sends them automatically | Requires Android SMS permission + a background listener |

> **IMPORTANT:**
> Right now, there is **no screen in the GetGreen app** that calls the DsService endpoint. You need to build a screen (or a background SMS listener) that sends the bank SMS text to the DsService.

### Key Files

| File | Purpose |
|---|---|
| `dsService/src/app/__init__.py` | Flask app, routes, Kafka producer |
| `dsService/src/app/service/messageService.py` | Orchestrates: check if bank SMS → run LLM |
| `dsService/src/app/service/llmService.py` | Calls Mistral AI to extract expense fields |
| `dsService/src/app/service/Expense.py` | Pydantic model for structured expense output |
| `dsService/src/app/utils/messagesUtil.py` | Regex filter to detect bank SMS keywords |
| `expenseService/.../ExpenseConsumer.java` | Kafka consumer that saves the extracted expense |

---

## Part 2: Setting Up on Your Phone

### Prerequisites

Before starting, make sure you have:

- Your **Windows PC** and **Android phone** on the **same Wi-Fi network**
- **Docker Desktop** installed and running on your PC
- A valid **Mistral API key** (get one at [console.mistral.ai](https://console.mistral.ai))
- **Node.js** (v18+) and **npm** installed
- **Expo CLI** installed (`npm install -g expo-cli`)
- **Expo Go** app installed on your phone (from Play Store)
- **USB debugging** enabled on your phone (for `adb` connection)

---

### Step 1: Find Your PC's Local IP Address

Open PowerShell and run:

```powershell
ipconfig
```

Look for **Wireless LAN adapter Wi-Fi** → **IPv4 Address**. It will be something like `192.168.1.X`.

Write this down — this is your `<PC_IP>`. Your phone will use this to reach the backend.

---

### Step 2: Set Up the Environment File

Edit the root `.env` file at the project root:

```
r:\road to google\java\New folder\.env
```

Make sure it contains:

```env
# Database
MYSQL_ROOT_PASSWORD=Rajdeep1234
MYSQL_USER=RAJ
MYSQL_PASSWORD=Rajdeep1234

# DsService LLM Keys
MISTRAL_API_KEY=your_actual_mistral_key_here
OPENAI_API_KEY=your_openai_key_or_leave_blank
```

> **CAUTION:** Never commit real API keys to Git. The `.env` file should be in `.gitignore`.

---

### Step 3: Start All Backend Services with Docker Compose

Open PowerShell in the project root:

```powershell
cd "R:\road to google\java\New folder"
docker-compose up --build -d
```

This starts **everything**:
- Zookeeper + Kafka (messaging)
- MySQL (database)
- authService (port 9811)
- userService (port 9810)
- expenseService (port 9820)
- **dsService (port 8010)** ← this is the one you asked about
- Kong API Gateway (port 8000 for proxy, 8001 for admin)

Wait for all containers to become healthy (~1-2 minutes):

```powershell
docker-compose ps
```

All services should show `Up` or `healthy`.

---

### Step 4: Configure Kong API Gateway Routes

After all services are up, you need to register routes and enable CORS in Kong. You can run the provided `kong-setup.sh` script:

```powershell
# From Git Bash or WSL:
bash kong-setup.sh
```

Or manually via PowerShell:

```powershell
# Enable CORS globally
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/plugins/" -Body @{
    name="cors"
    "config.origins"="*"
    "config.methods"="GET,POST,PUT,PATCH,DELETE,OPTIONS"
    "config.headers"="Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Auth-Token,Authorization,X-Requested-With,X-User-Id"
    "config.credentials"=$true
    "config.max_age"=3600
}

# Auth
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/" -Body @{name="auth-service"; url="http://auth-service:9811"}
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/auth-service/routes" -Body @{"paths[]"="/auth"; strip_path="false"}

# User
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/" -Body @{name="user-service"; url="http://user-service:9810"}
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/user-service/routes" -Body @{"paths[]"="/user"; strip_path="false"}

# Expense
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/" -Body @{name="expense-service"; url="http://expense-service:9820"}
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/expense-service/routes" -Body @{"paths[]"="/expense"; strip_path="false"}

# DS Service
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/" -Body @{name="ds-service"; url="http://ds-service:8010"}
Invoke-RestMethod -Method POST -Uri "http://localhost:8001/services/ds-service/routes" -Body @{"paths[]"="/ds"; strip_path="false"}
```

---

### Step 5: Verify Services Are Running

Run these health checks from PowerShell:

```powershell
# Auth Service
Invoke-RestMethod http://localhost:8000/auth/health

# User Service
Invoke-RestMethod http://localhost:8000/user/user/v1/health

# Expense Service
Invoke-RestMethod http://localhost:8000/expense/expense/v1/health

# DS Service
Invoke-RestMethod http://localhost:8000/ds/health
```

All should return `OK` or a `200` response.

---

### Step 6: Test DsService Manually (Postman or PowerShell)

Test the DsService directly to make sure LLM extraction works:

```powershell
$body = @{
    message = "Rs 450.00 spent on HDFC Bank Card at SWIGGY on 2026-05-16"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:8000/ds/v1/ds/message" `
    -Headers @{"x-user-id"="test-user-123"; "Content-Type"="application/json"} `
    -Body $body
```

Expected response:

```json
{
    "amount": "450.00",
    "merchant": "SWIGGY",
    "currency": "Rs",
    "user_id": "test-user-123"
}
```

If this works, the DsService + Kafka + Mistral AI pipeline is functioning correctly.

---

### Step 7: Allow Firewall Access (Important for Phone)

Your phone needs to reach port `8000` (Kong) on your PC. Open the Windows Firewall:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "GetGreen Kong Gateway" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

---

### Step 8: Update the GetGreen App's API Base URL

In the React Native app, you need to update the base URL to point to your PC's IP.

Edit or create the API config file. Currently `LoginService.ts` has a hardcoded AWS URL. Change the base URL to your local Kong gateway:

**File: `GetGreen/src/app/api/LoginService.ts`**

Replace:
```typescript
const SERVER_BASE_URL = "http://Expens-KongA-ChasZNdaOM4K-1208155051.ap-south-1.elb.amazonaws.com";
```

With:
```typescript
const SERVER_BASE_URL = "http://<PC_IP>:8000";
// Example: "http://192.168.1.14:8000"
```

> **TIP:** Create a central config file so you only change the IP in one place:
> ```typescript
> // GetGreen/src/app/api/config.ts
> export const API_BASE_URL = "http://192.168.1.14:8000"; // Your PC's IP
>
> export const AUTH_URL = `${API_BASE_URL}/auth`;
> export const USER_URL = `${API_BASE_URL}/user`;
> export const EXPENSE_URL = `${API_BASE_URL}/expense`;
> export const DS_URL = `${API_BASE_URL}/ds`;
> ```

---

### Step 9: Run the App on Your Phone

#### Option A: Using Expo Go (Easiest)

```powershell
cd "R:\road to google\java\New folder\GetGreen"
npx expo start
```

1. A QR code appears in the terminal
2. Open **Expo Go** on your phone
3. Scan the QR code
4. The app loads on your phone

#### Option B: Using USB + ADB

```powershell
cd "R:\road to google\java\New folder\GetGreen"
npx expo run:android
```

This builds and installs the app directly on your connected phone.

---

### Step 10: Test the Full Flow from Your Phone

1. **Sign up** → `POST /auth/auth/v1/signup`
2. **Login** → `POST /auth/auth/v1/login` → get access token
3. **Send a bank SMS to DsService** → The app (or you via Postman from your phone) sends:
   ```
   POST http://<PC_IP>:8000/ds/v1/ds/message
   Headers: x-user-id: <your-user-id>
   Body: { "message": "Rs 200 spent at Amazon on ICICI card" }
   ```
4. **Check expenses** → `GET /expense/expense/v1/getExpense` → the expense extracted by AI should appear

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Phone can't reach PC | Make sure both are on same Wi-Fi. Try `ping <PC_IP>` from phone. Check Windows Firewall. |
| DsService returns 503 | Kafka isn't ready yet. Wait for Kafka health check to pass: `docker-compose logs kafka` |
| DsService returns 500 | Check Mistral API key is valid. Run `docker-compose logs ds-service` |
| "x-user-id header required" | Make sure your app sends the `x-user-id` header with every DS request |
| Expense not appearing after DS call | Check `docker-compose logs expense-service` — the Kafka consumer may have a deserialization error |
| Kong returns 404 | Kong routes not configured. Re-run `kong-setup.sh` |
| App shows "Network Error" | Wrong IP in the app config, or firewall blocking port 8000 |

---

## Architecture Summary

```
📱 Your Phone (GetGreen App)
    │
    │  All API calls go to one URL:
    │  http://<PC_IP>:8000/api/...
    │
    ▼
🖥️ Your PC (Docker Compose)
    ┌─────────────────────────────────────────┐
    │  Kong Gateway (:8000)                   │
    │    /auth/*       → authService:9811     │
    │    /user/*       → userService:9810     │
    │    /expense/*    → expenseService:9820  │
    │    /ds/*         → dsService:8010       │
    ├─────────────────────────────────────────┤
    │  Kafka (:9092) + Zookeeper (:2181)      │
    │  MySQL (:3306)                          │
    └─────────────────────────────────────────┘
```

> **NOTE:** The DsService doesn't need MySQL — it only needs Kafka (to publish) and the Mistral API (to extract). It's the lightest backend service in your stack.
