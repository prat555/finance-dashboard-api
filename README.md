# Finance Dashboard API

A role-based REST API backend for a finance dashboard system. Built with **Node.js**, **TypeScript**, **Express**, **Prisma**, and **PostgreSQL**.

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js 18+             |
| Language     | TypeScript              |
| Framework    | Express.js              |
| ORM          | Prisma                  |
| Database     | PostgreSQL              |
| Auth         | JWT (jsonwebtoken)      |
| Validation   | Zod                     |
| Testing      | Jest + Supertest        |
| API Docs     | Swagger UI (OpenAPI 3)  |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup (middleware, routes)
├── index.ts                  # Server entry point
├── controllers/              # Request handlers — thin layer, delegates to services
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── transaction.controller.ts
│   └── dashboard.controller.ts
├── services/                 # Business logic — all core rules live here
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── transaction.service.ts
│   └── dashboard.service.ts
├── routes/                   # Express routers — wires middleware + controllers
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── transaction.routes.ts
│   └── dashboard.routes.ts
├── middleware/               # Cross-cutting concerns
│   ├── auth.middleware.ts    # JWT verification + role guards
│   └── errorHandler.ts      # Global error handler
├── validators/
│   └── schemas.ts            # Zod schemas + validate() middleware factory
├── utils/
│   ├── prisma.ts             # Prisma client singleton
│   ├── errors.ts             # Typed error classes (AppError, NotFoundError, etc.)
│   ├── response.ts           # Consistent response helpers
│   └── swagger.ts            # OpenAPI spec
└── tests/
    ├── setup.ts
    ├── auth.test.ts
    └── transaction.test.ts
prisma/
├── schema.prisma             # Data model
└── seed.ts                   # Seed script with demo users + transactions
```

---

## Roles & Permissions

| Action                         | VIEWER | ANALYST | ADMIN |
|--------------------------------|--------|---------|-------|
| View transactions              | ✅     | ✅      | ✅    |
| View dashboard summary         | ❌     | ✅      | ✅    |
| View monthly trends            | ❌     | ✅      | ✅    |
| View category breakdown        | ❌     | ✅      | ✅    |
| Create transactions            | ❌     | ❌      | ✅    |
| Update transactions            | ❌     | ❌      | ✅    |
| Delete transactions            | ❌     | ❌      | ✅    |
| Manage users (list/update)     | ❌     | ❌      | ✅    |

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (running locally or via Docker)

### 2. Clone and install

```bash
git clone <repo-url>
cd finance-dashboard
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT_SECRET
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_dashboard"
JWT_SECRET="change-this-to-a-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 4. Database setup

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 5. Start the server

```bash
npm run dev
```

Server runs at **http://localhost:3000**

---

## API Documentation

Interactive Swagger UI available at:

```
http://localhost:3000/api/docs
```

## API Endpoints

### Auth
| Method | Endpoint           | Access | Description            |
|--------|--------------------|--------|------------------------|
| POST   | /api/auth/register | Public | Register a new user    |
| POST   | /api/auth/login    | Public | Login, receive JWT     |
| GET    | /api/auth/me       | Any    | Get current user info  |

### Users
| Method | Endpoint        | Access | Description              |
|--------|-----------------|--------|--------------------------|
| GET    | /api/users      | Admin  | List users (paginated)   |
| GET    | /api/users/:id  | Admin  | Get user by ID           |
| PATCH  | /api/users/:id  | Admin  | Update role/status/name  |
| DELETE | /api/users/:id  | Admin  | Deactivate user          |

### Transactions
| Method | Endpoint               | Access              | Description                    |
|--------|------------------------|---------------------|--------------------------------|
| GET    | /api/transactions      | Viewer/Analyst/Admin| List with filters + pagination |
| GET    | /api/transactions/:id  | Viewer/Analyst/Admin| Get single transaction         |
| POST   | /api/transactions      | Admin               | Create transaction             |
| PATCH  | /api/transactions/:id  | Admin               | Update transaction             |
| DELETE | /api/transactions/:id  | Admin               | Soft delete transaction        |

**Transaction filters (query params):** `type`, `category`, `startDate`, `endDate`, `page`, `limit`

### Dashboard
| Method | Endpoint                   | Access         | Description                   |
|--------|----------------------------|----------------|-------------------------------|
| GET    | /api/dashboard/summary     | Analyst/Admin  | Totals, balance, recent txns  |
| GET    | /api/dashboard/trends      | Analyst/Admin  | Monthly income vs expense     |
| GET    | /api/dashboard/categories  | Analyst/Admin  | Category-wise totals          |

---

## Example Usage

### Register + Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123","role":"ADMIN"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

### Create a Transaction (Admin)

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 85000,
    "type": "INCOME",
    "category": "Salary",
    "date": "2024-04-01T00:00:00.000Z",
    "notes": "April salary"
  }'
```

### Get Dashboard Summary (Analyst/Admin)

```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Filter Transactions

```bash
curl "http://localhost:3000/api/transactions?type=EXPENSE&category=Rent&page=1&limit=5" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Seed Credentials

After running `npm run db:seed`:

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@finance.dev      | admin1234    |
| Analyst | analyst@finance.dev    | analyst1234  |
| Viewer  | viewer@finance.dev     | viewer1234   |

---

## Running Tests

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests use the same PostgreSQL database with `beforeEach` cleanup to ensure isolation.

---

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Validation errors include a detailed `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "body.amount", "message": "Amount must be greater than 0" }
  ]
}
```

---

## Design Decisions & Assumptions

### Soft Deletes
Transactions are never permanently deleted — they get `isDeleted: true`. This preserves the audit trail, which is critical in finance systems. Users are similarly deactivated, not removed.

### Role Assignment on Register
The `role` field is accepted during registration for ease of testing and seeding. In a production system, you'd restrict this so only admins can elevate roles post-registration.

### Decimal Precision
`amount` is stored as `Decimal(12, 2)` in PostgreSQL via Prisma, supporting values up to 9,999,999,999.99 with exact decimal arithmetic — avoiding floating-point rounding errors common in finance apps.

### Dashboard Aggregations
The summary, trends, and category endpoints use Prisma's `aggregate` and `groupBy` to push computation to the database layer rather than pulling all records into memory.

### JWT Stateless Auth
JWTs are stateless — there's no token revocation or refresh mechanism. For production, a Redis-backed blocklist or refresh token rotation strategy would be added.

### Pagination
All list endpoints default to `page=1, limit=10` with a hard cap of 100 per page to prevent accidental large data fetches.
