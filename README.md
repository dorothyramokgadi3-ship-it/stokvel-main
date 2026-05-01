# Intuthuko 🇿🇦

**Modern Stokvel Management Platform**

> *Intuthuko* (isiZulu: "development/progress") — Building the future of community savings in South Africa.

## The Opportunity

- **R50 billion** managed annually by stokvels
- **11.4 million** stokvel participants in SA
- **< 0.1%** market penetration by existing digital solutions
- **810,000+** active stokvel groups

## What is Intuthuko?

Intuthuko is a lightweight, WhatsApp-first stokvel management platform designed for South Africa's unique financial landscape. Unlike existing solutions that force users to download heavy apps, Intuthuko meets users where they already are — WhatsApp.

## Why Now?

The leading competitor (StokFella) has:
- ❌ 1.2 MB JavaScript bundle (expensive on R29/GB data)
- ❌ Chronic app crashes (every review mentions instability)
- ❌ No updates since May 2023
- ❌ Only ~10,000 downloads after 10 years
- ❌ No offline support
- ❌ No USSD fallback for feature phones

## Our Approach

### Phase 1: WhatsApp Bot MVP
- Create/join stokvel groups via WhatsApp
- Track contributions with automatic reminders
- Payment confirmation via photo upload
- Monthly payout scheduling

### Phase 2: Lightweight PWA
- Under 100 KB initial load (12x lighter than competition)
- Offline-first with service worker
- USSD fallback for feature phones
- Payment integration (Ozow, SnapScan, retail)

### Phase 3: Growth & Monetization
- Bank partnership (no FSP license needed)
- Freemium model (free core, R29/month premium)
- VAS: airtime, data, vouchers
- NASASA partnership

## Tech Stack

| Layer | Technology |
|-------|-----------|
| WhatsApp Bot | WhatsApp Business API |
| Frontend | React Native / PWA |
| Backend | Node.js / Python FastAPI |
| Database | PostgreSQL + Redis |
| Payments | Ozow + SnapScan + PayGate |
| Hosting | AWS / Railway |

## Research

See `/research` folder for the complete competitive intelligence report including:
- StokFella technical architecture teardown
- 95+ API endpoints mapped
- Payment flow analysis (5 methods)
- Security assessment
- Market opportunity analysis

## License

Proprietary — All rights reserved.

---

*Built with purpose. For the people. 🇿🇦*
