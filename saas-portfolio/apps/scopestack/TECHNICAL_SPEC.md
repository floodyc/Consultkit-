# ScopeStack - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Scope item CRUD interface
- Change request workflow UI
- Impact calculator (hours/cost visualization)
- Client-facing change request portal
- Export to PDF generation trigger
- Real-time updates via polling (SSE optional for v2)

### Backend Responsibilities
- User authentication (email/password + magic link)
- Project and scope item CRUD operations
- Change request state machine
- Impact calculation logic
- PDF generation (using WeasyPrint or similar)
- Client portal token generation and validation
- Stripe webhook handling for subscriptions

### High-Level Data Model

```
User
├── id: UUID
├── email: String (unique)
├── password_hash: String (nullable for magic link)
├── name: String
├── company: String
├── plan: Enum (free, starter, pro)
├── stripe_customer_id: String (nullable)
├── created_at: DateTime
└── updated_at: DateTime

Project
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── client_name: String
├── client_email: String
├── status: Enum (active, archived)
├── client_portal_token: String (unique)
├── created_at: DateTime
└── updated_at: DateTime

ScopeItem
├── id: UUID
├── project_id: UUID (FK)
├── title: String
├── description: Text
├── source: Enum (original, change_request)
├── estimated_hours: Float
├── estimated_cost: Decimal
├── status: Enum (included, pending, approved, rejected)
├── created_at: DateTime
└── updated_at: DateTime

ChangeRequest
├── id: UUID
├── project_id: UUID (FK)
├── scope_item_id: UUID (FK, nullable)
├── title: String
├── description: Text
├── requested_by: String
├── hours_delta: Float
├── cost_delta: Decimal
├── status: Enum (pending, approved, rejected)
├── approved_at: DateTime (nullable)
├── approved_by: String (nullable)
├── client_ip: String (nullable)
├── created_at: DateTime
└── updated_at: DateTime
```

## Key API Endpoints

### Authentication
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| POST | /api/auth/register | {email, password, name} | {user, token} |
| POST | /api/auth/login | {email, password} | {user, token} |
| POST | /api/auth/magic-link | {email} | {message} |
| GET | /api/auth/verify/{token} | - | {user, token} |
| GET | /api/auth/me | - | {user} |

### Projects
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /api/projects | - | [{project}] |
| POST | /api/projects | {name, client_name, client_email} | {project} |
| GET | /api/projects/{id} | - | {project, scope_items, change_requests} |
| PATCH | /api/projects/{id} | {fields} | {project} |
| DELETE | /api/projects/{id} | - | {success} |

### Scope Items
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /api/projects/{id}/scope-items | - | [{scope_item}] |
| POST | /api/projects/{id}/scope-items | {title, description, hours, cost} | {scope_item} |
| PATCH | /api/scope-items/{id} | {fields} | {scope_item} |
| DELETE | /api/scope-items/{id} | - | {success} |

### Change Requests
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /api/projects/{id}/change-requests | - | [{change_request}] |
| POST | /api/projects/{id}/change-requests | {title, description, requested_by, hours_delta, cost_delta} | {change_request} |
| PATCH | /api/change-requests/{id}/approve | {approved_by} | {change_request} |
| PATCH | /api/change-requests/{id}/reject | {reason} | {change_request} |

### Client Portal
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /api/portal/{token} | - | {project_summary, pending_requests} |
| POST | /api/portal/{token}/approve/{request_id} | - | {change_request} |
| POST | /api/portal/{token}/reject/{request_id} | {reason} | {change_request} |

### Exports
| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| GET | /api/projects/{id}/export/pdf | - | PDF file |
| GET | /api/projects/{id}/export/csv | - | CSV file |

## AI Usage
Not applicable for MVP. Future consideration: AI-assisted scope item generation from meeting transcripts.

## Abuse Controls

### Rate Limiting
- Authentication endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user
- Export endpoints: 10 requests/hour per user
- Client portal: 30 requests/minute per token

### Validation
- Email format validation
- Input sanitization for all text fields
- Maximum field lengths enforced
- Cost/hours must be positive numbers
- Project limit enforced based on plan tier

### Auth Assumptions
- JWT tokens expire after 24 hours
- Magic links expire after 15 minutes
- Client portal tokens are rotatable by user
- All API endpoints require authentication except portal routes
