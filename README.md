# AI-Native ERP MVP – Full System Specification

## 1. Project Overview

Build an AI-native ERP MVP where users interact with the system through a **chat interface**.

For the first version:

System capabilities:

• Email/password authentication
• Role-based permission system
• One seeded superadmin account
• Superadmin can create users and assign permissions
• Product CRUD operations (Create, Read, Update, Delete)
• AI chat interface that interprets commands and executes actions
• Strict backend permission enforcement

Only **text chat** is supported for now (no voice).

Tech stack:

Frontend: Next.js (App Router)
Backend: Next.js API routes
Database: PostgreSQL
ORM: Prisma
Authentication: JWT session
AI model: Google Gemini (function/tool calling)

Important architecture rule:

AI **never directly touches the database**.
AI only **interprets user intent** and returns structured actions.

The backend executes those actions.

---

# 2. System Architecture

High level architecture:

User Interface
↓
Chat API
↓
AI Intent Engine (Gemini)
↓
Action Validator
↓
Permission Guard
↓
Command Router
↓
Domain Services
↓
Database

---

# 3. Database Schema

Use Prisma ORM.

Entities:

User
Role
Permission
UserRole
RolePermission
Product
AuditLog

---

## Users table

Fields:

id (uuid primary key)
email (unique)
password_hash
created_at
updated_at

---

## Roles table

id (uuid)
name (string)

Example roles:

superadmin
employee

---

## Permissions table

id (uuid)
name (string)

Permissions for MVP:

product:create
product:read
product:update
product:delete
user:create
user:assign-role

---

## RolePermission table

role_id
permission_id

---

## UserRole table

user_id
role_id

---

## Products table

id (uuid)
name
description
price
created_at
updated_at

---

## AuditLog table

id
user_id
action
entity
parameters (json)
created_at

Example record:

user_id: 123
action: create_product
parameters: { name: "Keyboard", price: 50 }

---

# 4. Authentication System

Use email/password authentication.

Password must be hashed using bcrypt.

Auth endpoints:

POST /api/auth/register (superadmin only)
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

JWT token stored in HTTP-only cookie.

Auth middleware must:

• verify JWT
• attach user object to request
• attach user permissions

---

# 5. Superadmin Seed

During database seed:

Create default superadmin user.

Email:

[admin@example.com](mailto:admin@example.com)

Password:

admin123

Create role:

superadmin

Give superadmin **all permissions**.

Attach role to user.

---

# 6. Permission System

All backend routes must enforce permission checks.

Example:

create product → requires product:create
update product → requires product:update

Permission check function:

checkPermission(user, permission)

If user lacks permission:

Return HTTP 403.

AI cannot bypass this layer.

---

# 7. Product API

REST endpoints:

POST /api/products
GET /api/products
GET /api/products/:id
PUT /api/products/:id
DELETE /api/products/:id

Validation rules:

name required
price must be positive

All actions logged to AuditLog.

---

# 8. User Management (Superadmin)

Superadmin endpoints:

POST /api/users
GET /api/users
POST /api/users/:id/roles

Only superadmin can access.

---

# 9. Chat Interface

Frontend contains a simple chat UI.

Components:

ChatWindow
MessageList
MessageInput

User sends text command.

Example messages:

Create product named Keyboard priced 50
Show all products
Delete product 123

Chat request sent to:

POST /api/chat

Body:

{
message: "Create product named Keyboard priced 50"
}

---

# 10. AI Intent Engine

Use Google Gemini.

Gemini receives:

User message
List of available tools

Tools:

create_product
get_products
update_product
delete_product

Each tool must define schema.

Example tool definition:

create_product

parameters:

name (string)
description (string optional)
price (number)

Gemini returns structured tool call.

Example output:

{
"tool": "create_product",
"arguments": {
"name": "Keyboard",
"price": 50
}
}

---

# 11. Action Validation Layer

Before executing AI result:

Validate:

• schema correctness
• required fields present
• data types correct

Use Zod validation.

If validation fails:

Return error to chat.

---

# 12. Permission Guard

After validation:

Check user permission.

Example:

create_product → requires product:create

If denied:

Return message:

"You do not have permission to perform this action."

---

# 13. Command Router

Maps AI tool calls to backend services.

Example mapping:

create_product → ProductService.create
get_products → ProductService.list
update_product → ProductService.update
delete_product → ProductService.delete

Router receives:

tool name
arguments
user context

---

# 14. Domain Services

Business logic layer.

ProductService methods:

createProduct(data)
getProducts()
updateProduct(id, data)
deleteProduct(id)

All services must:

validate data
log audit entries
interact with database

---

# 15. Audit Logging

Every executed command must be logged.

Example:

User: admin
Action: create_product
Parameters: { name: "Keyboard", price: 50 }

Store in AuditLog table.

---

# 16. Chat Response

After execution:

Return human readable message.

Example:

Product "Keyboard" created successfully.

Or:

Here are all products:
1 Keyboard — $50
2 Mouse — $25

---

# 17. Frontend Pages

Pages required:

/login
/dashboard/chat
/dashboard/products (optional UI view)

Main interaction is chat.

---

# 18. Project Structure

Project folder layout:

app/

api/
auth/
chat/
products/
users/

lib/

auth.ts
permissions.ts
gemini.ts
validator.ts

services/

productService.ts
userService.ts

prisma/

schema.prisma
seed.ts

components/

ChatWindow.tsx
MessageInput.tsx
MessageList.tsx

middleware/

authMiddleware.ts

---

# 19. Error Handling

System must handle:

invalid AI output
permission denied
missing product
database errors

All errors must return structured responses.

---

# 20. Security Rules

AI must never:

execute SQL
access database directly
bypass permission checks

Backend must always be the final authority.

---

# 21. Example System Flow

User message:

Create product named Keyboard priced 50

Flow:

1 user sends message to /api/chat
2 backend sends prompt to Gemini
3 Gemini selects tool create_product
4 arguments validated with Zod
5 permission checked
6 ProductService.create called
7 product saved to database
8 audit log recorded
9 response returned to chat

---

# 22. MVP Scope

Only support:

authentication
users
roles
permissions
product CRUD
chat interface
Gemini tool calling

Do not build advanced features yet.

---

# 23. After MVP

Future phases will add:

invoice system
payment system
analytics
voice interface
AI CFO analysis

But those are **not part of MVP**.

---

# Final Instruction

Build the system exactly according to this architecture.

The backend must remain deterministic and secure.

AI must only interpret user intent, never control business logic directly.
