# Intuthuko — Stokvel Management Platform

> *intuthuko* (isiZulu) — development, progress, growth

## Project Overview

Intuthuko is a next-generation digital stokvel management platform designed to serve South Africa's R50 billion stokvel market (800,000+ groups, 11M+ members).

## Research

### Stokfella.com Technical Teardown

| Area | Finding |
|------|--------|
| **Backend** | ASP.NET on Microsoft IIS 10.0 (Windows Server) |
| **Frontend** | Bootstrap 5 + jQuery 1.11.2 (1.2 MB single JS file) |
| **Mobile** | WebView wrapper around stokfella.mobi PWA |
| **Payments** | PayGate (Visa/Mastercard), EFT, Retail, Wallet, Debit Orders |
| **API** | Single monolithic ASMX endpoint (95+ methods, 206 AJAX calls) |
| **Developer** | PLURITONE (PTY) LTD, Bryanston, Sandton |
| **Licenses** | FSP48812 + Credit Provider NCRCP12735 |
| **Rating** | 3.0/5 (App Store) — chronic crash complaints |
| **Downloads** | 10K+ (0.09% market penetration after 10 years) |

### Research Files

- [`research/stokfella_research_report.html`](research/stokfella_research_report.html) — Full HTML report (open in browser)
- [Download PDF Report](https://codewords-uploads.s3.amazonaws.com/runtime_v2/4cf05ae958524e63b3849f560ddb41f801b98ffaf7664dbeac37ac63c1d5a606/Stokfella_Research_Report_May2026.pdf)

## Strategy

1. **WhatsApp-first** — Bot for contributions, reminders, balance checks
2. **Lightweight PWA** — Under 100 KB vs StokFella's 1.2 MB
3. **Zero fees to start** — Freemium model
4. **Bank partnerships** — Don't hold money, let banks handle compliance
5. **Township-first** — Low-end phones, spotty connectivity, expensive data

## Tech Stack (Planned)

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS (PWA)
- **Backend:** CodeWords microservices + Redis
- **Payments:** PayGate/Ozow (pass-through)
- **Comms:** WhatsApp bot
- **Hosting:** CodeWords (*.codewords.run)

---
Intuthuko Project (c) 2026
