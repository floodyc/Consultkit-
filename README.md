# ConsultKit

**Operational tools that protect margins and reduce friction for agencies, consultancies, and client-service businesses.**

ConsultKit is a SaaS portfolio consisting of **HVACplus** (a professional HVAC load calculation tool) and a **6-app suite** designed for professional services firms.

## Portfolio Overview

### HVACplus

A professional HVAC load calculation tool that uses AI to extract building geometry from floorplans and perform ASHRAE-compliant heating/cooling calculations.

**Key Features:**
- AI-powered geometry extraction from floorplan images
- ASHRAE heat balance calculations
- 3D model visualization
- Professional PDF/Excel report generation
- gbXML export for BIM integration

**Tech Stack:** Next.js 14, FastAPI, PostgreSQL, OpenCV

### SaaS Portfolio (6 Apps)

| App | Purpose | Price |
|-----|---------|-------|
| **ScopeStack** | Scope creep documentation and change orders | CAD $49/mo |
| **RetainerPulse** | Retainer hours tracking with client visibility | CAD $39/mo |
| **ProposalForge** | Fast proposal building with reusable blocks | CAD $59/mo |
| **ClientBoard** | Async client status updates | CAD $29/mo |
| **LeadGate** | Lead qualification with smart scoring | CAD $29/mo |
| **DeliverProof** | Deliverable sign-off and approval tracking | CAD $49/mo |

See [saas-portfolio/PORTFOLIO.md](saas-portfolio/PORTFOLIO.md) for detailed specifications.

## Project Structure

```
Consultkit-/
├── src/                    # HVACplus Next.js frontend
├── backend/                # HVACplus FastAPI backend
├── saas-portfolio/         # 6-app SaaS portfolio
│   ├── PORTFOLIO.md        # Complete design document
│   ├── README.md           # Portfolio quick start
│   ├── landing-page/       # Shared marketing page
│   ├── apps/               # Individual applications
│   │   ├── scopestack/
│   │   ├── retainerpulse/
│   │   ├── proposalforge/
│   │   ├── clientboard/
│   │   ├── leadgate/
│   │   └── deliverproof/
│   └── shared/             # Shared configs and deps
├── public/                 # Static assets
├── package.json            # Frontend dependencies
└── requirements.txt        # Backend dependencies
```

## Quick Start

### HVACplus

#### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL

#### Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp ../.env.example .env
# Edit .env with your database URL and secrets

# Run development server
uvicorn app.main:app --reload --port 8000
```

### SaaS Portfolio Apps

Each app in `saas-portfolio/apps/` follows the same structure:

```bash
# Frontend (port 3001-3006)
cd saas-portfolio/apps/[app-name]/frontend
npm install
npm run dev

# Backend (port 8001-8006)
cd saas-portfolio/apps/[app-name]/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port [port]
```

**Development Ports:**
| App | Frontend | Backend |
|-----|----------|---------|
| ScopeStack | 3001 | 8001 |
| RetainerPulse | 3002 | 8002 |
| ProposalForge | 3003 | 8003 |
| ClientBoard | 3004 | 8004 |
| LeadGate | 3005 | 8005 |
| DeliverProof | 3006 | 8006 |

## Environment Variables

### HVACplus Backend
```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your-super-secret-key-min-32-characters
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### SaaS Apps
```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-32-character-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, React 18 |
| Backend | FastAPI, Python 3.9+, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| Auth | JWT + Magic Links |
| Payments | Stripe |
| Deployment | Vercel (frontend), Railway/Render (backend) |

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set root directory (e.g., `saas-portfolio/apps/scopestack/frontend`)
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set root directory (e.g., `saas-portfolio/apps/scopestack/backend`)
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
npm test
```

### Code Style
- TypeScript with strict mode
- Python with type hints
- Tailwind CSS for styling

## Documentation

- [HVACplus Backend API](backend/README.md)
- [SaaS Portfolio Overview](saas-portfolio/README.md)
- [Portfolio Design Document](saas-portfolio/PORTFOLIO.md)
- [ScopeStack Technical Spec](saas-portfolio/apps/scopestack/TECHNICAL_SPEC.md)

## License

Proprietary - ConsultKit
