# DeliverProof - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Deliverable upload with versioning UI
- Approval workflow management
- Client-facing approval portal
- Approval history timeline
- Export for invoicing/disputes
- Notification configuration

### Backend Responsibilities
- User authentication
- Deliverable and version CRUD
- Approval request workflow
- Client portal token management
- Timestamped approval records with IP logging
- Email notifications for approval requests
- PDF export of approval history

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── name: String
├── company: String
├── plan: Enum (free, starter, pro)

Project
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── client_name: String
├── client_email: String
├── client_portal_token: String
├── status: Enum (active, completed, archived)

Deliverable
├── id: UUID
├── project_id: UUID (FK)
├── title: String
├── description: Text
├── current_version: Integer
├── status: Enum (draft, pending, approved, rejected, revision_requested)
├── created_at: DateTime

DeliverableVersion
├── id: UUID
├── deliverable_id: UUID (FK)
├── version_number: Integer
├── file_url: String
├── file_type: String
├── file_size: Integer
├── notes: Text
├── created_at: DateTime

ApprovalRecord
├── id: UUID
├── deliverable_id: UUID (FK)
├── version_id: UUID (FK)
├── action: Enum (approved, rejected, revision_requested)
├── feedback: Text
├── approved_by: String
├── client_ip: String
├── user_agent: String
├── timestamp: DateTime
```

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects/{id}/deliverables | Create deliverable |
| POST | /api/deliverables/{id}/versions | Upload new version |
| POST | /api/deliverables/{id}/request-approval | Send approval request |
| GET | /api/portal/{token} | Client portal |
| POST | /api/portal/{token}/approve/{id} | Client approves |
| POST | /api/portal/{token}/reject/{id} | Client rejects |
| GET | /api/projects/{id}/export | Export approval history |

## Abuse Controls
- Free plan: 5 deliverables/month
- File size limit: 50MB per file
- Version limit: 10 per deliverable
- Rate limiting: 50 req/min per user
