# ConsultKit - SaaS Portfolio

A six-app SaaS portfolio for agencies and consultancies, designed for solo founder operation.

## Portfolio Overview

| App | Purpose | Price | Port (Dev) |
|-----|---------|-------|------------|
| **ScopeStack** | Scope creep documentation and change orders | CAD $49/mo | 3001/8001 |
| **RetainerPulse** | Retainer hours tracking with client visibility | CAD $39/mo | 3002/8002 |
| **ProposalForge** | Fast proposal building with reusable blocks | CAD $59/mo | 3003/8003 |
| **ClientBoard** | Async client status updates | CAD $29/mo | 3004/8004 |
| **LeadGate** | Lead qualification with smart scoring | CAD $29/mo | 3005/8005 |
| **DeliverProof** | Deliverable sign-off and approval tracking | CAD $49/mo | 3006/8006 |

**Target MRR**: CAD $12,000

## Directory Structure

```
saas-portfolio/
├── PORTFOLIO.md              # Complete portfolio design document
├── landing-page/             # Shared marketing landing page
│   ├── src/app/
│   └── package.json
├── apps/
│   ├── scopestack/
│   │   ├── TECHNICAL_SPEC.md
│   │   ├── frontend/
│   │   └── backend/
│   ├── retainerpulse/
│   ├── proposalforge/
│   ├── clientboard/
│   ├── leadgate/
│   └── deliverproof/
└── shared/
    ├── backend-requirements.txt
    └── frontend-config/
```

## Quick Start (Per App)

### Frontend
```bash
cd apps/[app-name]/frontend
npm install
npm run dev
```

### Backend
```bash
cd apps/[app-name]/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your values
uvicorn app.main:app --reload --port [port]
```

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, SQLAlchemy
- **Database**: PostgreSQL
- **Auth**: JWT + Magic Links
- **Payments**: Stripe (integration ready)

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo
2. Set root directory to `saas-portfolio/apps/[app-name]/frontend`
3. Add environment variables

### Backend (Render)
1. Connect GitHub repo
2. Set root directory to `saas-portfolio/apps/[app-name]/backend`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables

## Environment Variables

Each app requires:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 32+ character random string
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe CLI

## Remaining Work

See `PORTFOLIO.md` Section 8 for detailed handoff checklist and effort estimates.

**Total estimated hours**: 262 hours across all apps

## License

Proprietary - ConsultKit
