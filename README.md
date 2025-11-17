# Wirelab Technical Challenge – Full Monorepo Solution
**Author:** Rian Schmits  
**Structure:** Monorepo with two Next.js frontends, a serverless backend, shared validation package, and CDK infrastructure.

---

## 📦 Project Overview

This repository contains a small but complete **cloud-native web application architecture**, implemented as a **monorepo**.  
It is built with the technologies requested in the challenge:

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** AWS Lambda-style handler in TypeScript
- **Infrastructure:** AWS CDK (TypeScript) defining at least one Lambda resource
- **Extras:** Local mock backend, shared validation package, tests, and coverage

### Apps & Packages

- **apps/frontend** – Public-facing Contact Form (Next.js App Router)
- **apps/dashboard** – Admin/Dashboard frontend consuming the same backend
- **apps/backend** – Serverless API implemented as a Lambda handler + local mock server
- **packages/shared** – Shared Zod schema for both frontends and backend
- **infra/cdk** – AWS CDK stack defining the Lambda + Function URL + CORS
- **Vitest + Testing Library** – Unit + integration tests for FE, BE, and shared schema
- **V8 Coverage** – Full coverage reporting

The focus is on **clarity, correctness, and best practices**:  
shared contracts, testability, DX, and realistic architecture.

---

## 🏗 Project Structure

```text
wirelab-monorepo/
│
├── apps/
│   ├── frontend/         # Contact Form app (Next.js)
│   ├── dashboard/        # Dashboard app (Next.js)
│   └── backend/          # Lambda handler + local mock server
│
├── packages/
│   └── shared/           # Zod schema & shared types
│
├── infra/
│   └── cdk/              # CDK Stack: Lambda + Function URL + CORS
│
├── vitest.config.ts
├── package.json
└── README.md
```

---

## 🚀 How to Run the Project Locally (Challenge Requirement)

### 1. Install dependencies (root)

```bash
npm install
```

This installs dependencies for all workspaces (frontends, backend, shared, CDK).

### 2. Start the backend mock server

```bash
npm run dev -w apps/backend
```

Backend mock URLs:

- http://localhost:4000/
- http://localhost:4000/dashboard

This mock server mirrors the Lambda handler behaviour, but runs locally without AWS.

### 3. Start the Contact App (frontend)

```bash
npm run dev -w apps/frontend
```

Available at:

- http://localhost:3000

Required environment variable for the frontend (`apps/frontend/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 4. Start the Dashboard App (second frontend)

```bash
npm run dev -w apps/dashboard
```

Available at:

- http://localhost:3001

Required environment variable (`apps/dashboard/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Both frontends now run simultaneously and talk to the same backend.

---

## 🌐 CORS Behaviour

Allowed origins for backend (mock + Lambda):

- http://localhost:3000
- http://localhost:3001

The backend inspects the incoming `Origin` header and reflects it back in:

```http
Access-Control-Allow-Origin: <origin>
```

For test environments without an Origin header, a safe default is used.

---

## 🧪 Testing & Coverage

### Run all tests

```bash
npm test
```

### Run with coverage

```bash
npm test -- --coverage
```

Generates a V8 coverage report under:

```text
/coverage/index.html
```

---

## 🧱 Architecture Overview

### Shared Contract (Zod Schema) – `packages/shared`

Both frontends and the backend import the same Zod schema and types:

- `ContactSchema` – validation rules for contact form payload
- `ContactInput` – TypeScript type derived from the schema

This ensures:

- type-safe request/response interfaces
- validation at the application edges
- consistent behaviour in frontend and backend

---

### Backend API (Serverless) – `apps/backend`

The backend is designed as a small serverless API with two endpoints:

| Method | Path         | Description                |
|--------|--------------|----------------------------|
| POST   | `/`          | Submit contact form        |
| GET    | `/dashboard` | Dashboard meta information |

Implementation details:

- Lambda-style handler (`handler.ts`) in TypeScript
- Uses the shared `ContactSchema` to validate incoming POST bodies
- Logs useful metadata (e.g. message length, timestamp) for observability
- Returns JSON responses with appropriate status codes and CORS headers

For local development, a **mock server** replicates the handler logic using Node’s `http` module:

- Same endpoints (`/`, `/dashboard`)
- Same validation logic
- Same response shape
- Separate from AWS, for a fast feedback loop

---

### Frontend Apps – Next.js App Router

#### 1. Contact App (`apps/frontend`, port 3000)

- Next.js App Router
- TypeScript and Tailwind CSS
- Client-side + schema-based validation with Zod
- Status handling:
    - loading (`Sending…`)
    - success message (`role="status"`)
    - error message (`role="alert"`)
    - warning when `NEXT_PUBLIC_API_BASE_URL` is not configured
- Accessible labels and roles
- Uses `fetch` to call the backend (local mock or Lambda Function URL)

#### 2. Dashboard App (`apps/dashboard`, port 3001)

- Separate Next.js App Router application
- Consumes `GET /meta` from the same backend
- Renders simple “cards”:
    - total submissions (mocked)
    - last example message (mock data)
    - last updated timestamp
- Includes loading, error, and warning states
- Demonstrates how multiple frontends can share the same backend and contracts

---

### Infrastructure (CDK) – `infra/cdk`

The AWS CDK stack (`WirelabContactApiStack`) defines:

- **`NodejsFunction` Lambda**:
    - TypeScript handler
    - Bundled with esbuild
    - Runtime: Node.js 20.x
    - Memory and timeout tuned for this use case
- **Function URL**:
    - Public endpoint for the Lambda
    - CORS configured for the frontend origins
- **Tags**:
    - `owner`: `rian-schmits`
    - `project`: `wirelab-contact-poc`

This keeps the infrastructure simple but realistic and aligned with the challenge requirements.

---

### Design Choices (high-level)

A few deliberate choices:

- **Monorepo (apps + packages + infra)**  
  Makes it easy to share validation logic and types between frontend and backend.

- **Shared Zod schema**  
  One source of truth for the contact payload, used in both frontend and backend.

- **Separate Contact and Dashboard apps**  
  Demonstrates how multiple frontends can live on the same backend and share contracts.

- **Local mock backend**  
  Speeds up development and testing without requiring an AWS account for every run.

- **CDK + Function URL**  
  Minimal but realistic infrastructure; easy to extend with additional resources if needed.

- **Strong test and coverage setup**  
  Shows how this code would behave as part of a larger, maintainable system.

---

## 📄 Deployment

If AWS credentials and environment are available, the CDK stack can be synthesized and deployed.

### Synthesize the stack

```bash
npm run cdk:synth -w infra/cdk
```

### Deploy the stack

```bash
npm run cdk:deploy -w infra/cdk
```

The deployed Function URL can then be used as `NEXT_PUBLIC_API_BASE_URL` for both frontends.

---
