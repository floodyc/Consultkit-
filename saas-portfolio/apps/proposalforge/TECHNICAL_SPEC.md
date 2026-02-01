# ProposalForge - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Block-based proposal editor (drag/drop)
- Reusable block library management
- Variable insertion system (client name, dates, pricing)
- Proposal preview and publish
- Client-facing proposal viewer with accept button
- Analytics dashboard (opens, time spent, acceptance)

### Backend Responsibilities
- User authentication
- Proposal and block CRUD
- Variable interpolation engine
- Client proposal delivery (unique URLs)
- Analytics tracking (opens, views, acceptance)
- PDF generation for accepted proposals

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── name: String
├── company: String
├── plan: Enum (free, starter, pro)

Block
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── type: Enum (header, text, pricing, terms, signature)
├── content: JSON
├── is_template: Boolean

Proposal
├── id: UUID
├── user_id: UUID (FK)
├── title: String
├── client_name: String
├── client_email: String
├── blocks: JSON (ordered list of block references)
├── variables: JSON
├── status: Enum (draft, sent, viewed, accepted, declined)
├── view_token: String (unique)
├── sent_at: DateTime
├── viewed_at: DateTime
├── accepted_at: DateTime
├── client_ip: String

ProposalView
├── id: UUID
├── proposal_id: UUID (FK)
├── timestamp: DateTime
├── duration_seconds: Integer
├── client_ip: String
```

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/blocks | List user's blocks |
| POST | /api/blocks | Create block |
| GET | /api/proposals | List proposals |
| POST | /api/proposals | Create proposal |
| POST | /api/proposals/{id}/send | Send proposal to client |
| GET | /api/view/{token} | Client views proposal |
| POST | /api/view/{token}/accept | Client accepts proposal |
| GET | /api/proposals/{id}/analytics | Get view analytics |

## Abuse Controls
- Free plan: 3 proposals/month
- Rate limiting: 50 req/min per user
- View tracking: IP-based deduplication
