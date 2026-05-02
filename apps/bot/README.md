# Intuthuko WhatsApp Bot - Phase 1 MVP

The primary interface. Most users never open the web app.

## Commands

| Command | Action |
|---------|--------|
| `/join MAS123` | Join a stokvel |
| `/balance` | Check balances |
| `/pay` | Get payment options |
| `/book` | View public ledger |
| `/circle` | See payout rotation |
| `/groups` | List your stokvels |
| `/help` | Get help |
| Photo | Upload payment proof |

## Setup

1. Create a Meta WhatsApp Business App
2. `cp .env.example .env` and fill in credentials
3. `npm run db:migrate && npm run db:seed`
4. `npm run dev:bot`
5. Set webhook URL in Meta: `https://your-domain.com/webhook`

## Architecture

```
WhatsApp Cloud API -> Fastify webhook -> Message handler -> Prisma DB
                                       -> WhatsApp reply
```

Bot response target: <1 second.
