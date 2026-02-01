# ConsultKit - SaaS Portfolio Design Document

## 1. Umbrella Brand and Portfolio Strategy

### Brand Name
**ConsultKit**

### One-Sentence Positioning
Operational tools that protect margins and reduce friction for agencies, consultancies, and client-service businesses.

### Shared Buyer Persona
**Primary**: Owner/operator of a 1-15 person professional services firm (marketing agency, design studio, development shop, management consultancy, freelance consultant).

**Demographics**:
- Revenue: CAD 150K - 2M annually
- Team: 1-15 people
- Clients: 5-30 active clients at any time
- Tools budget: CAD 200-800/month on SaaS

**Psychographics**:
- Time-starved, client work always comes first
- Margin-conscious (every hour matters)
- Burned by scope creep, late payments, or bad-fit clients before
- Pragmatic about tools (will pay for anything that saves real time or protects revenue)
- Not interested in "platforms" - wants focused tools that solve specific problems

**Why they buy multiple tools**:
This persona operates the full client lifecycle daily: lead qualification, proposals, project management, scope tracking, approvals, and billing. Pain points exist at every stage. A tool that solves one problem earns trust for solving adjacent problems.

---

## 2. Six App Concepts Overview

| # | App Name | Target Pain | Price Point | MVP Weeks | Portfolio Role |
|---|----------|-------------|-------------|-----------|----------------|
| 1 | **ScopeStack** | Scope creep destroys margins | CAD 49/mo | 3-4 | Entry |
| 2 | **RetainerPulse** | Retainer hour disputes | CAD 39/mo | 3 | Multiplier |
| 3 | **ProposalForge** | Proposals take forever | CAD 59/mo | 4-5 | Entry |
| 4 | **ClientBoard** | "Where are we?" emails | CAD 29/mo | 2-3 | Multiplier |
| 5 | **LeadGate** | Time wasted on bad-fit leads | CAD 29/mo | 2-3 | Entry |
| 6 | **DeliverProof** | Approval disputes block payment | CAD 49/mo | 3-4 | Anchor |

### Revenue Distribution Expectation

| App | Expected MRR Contribution | Rationale |
|-----|---------------------------|-----------|
| ScopeStack | CAD 3,500 | Highest pain, clear ROI |
| ProposalForge | CAD 2,500 | Frequent use, visible value |
| DeliverProof | CAD 2,000 | High stickiness, payment-critical |
| RetainerPulse | CAD 1,500 | Niche but intense pain |
| ClientBoard | CAD 1,500 | Low price, higher volume |
| LeadGate | CAD 1,000 | Top of funnel, lower urgency |
| **Total** | **CAD 12,000** | |

---

## 3. Single Shared Landing Page Design

### Hero Section

**Headline**: "Tools that protect your margins and your sanity"

**Subheadline**: "Six focused apps for agencies and consultancies. Stop scope creep. Eliminate status update emails. Get paid without disputes."

**Primary CTA**: "See All Tools" (anchor scroll to app grid)

**Secondary CTA**: "Start with ScopeStack Free Trial"

### Portfolio Overview Section

**Section Headline**: "Built for how client work actually happens"

**Copy**: "ConsultKit is a suite of small, sharp tools that solve real problems in client-service businesses. Each app stands alone. Use one or use all six. No bloated platforms. No features you'll never use."

**Visual**: Timeline showing client lifecycle with each app positioned at its relevant stage:
```
Lead → Qualify (LeadGate) → Propose (ProposalForge) → Agree (ScopeStack) →
Execute (ClientBoard, RetainerPulse) → Deliver (DeliverProof) → Get Paid
```

### Individual App Blocks (6 cards)

Each card contains:
- App icon/logo
- App name
- One-sentence value prop
- Price
- "Learn More" CTA
- "Start Free Trial" CTA

**Card Order** (by typical user journey):
1. LeadGate - "Stop wasting calls on bad-fit leads"
2. ProposalForge - "Send proposals in minutes, not hours"
3. ScopeStack - "Document scope changes before they kill your margin"
4. ClientBoard - "End 'where are we?' emails forever"
5. RetainerPulse - "Track retainer hours with client visibility"
6. DeliverProof - "Get sign-offs that stick"

