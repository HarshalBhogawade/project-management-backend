# Project Management Backend

A simple Node.js REST API for managing users, projects, and tasks with authentication and role-based access control.

## Features
- Authentication (JWT-based user login and signup)
- Authorization (role-based access: admin and user)
- Project management (create, view, delete projects)
- Task management (create, view, update, delete tasks)
- User management (signup, login, role assignment)
- Input validation (using zod)
- Duplicate prevention (unique emails, project titles, task assignments)
- Error handling (with proper status codes and messages)
- Secure password storage (bcrypt hashing)
- MongoDB integration (with Mongoose ODM)

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing
- zod for validation
- Error handling

## Getting Started
1. Clone the repo
2. Run `npm install`
3. Set up your MongoDB connection in `config/db.js`
4. Start the server: `node server.js`

## API Endpoints
- `POST /api/v1/signup` — Register a new user
- `POST /api/v1/signin` — Login and get JWT token
- `POST /api/v1/project` — Create project (admin only)
- `GET /api/v1/project` — View all projects
- `GET /api/v1/project/:id` — View project by ID
- `DELETE /api/v1/project/:id` — Delete project (admin only)
- `POST /api/v1/tasks` — Create task (admin only)
- `GET /api/v1/tasks` — View tasks
- `GET /api/v1/tasks/:id` — View task by ID
- `PATCH /api/v1/tasks/:id` — Update task (admin only)
- `DELETE /api/v1/tasks/:id` — Delete task (admin only)

## Testing
See `test-data.md` for example requests and dummy data.

---
 
### Future Work
- Create frontend using react
- Conncet fe to be

