# ProjectStart - Technical Specification

## Overview

ProjectStart is the kickoff hub for new client projects. It captures essential project information, team contacts, roles, and creates a shared reference point that all other ConsultKit apps can pull from.

**Price:** Free (no credit card required)

## Architecture Overview

### Frontend Responsibilities
- Project creation wizard
- Contact/stakeholder management
- Role assignment interface
- Project overview dashboard
- Team directory view
- Export project brief (PDF)
- Share project link with clients

### Backend Responsibilities
- User authentication (magic link)
- Project CRUD operations
- Contact/stakeholder management
- Role definitions and assignments
- Project brief generation
- Shareable client view tokens
- API for other ConsultKit apps to fetch project data

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── name: String
├── company: String
├── plan: Enum (free, starter, pro)
├── created_at: DateTime

Project
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── client_name: String
├── description: Text
├── status: Enum (draft, active, on_hold, completed, archived)
├── start_date: Date
├── target_end_date: Date (optional)
├── budget_range: String (optional)
├── project_type: String (retainer, fixed, hourly)
├── share_token: String (for client view)
├── created_at: DateTime
├── updated_at: DateTime

Contact
├── id: UUID
├── project_id: UUID (FK)
├── name: String
├── email: String
├── phone: String (optional)
├── company: String
├── role_id: UUID (FK)
├── is_primary: Boolean
├── notes: Text (optional)
├── created_at: DateTime

Role
├── id: UUID
├── project_id: UUID (FK)
├── name: String (e.g., "Project Manager", "Approver", "Stakeholder")
├── permissions: JSON (can_approve, can_view, receives_updates)
├── color: String (for UI badges)
├── is_default: Boolean

ProjectNote
├── id: UUID
├── project_id: UUID (FK)
├── user_id: UUID (FK)
├── content: Text
├── is_pinned: Boolean
├── created_at: DateTime

Default Roles (created with each project):
- Project Owner (internal)
- Account Manager (internal)
- Primary Contact (client)
- Approver (client)
- Stakeholder (client)
```

## Key Features

### 1. Project Setup Wizard
Step-by-step project creation:
1. Basic info (name, client, description)
2. Timeline & budget
3. Add contacts
4. Assign roles
5. Review & create

### 2. Contact Management
- Add unlimited contacts per project
- Assign roles with permissions
- Mark primary contacts
- Import from CSV
- Quick-add from previous projects

### 3. Role Templates
- Pre-built role templates
- Custom role creation
- Permission settings per role
- Color-coded badges

### 4. Project Dashboard
- Overview of all active projects
- Quick access to contacts
- Project status at a glance
- Recent activity feed

### 5. Client Share View
- Read-only project overview for clients
- Shows team contacts and roles
- Accessible via secure link
- No login required for clients

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/{id} | Get project details |
| PUT | /api/projects/{id} | Update project |
| DELETE | /api/projects/{id} | Archive project |
| GET | /api/projects/{id}/contacts | List contacts |
| POST | /api/projects/{id}/contacts | Add contact |
| PUT | /api/contacts/{id} | Update contact |
| DELETE | /api/contacts/{id} | Remove contact |
| GET | /api/projects/{id}/roles | List roles |
| POST | /api/projects/{id}/roles | Create role |
| GET | /api/share/{token} | Public project view |
| POST | /api/projects/{id}/export | Generate PDF brief |

## Integration Points

ProjectStart serves as the "source of truth" for project info across ConsultKit:

- **ScopeStack** → Pulls project name, contacts for change orders
- **RetainerPulse** → Links hours to project, notifies contacts
- **ProposalForge** → Pre-fills client info from project
- **ClientBoard** → Sends updates to project contacts
- **DeliverProof** → Routes approvals to designated approvers

## Pricing

ProjectStart is **completely free** - no credit card required, no paid tiers.

This is intentional: ProjectStart serves as the entry point to the ConsultKit ecosystem. Users who organize their projects here are more likely to adopt paid apps like ScopeStack, ClientBoard, and DeliverProof.

## Abuse Controls

- Unlimited projects and contacts
- Rate limit: 100 API calls/minute
- File uploads limited to 10MB per project brief