### Cross-Sell Logic Section

**Section Headline**: "Better together (but not required)"

**Copy**: "Using ScopeStack? DeliverProof makes sure those agreed changes actually get signed off. Running RetainerPulse? ClientBoard gives your clients async visibility without burning your hours."

**Visual**: Connection diagram showing natural pairings:
- LeadGate → ProposalForge (qualified lead to proposal)
- ScopeStack → DeliverProof (scope agreement to deliverable sign-off)
- RetainerPulse → ClientBoard (hour tracking with status visibility)

### Primary CTA Strategy

**Main conversion paths**:
1. Free trial on any individual app (14 days, credit card required)
2. "Starter Bundle" - any 2 apps at 20% off
3. "Full Suite" - all 6 apps at 35% off

**Exit intent**: "Before you go - which problem hurts most?" (quiz leading to app recommendation)

---

## 4. Product Definitions

### 4.1 ScopeStack

**One-Sentence Positioning**: Document every scope discussion so scope creep can't sneak past.

**Core Features** (max 5):
1. Scope item log with timestamps and client attribution
2. Change request workflow with approval tracking
3. Impact calculator (hours/cost delta per change)
4. Client-facing change request portal
5. Export to PDF for contracts/invoices

**Explicit Non-Features**:
- Full project management (use Asana, Notion, etc.)
- Time tracking (use RetainerPulse or Harvest)
- Invoicing (use QuickBooks, Stripe, etc.)
- Contract generation (use PandaDoc, etc.)

**Pricing and Revenue Logic**:
- Free: 1 project, 10 scope items
- Starter: CAD 49/mo - 5 projects, unlimited scope items
- Pro: CAD 99/mo - unlimited projects, team access, priority support
- Target: 70 paying users × CAD 50 avg = CAD 3,500 MRR

**Path to First 10 Paying Users**:
1. Week 1-2: Direct outreach to 50 agency owners in personal network + LinkedIn
2. Week 2-3: Post in agency owner communities (Agency Hackers, Slack groups)
3. Week 3-4: Create "Scope Creep Calculator" content piece, promote via Twitter/LinkedIn
4. Target: 100 trials → 10 conversions (10% conversion)

**Portfolio Role**: **Entry** - High pain, clear ROI, natural starting point for buyers.

---

### 4.2 RetainerPulse

**One-Sentence Positioning**: Track retainer hours with client transparency so no one is surprised at invoice time.

**Core Features** (max 5):
1. Hour logging by client/project with categorization
2. Real-time burn rate dashboard (for you and optionally clients)
3. Threshold alerts (80% used, 100% used, overage)
4. Monthly rollover configuration
5. Client-facing portal with usage visibility

**Explicit Non-Features**:
- Full time tracking for all work (use Toggl, Harvest)
- Invoicing
- Staff time/attendance management
- Detailed task-level tracking

**Pricing and Revenue Logic**:
- Free: 1 client retainer
- Starter: CAD 39/mo - 10 client retainers
- Pro: CAD 79/mo - unlimited retainers, team members, API access
- Target: 40 paying users × CAD 37 avg = CAD 1,500 MRR

**Path to First 10 Paying Users**:
1. Target SEO/content agencies (high retainer model prevalence)
2. Reddit/Twitter threads on "retainer management horror stories"
3. Cold DM to agencies advertising retainer packages on their websites
4. Guest post on agency-focused blogs about retainer management

**Portfolio Role**: **Multiplier** - Pairs naturally with ScopeStack (scope + hours = full margin protection).

---

### 4.3 ProposalForge

**One-Sentence Positioning**: Build and send professional proposals in 10 minutes using reusable blocks.

**Core Features** (max 5):
1. Block-based proposal builder (drag/drop sections)
2. Reusable block library (about, services, pricing, terms)
3. Variable insertion (client name, dates, custom pricing)
4. Client-facing proposal viewer with accept button
5. Proposal analytics (opens, time spent, acceptance)

**Explicit Non-Features**:
- E-signature (recommend DocuSign integration later)
- Contract management
- CRM functionality
- Payment collection

**Pricing and Revenue Logic**:
- Free: 3 proposals/month
- Starter: CAD 59/mo - 25 proposals/month, custom branding
- Pro: CAD 119/mo - unlimited proposals, team access, analytics
- Target: 45 paying users × CAD 55 avg = CAD 2,500 MRR

