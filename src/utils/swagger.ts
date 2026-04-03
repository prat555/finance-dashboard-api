// OpenAPI spec built manually — no extra dependency needed.
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Finance Dashboard API',
    version: '1.0.0',
    description:
      'Backend API for a role-based finance dashboard. Supports user management, ' +
      'financial records (CRUD), and dashboard-level analytics.',
    contact: { name: 'Finance Dashboard' },
  },
  servers: [{ url: '/api', description: 'API base path' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT token returned by POST /auth/login',
      },
    },
    schemas: {
      // ── Enums ──────────────────────────────────────────────────────────────
      Role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
      UserStatus: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
      TransactionType: { type: 'string', enum: ['INCOME', 'EXPENSE'] },

      // ── Auth ───────────────────────────────────────────────────────────────
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Alice Smith' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', minLength: 8, example: 'secret123' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/UserPublic' },
        },
      },

      // ── User ───────────────────────────────────────────────────────────────
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { $ref: '#/components/schemas/Role' },
          status: { $ref: '#/components/schemas/UserStatus' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { $ref: '#/components/schemas/Role' },
          status: { $ref: '#/components/schemas/UserStatus' },
        },
      },

      // ── Transaction ────────────────────────────────────────────────────────
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', example: 5000.00 },
          type: { $ref: '#/components/schemas/TransactionType' },
          category: { type: 'string', example: 'Salary' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string', nullable: true },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTransactionRequest: {
        type: 'object',
        required: ['amount', 'type', 'category', 'date'],
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 5000 },
          type: { $ref: '#/components/schemas/TransactionType' },
          category: { type: 'string', example: 'Salary' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string', nullable: true },
        },
      },

      // ── Dashboard ──────────────────────────────────────────────────────────
      DashboardSummary: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number' },
          totalExpenses: { type: 'number' },
          netBalance: { type: 'number' },
          transactionCount: { type: 'integer' },
          categoryBreakdown: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                type: { $ref: '#/components/schemas/TransactionType' },
                total: { type: 'number' },
                count: { type: 'integer' },
              },
            },
          },
          recentTransactions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Transaction' },
          },
        },
      },

      // ── Generic responses ──────────────────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Auth ─────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          409: { description: 'Email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } } },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'role', in: 'query', schema: { $ref: '#/components/schemas/Role' } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/UserStatus' } },
        ],
        responses: { 200: { description: 'Paginated user list' }, 403: { description: 'Forbidden' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a user by ID (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User found' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update a user role or status (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } } },
        responses: { 200: { description: 'User updated' }, 403: { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate a user (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User deactivated' }, 403: { description: 'Forbidden' } },
      },
    },

    // ── Transactions ───────────────────────────────────────────────────────────
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions with optional filters (Viewer, Analyst, Admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/TransactionType' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Paginated transaction list' } },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create a new transaction (Admin only)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTransactionRequest' } } } },
        responses: { 201: { description: 'Transaction created' }, 403: { description: 'Forbidden' } },
      },
    },
    '/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get a transaction by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaction found' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Transactions'],
        summary: 'Update a transaction (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTransactionRequest' } } } },
        responses: { 200: { description: 'Transaction updated' }, 403: { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Soft-delete a transaction (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaction deleted' }, 403: { description: 'Forbidden' } },
      },
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get overall financial summary (Analyst, Admin)',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Summary data', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummary' } } } } },
      },
    },
    '/dashboard/trends': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get monthly income vs expense trends (Analyst, Admin)',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2024 } },
        ],
        responses: { 200: { description: 'Monthly trend data' } },
      },
    },
    '/dashboard/categories': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get category-wise totals (Analyst, Admin)',
        responses: { 200: { description: 'Category breakdown' } },
      },
    },
  },
};
