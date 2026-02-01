# RetainerPulse - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Retainer CRUD interface
- Hour logging with client/project categorization
- Real-time burn rate dashboard
- Threshold configuration and alert display
- Client-facing portal (read-only usage view)
- Monthly report generation

### Backend Responsibilities
- User authentication
- Retainer and hour entry CRUD
- Burn rate calculations
- Alert threshold monitoring (cron job)
- Client portal token management
- Email notifications for threshold alerts

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── password_hash: String
├── name: String
├── plan: Enum (free, starter, pro)
├── created_at: DateTime

Retainer
├── id: UUID
├── user_id: UUID (FK)
├── client_name: String
├── client_email: String
├── monthly_hours: Float
├── hourly_rate: Decimal
├── rollover_enabled: Boolean
├── rollover_cap: Float
├── alert_threshold_80: Boolean
├── alert_threshold_100: Boolean
├── client_portal_token: String
├── status: Enum (active, paused, ended)
├── created_at: DateTime

HourEntry
├── id: UUID
├── retainer_id: UUID (FK)
├── date: Date
├── hours: Float
├── description: String
├── category: String
├── billable: Boolean
├── created_at: DateTime

MonthlySnapshot
├── id: UUID
├── retainer_id: UUID (FK)
├── month: Date
├── hours_used: Float
├── hours_available: Float
├── hours_rolled_over: Float
├── created_at: DateTime
```

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/retainers | Create retainer |
| GET | /api/retainers | List retainers with stats |
| GET | /api/retainers/{id}/entries | Get hour entries |
| POST | /api/retainers/{id}/entries | Log hours |
| GET | /api/retainers/{id}/dashboard | Get burn rate dashboard |
| GET | /api/portal/{token} | Client portal view |

## Abuse Controls
- Rate limiting: 100 req/min per user
- Free plan: 1 retainer limit
- Entry validation: hours must be positive, max 24/day