**Path to First 10 Paying Users**:
1. "Proposal teardown" content - analyze real agency proposals publicly
2. Free proposal template pack (PDF) as lead magnet
3. Target freelance platforms (Toptal, Catalant) where proposal quality matters
4. Partnership with freelance coach/community

**Portfolio Role**: **Entry** - Early in client lifecycle, high frequency use, visible value.

---

### 4.4 ClientBoard

**One-Sentence Positioning**: Give clients project visibility without giving up your time.

**Core Features** (max 5):
1. Simple project status board (customizable stages)
2. Async updates with timestamp and optional attachments
3. Client-facing read-only portal (no login required, magic link)
4. @mentions and internal notes (hidden from client)
5. Weekly digest emails to clients (automated)

**Explicit Non-Features**:
- Full project management
- Task assignment for team
- Time tracking
- File storage/management

**Pricing and Revenue Logic**:
- Free: 2 active projects
- Starter: CAD 29/mo - 10 active projects
- Pro: CAD 59/mo - unlimited projects, custom branding, multiple team members
- Target: 50 paying users × CAD 30 avg = CAD 1,500 MRR

**Path to First 10 Paying Users**:
1. "End status update emails" messaging on Twitter/LinkedIn
2. Target agencies complaining about client communication in public
3. Template: "Here's exactly what to send clients instead of weekly calls"
4. Integration partnerships with project management tools

**Portfolio Role**: **Multiplier** - Pairs with RetainerPulse (visibility without burning hours).

---

### 4.5 LeadGate

**One-Sentence Positioning**: Qualify leads before you get on a call so you stop wasting time on bad fits.

**Core Features** (max 5):
1. Smart intake form builder (conditional logic, scoring)
2. Lead scoring based on custom criteria
3. Auto-routing (qualified → calendar, unqualified → resource/rejection)
4. CRM-lite: lead list with status and notes
5. Embeddable form and hosted page options

**Explicit Non-Features**:
- Full CRM
- Email marketing
- Sales automation
- Calendar scheduling (integrate with Calendly/Cal.com)

**Pricing and Revenue Logic**:
- Free: 1 intake form, 20 leads/month
- Starter: CAD 29/mo - 3 forms, 100 leads/month
- Pro: CAD 59/mo - unlimited forms, unlimited leads, API access
- Target: 35 paying users × CAD 29 avg = CAD 1,000 MRR

**Path to First 10 Paying Users**:
1. "Bad discovery call calculator" - how much you lose on bad-fit calls
2. Target coaches and consultants (high call volume, solo operators)
3. Freelance community partnerships
4. "Intake form teardown" content

**Portfolio Role**: **Entry** - Top of funnel, low price, high volume potential.

---

### 4.6 DeliverProof

**One-Sentence Positioning**: Get deliverable approvals on record so "I never approved that" never blocks payment.

**Core Features** (max 5):
1. Deliverable upload with versioning
2. Approval workflow (request → review → approve/reject)
3. Timestamped approval records with IP logging
4. Client-facing approval portal
5. Approval history export for invoicing/disputes

**Explicit Non-Features**:
- File storage (use Dropbox, Google Drive)
- Full proofing/annotation (use Frame.io, Filestage)
- Project management
- Invoicing

**Pricing and Revenue Logic**:
- Free: 5 deliverables/month
- Starter: CAD 49/mo - 30 deliverables/month
- Pro: CAD 99/mo - unlimited deliverables, team access, custom branding
- Target: 40 paying users × CAD 50 avg = CAD 2,000 MRR

**Path to First 10 Paying Users**:
1. Target design agencies (frequent deliverable disputes)
2. "How I stopped approval disputes" case study content
3. Reddit threads about clients not paying after delivery
4. Partnership with creative agency communities

**Portfolio Role**: **Anchor** - Highest stickiness (historical records critical), pairs with ScopeStack.

---

## 5. Technical Design (see individual app specifications)

## 6. Code Scaffolding (see individual app directories)

## 7. Portfolio Cross-Sell Summary

### In-App Cross-Promotion Points

