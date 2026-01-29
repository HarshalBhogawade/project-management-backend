# Swagger API Documentation Guide

## Step 1: Install Required Dependencies

```bash
# Install pnpm globally (optional)
npm install -g pnpm

# Install Swagger dependencies
pnpm i swagger-jsdoc
pnpm i swagger-ui-express
pnpm i swagger-model-validator
```

**What each package does:**
- `swagger-jsdoc`: Allows you to write JSDoc comments in your code to generate OpenAPI/Swagger specs
- `swagger-ui-express`: Serves Swagger UI for interactive API documentation
- `swagger-model-validator`: Validates your JSDoc comments and models

---

## Step 2: Configure Swagger in server.js

Add the following to your `server.js`:

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description: 'REST API for managing users, projects, and tasks with JWT authentication',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './schema.js'] // Path to files with JSDoc comments
};
   
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

---

## Step 3: Document Your API Endpoints

### Basic JSDoc Comment Structure

Every API endpoint should have a JSDoc comment above it with the following structure:

```javascript
/**
 * @swagger
 * /api/v1/endpoint:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success message
 *       400:
 *         description: Error message
 */
```

---

## Step 4: Document Schemas (Models)

Add schema documentation in `schema.js`:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           description: Hashed password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 */
```

---

## Step 5: Example - Document Authentication Routes

### Signup Endpoint

```javascript
/**
 * @swagger
 * /api/v1/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with hashed password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signed up
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
```

### Signin Endpoint

```javascript
/**
 * @swagger
 * /api/v1/signin:
 *   post:
 *     summary: User login
 *     description: Authenticates user and returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
```

---

## Step 6: Document Protected Routes (with Authentication)

For routes requiring JWT authentication:

```javascript
/**
 * @swagger
 * /api/v1/project:
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 */
```

---

## Step 7: Access Your Documentation

1. Start your server: `node server.js`
2. Open your browser and navigate to: `http://localhost:3000/api-docs`
3. You'll see the interactive Swagger UI with all your documented endpoints
4. Test your APIs directly from the Swagger UI by clicking "Try it out"

---

## Quick Reference

### Common JSDoc Annotations

- `@swagger` - Marks a Swagger documentation block
- `summary` - Short description of the endpoint
- `description` - Detailed explanation
- `tags` - Groups related endpoints
- `security` - Specifies authentication requirements
- `requestBody` - Describes the request payload
- `responses` - Lists possible HTTP responses
- `parameters` - Query params, path params, headers

### HTTP Methods
- `get` - Retrieve data
- `post` - Create new resource
- `put` - Update entire resource
- `patch` - Update partial resource
- `delete` - Remove resource

### Common Response Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## Tips

1. **Group related endpoints** using tags (e.g., Authentication, Projects, Tasks)
2. **Document all possible responses** including error cases
3. **Use examples** in your schemas for better clarity
4. **Keep descriptions clear and concise**
5. **Document authentication requirements** for protected routes
6. **Update documentation** when you modify endpoints
7. **Use schema references** to avoid repeating model definitions
