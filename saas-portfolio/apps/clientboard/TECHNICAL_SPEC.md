# ClientBoard - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Project board with customizable stages
- Async update composer (text + attachments)
- Client portal (magic link, read-only)
- @mentions and internal notes toggle
- Weekly digest configuration
- Project archiving

### Backend Responsibilities
- User authentication
- Project and update CRUD
- Client portal token management
- Magic link generation and validation
- Weekly digest email (cron job)
- File attachment handling

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── name: String
├── plan: Enum (free, starter, pro)

Project
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── client_name: String
├── client_email: String
├── stages: JSON (array of stage names)
├── current_stage: String
├── client_portal_token: String
├── digest_enabled: Boolean
├── digest_day: Integer (0-6)
├── status: Enum (active, archived)
├── created_at: DateTime

Update
├── id: UUID
├── project_id: UUID (FK)
├── content: Text
├── is_internal: Boolean
├── attachments: JSON (array of URLs)
├── created_at: DateTime

Digest
├── id: UUID
├── project_id: UUID (FK)
├── sent_at: DateTime
├── updates_included: JSON (array of update IDs)
```

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| POST | /api/projects/{id}/updates | Post update |
| PATCH | /api/projects/{id}/stage | Update stage |
| GET | /api/portal/{token} | Client portal view |
| POST | /api/projects/{id}/digest | Trigger manual digest |

## Abuse Controls
- Free plan: 2 active projects
- Update content: max 5000 chars
- Attachments: max 5 per update, 10MB each