| App | Promotion Point | Promoted App |
|-----|-----------------|--------------|
| ScopeStack | After creating change request | DeliverProof ("Get sign-off on this change") |
| ScopeStack | Dashboard sidebar | RetainerPulse ("Track hours for this scope") |
| RetainerPulse | Client portal | ClientBoard ("Give clients project visibility too") |
| ClientBoard | After posting update | DeliverProof ("Need approval on this deliverable?") |
| LeadGate | After qualified lead | ProposalForge ("Send a proposal now") |
| ProposalForge | After proposal accepted | ScopeStack ("Document the agreed scope") |
| DeliverProof | After approval | ScopeStack ("Scope changes for next phase?") |

### Email Cross-Sell Triggers

| Trigger Event | Email Content | Delay |
|---------------|---------------|-------|
| ScopeStack: 5th scope item added | "Scope changes often mean deliverable disputes. Try DeliverProof free." | 3 days |
| ProposalForge: 3rd proposal accepted | "You're closing deals. Protect your margins with ScopeStack." | 1 day |
| RetainerPulse: First overage alert | "Clients asking 'what did we get?' Try ClientBoard." | Same day |
| DeliverProof: 10th approval | "Approvals are smooth. Qualify leads better with LeadGate." | 7 days |
| Any app: 30-day active usage | "Your ConsultKit bundle saves 20%." | Day 30 |

### Bundle Logic

| Bundle | Apps | Discount | Monthly Price |
|--------|------|----------|---------------|
| Scope Protection | ScopeStack + DeliverProof | 20% | CAD 78 (vs 98) |
| Client Visibility | RetainerPulse + ClientBoard | 20% | CAD 54 (vs 68) |
| Sales Machine | LeadGate + ProposalForge | 20% | CAD 70 (vs 88) |
| Full Suite | All 6 apps | 35% | CAD 165 (vs 254) |

### CAC Reduction Rationale

1. **Shared brand trust**: Each satisfied user is pre-warmed for other apps
2. **Workflow adjacency**: Apps naturally lead to each other in daily work
3. **Single account**: One login, one billing relationship reduces friction
4. **Bundle incentives**: Discount on additional apps rewards expansion
5. **Shared content marketing**: One content engine serves all apps

### Failure Containment Strategy

- Each app has independent infrastructure (can fail independently)
- Billing is centralized but app access is per-app (one payment failure doesn't kill all access)
- Brand reputation issues in one app are contained (each app has its own name)
- Technical debt in one app doesn't spread
- Can sunset underperforming apps without portfolio impact

---

## 8. Handoff Summary

### Per-App Checklist (repeated for each)

**Repository Setup**:
1. Create GitHub repository (private)
2. Push scaffolded code
3. Add .env.example documentation
4. Configure branch protection

**Secrets Configuration**:
1. DATABASE_URL (Postgres connection string)
2. JWT_SECRET (generate 32-char random)
3. STRIPE_SECRET_KEY (from Stripe dashboard)
4. STRIPE_WEBHOOK_SECRET (from Stripe CLI)
5. SMTP credentials (for magic link emails)

**Deployment Steps**:
1. Frontend: Vercel (connect repo, add env vars)
2. Backend: Render (connect repo, configure Python, add env vars)
3. Database: Render Postgres or Supabase
4. Configure custom domain

### Remaining Effort Estimates

| App | Backend Hours | Frontend Hours | Total Hours |
|-----|---------------|----------------|-------------|
| ScopeStack | 20 | 25 | 45 |
| RetainerPulse | 15 | 20 | 35 |
| ProposalForge | 25 | 30 | 55 |
| ClientBoard | 12 | 18 | 30 |
| LeadGate | 18 | 22 | 40 |
| DeliverProof | 20 | 25 | 45 |
| **Shared Landing Page** | 0 | 12 | 12 |
| **Total** | **110** | **152** | **262** |

**Recommended Build Order**:
1. ClientBoard (simplest, fastest to market, proves pattern)
2. LeadGate (simple, top of funnel, drives leads for other apps)
3. ScopeStack (highest value, largest audience pain)
4. DeliverProof (pairs with ScopeStack, completes scope workflow)
5. RetainerPulse (niche but loyal audience)
6. ProposalForge (most complex, highest feature expectations)
