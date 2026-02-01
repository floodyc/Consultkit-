# LeadGate - Technical Specification

## Architecture Overview

### Frontend Responsibilities
- Form builder with conditional logic
- Scoring criteria configuration
- Lead list with filtering and status
- Auto-routing configuration (qualified → calendar, unqualified → resource)
- Embeddable form widget
- Hosted form pages

### Backend Responsibilities
- User authentication
- Form and field CRUD
- Lead submission handling
- Scoring engine
- Webhook delivery (to CRM integrations)
- Calendar integration (Calendly/Cal.com)

### High-Level Data Model

```
User
├── id: UUID
├── email: String
├── name: String
├── plan: Enum (free, starter, pro)
├── calendar_url: String (optional)

Form
├── id: UUID
├── user_id: UUID (FK)
├── name: String
├── slug: String (unique for hosted page)
├── fields: JSON (array of field definitions)
├── scoring_rules: JSON
├── qualified_action: JSON (calendar link, redirect URL)
├── unqualified_action: JSON (resource URL, message)
├── theme: JSON (colors, logo)
├── status: Enum (active, paused)

Lead
├── id: UUID
├── form_id: UUID (FK)
├── responses: JSON
├── score: Integer
├── status: Enum (new, qualified, unqualified, contacted, converted)
├── source: String (referrer)
├── ip_address: String
├── created_at: DateTime

Field Types:
- text, email, phone, number
- select, multiselect, radio
- budget_range, date
- textarea
```

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/forms | List forms |
| POST | /api/forms | Create form |
| GET | /api/forms/{id}/leads | Get leads |
| POST | /api/submit/{slug} | Submit form (public) |
| GET | /api/embed/{id}.js | Embed script |
| POST | /api/leads/{id}/status | Update lead status |

## Abuse Controls
- Free plan: 1 form, 20 leads/month
- Submission rate limit: 10/minute per IP
- Honeypot field for bot detection
