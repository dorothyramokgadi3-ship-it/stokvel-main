# INTUTHUKO — Full Web App Structure

> Built for psychology, tradition, and that R50B gap StokFella left open.
> No crypto exposure, just ledger transparency.

---

## 1. Core Principles — Why This Structure Beats StokFella

| Principle | StokFella's Sin | Intuthuko's Fix | Human Reason |
|-----------|----------------|-----------------|--------------|
| **Light > Heavy** | 1.2MB JS bundle | <100KB initial load, code-split | R29/GB respect |
| **Offline > Online** | Crashes with no data | Service Worker + IndexedDB first | Load-shedding reality |
| **Ritual > Feature** | 95 endpoints = confusion | 5 core actions max per screen | Gogo shouldn't feel stupid |
| **Verify > Trust** | Black-box localStorage | Public ledger hashes nightly | "Book on the table" tradition |
| **WhatsApp > App Store** | Force 70MB download | Bot first, PWA optional | Trust lives in WhatsApp |

---

## 2. Tech Stack — Modern, Boring, Reliable

| Layer | Tech | Why | StokFella Equivalent |
|-------|------|-----|---------------------|
| **Frontend** | Next.js 15 + React 19, TypeScript, Tailwind | SSR for SEO, RSC for speed, shippable PWA | jQuery 1.11.2 SPA |
| **State** | Zustand + TanStack Query | <3KB, offline cache, no Redux hell | 158 localStorage keys |
| **Offline** | Workbox Service Worker + IndexedDB via Dexie.js | Full app works in airplane mode, syncs later | None |
| **Backend** | Node.js + Fastify + tRPC | Type-safe API, 3x faster than Express, no REST debt | ASMX monolith |
| **DB** | PostgreSQL + Prisma | ACID for money, JSONB for flexibility | Unknown |
| **Auth** | WhatsApp OTP via Meta Cloud API + JWT httpOnly cookies | No passwords, no localStorage tokens | Base64 in localStorage |
| **Payments** | Ozow, PayShap, SnapScan, Retail vouchers via Flash | Instant EFT + R24k cash rails. Bank holds funds | PayGate + manual EFT |
| **Ledger** | Nightly SHA-256 hash → Bitcoin OP_RETURN + IPFS + Tweet | Immutable public proof, ZAR stays in bank | None |
| **Infra** | Vercel Edge + Supabase + Cloudflare R2 | Global, cheap, scales to 11M users | IIS server |
| **USSD** | Africa's Talking fallback `*120*INTUTHUKO#` | Feature phone support | None |

**Total initial JS:** ~85KB gzipped. **12x cheaper** than StokFella per load.

---

## 3. Application Architecture

```
intuthuko/
├── apps/
│   ├── web/                  # Next.js PWA - Admin dashboard
│   ├── bot/                  # WhatsApp bot - Cloud API webhooks
│   └── ussd/                 # Africa's Talking USSD handlers
├── packages/
│   ├── api/                  # tRPC routers, shared backend logic
│   ├── db/                   # Prisma schema, migrations
│   ├── ledger/               # Hashing + timestamping service
│   ├── auth/                 # JWT, OTP, session logic
│   ├── ui/                   # Shared React components, Tailwind
│   └── config/               # ESLint, TSConfig, env
└── services/
    ├── cron/                 # Nightly book closing, reminders
    └── webhooks/             # Ozow/PayShap payment callbacks
```

**Key idea:** Monorepo. Share types between bot, web, and USSD. One `Group` type, not 3 different versions.

---

## 4. User Roles & Permissions — Match Stokvel Tradition

| Role | Traditional Name | Permissions | Multisig? |
|------|-----------------|-------------|-----------|
| **Member** | Umhlanganyeli | View balance, pay, see ledger, request payout | No |
| **Secretary** | Unobhala | Add/remove members, post notices, close book | 1 of 5 |
| **Treasurer** | Umgcinimafa | Initiate payouts, approve withdrawals | 1 of 5 |
| **Chair** | Usihlalo | Dispute resolution, override with 3 votes | 1 of 5 |
| **Auditor** | Umcwaningi mabhuku | Read-only all groups, export, verify hashes | No |

**Cultural rule:** No single person can move money. Minimum 2-of-3 admins for payouts. Same as "2 keys to the money box".

---

## 5. Core User Flows — Web App Screens

### Public/Marketing
1. `/` — Landing: "Your stokvel, with a book no one can burn"
2. `/how-it-works` — 3 steps: Join WhatsApp → Pay → We publish proof
3. `/verify` — Paste any receipt hash, see it on public ledger

### Auth
4. `/login` — Enter phone → WhatsApp OTP → httpOnly cookie. No passwords
5. `/onboard` — Create group or join with code from admin

### Member Dashboard — 5 Things Only
6. `/app` — *Circle View*: Your group, progress to next payout, your turn date
7. `/app/pay` — Pay now: Ozow button, retail voucher, proof upload
8. `/app/book` — Public Ledger: Daily hashes, click to verify, download PDF
9. `/app/members` — Who paid, who's late. No shame, just facts
10. `/app/help` — Voice note FAQs in Zulu/Xhosa/Sotho/English

### Admin Dashboard
11. `/app/admin` — Overview: Total pot, next payout, alerts
12. `/app/admin/members` — Add/remove, set contribution R200, set order
13. `/app/admin/payouts` — Initiate payout → needs 2 more admin approvals
14. `/app/admin/book` — Close book nightly, see hash, share to WhatsApp
15. `/app/admin/settings` — Change 2-of-3 signers, payout dates, rules

**That's it. 15 routes total.** StokFella has 95+ endpoints. We have 5 actions people actually do.

---

## 6. API Structure — tRPC, Not REST

All type-safe. Frontend knows exactly what backend returns. No docs needed.

```typescript
// packages/api/src/routers/group.ts
export const groupRouter = router({
  create: adminProcedure
    .input(z.object({ name: z.string(), monthly: z.number() }))
    .mutation(async ({ ctx, input }) => { ... }),
  
  getCircle: memberProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Returns: potTotal, nextPayoutMember, nextPayoutDate, 
      // myPaidStatus, ledgerHashToday
    }),
  
  pay: memberProcedure
    .input(z.object({ groupId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create Ozow payment link
      // 2. Return link + temp receipt ID
    }),
  
  closeBook: secretaryProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Hash today's transactions
      // 2. Queue ledger.publish() job
      // 3. Post to WhatsApp group
    }),
});
```

**Webhook:** `/api/webhooks/ozow` → On payment success → Update DB → Post "✅ Mama Nomsa paid" to WhatsApp + ledger queue.

---

## 7. Ledger Service — The "Open Book Protocol"

`packages/ledger/`

1. **Cron 8pm SAST:** `cron/closeBooks.ts`
   - For each active group: `SELECT SUM(amount) FROM contributions WHERE date=today`
   - Create CSV: `date,member,amount,txref`
   - `hash = SHA256(csv)`

2. **Publish:** `ledger/publish.ts`
   - Write hash to Bitcoin via OP_RETURN ~R0.50
   - Pin CSV to IPFS via Web3.Storage
   - Tweet: "Intuthuko 2026-05-01: 12,401 groups closed. Merkle root: a7f3c9..."

3. **Verify endpoint:** `GET /api/ledger/verify?hash=a7f3c9`
   - Returns: Bitcoin TX, IPFS link, timestamp, group count
   - Anyone can re-hash the CSV to check

**Result:** Bank holds ZAR. Ledger holds proof. Members hold trust.

---

## 8. WhatsApp Bot Commands — The Real UI

Most users never open the web app. Bot is primary:

| Command | Action | Psychology |
|---------|--------|-----------|
| `/join MAS123` | Join Masakhane group | Like walking into meeting |
| `/balance` | Shows: "Pot: R12,400. You: Paid. Next: Khethiwe 15 May" | Reading the book aloud |
| `/pay` | Replies with Ozow link + retail code | Handing money to treasurer |
| `/book` | Sends today's PDF + verify link | "Pass the book around" |
| `/circle` | Progress image: 80% to next payout | Dream bar, but for group |
| `/help` | Voice note in your language | Elder explaining rules |

**Bot stack:** Meta WhatsApp Cloud API → Fastify webhook → tRPC call → Reply. <1s response.

---

## 9. Offline Strategy — For Load-Shedding SA

1. **PWA install:** "Add to Home Screen" = 1-tap, no App Store
2. **IndexedDB:** Last 90 days of ledger cached. View balance offline
3. **Outbox pattern:** Tap "Pay" offline → Queued. When online, auto-submits + notifies
4. **USSD:** `*120*INTUTHUKO#` → Check balance, get retail pay code. No data needed

**StokFella dies without signal. Intuthuko works by candlelight.** That's traditional.

---

## 10. Security — Unlearn StokFella's Sins

| StokFella Issue | Intuthuko Fix |
|----------------|--------------|
| Auth in localStorage | httpOnly JWT cookies + CSRF. XSS can't steal |
| Base64 "encryption" | TLS 1.3 + AES-256 at rest. Hashes are public, amounts private |
| Public UAT | Staging behind VPN. Prod secrets in Vercel env |
| jQuery 1.11 XSS | React + DOMPurify. Dependencies scanned weekly |
| Single point treasurer | 2-of-3 multisig for payouts. Social recovery |

---

## 11. Monetization — Don't Be Extractive

- **Free Core:** Create group, collect, payout, public ledger. Forever.
- **R29/month/group Premium:** SMS reminders, bank interest sweep, priority support, custom rules
- **VAS:** 2% on airtime/data sold via bot. Members save, we earn.
- **Bank Rev Share:** Partner bank pays us R2/account/month for deposits. We don't touch money.

**Rule:** If a traditional stokvel wouldn't charge for it, we don't. We monetize convenience, not access.

---

## 12. Launch Plan — Psychology First

### Week 1-4: NASASA + Church Halls
Don't buy Facebook ads. Go to 10 NASASA meetings. Demo "book that can't burn". Get 10 chairladies to pilot. Their blessing > 10k downloads.

### Week 5-8: WhatsApp Virality
Every `/closebook` post ends with: "Protected by Intuthuko. Start yours: wa.me/..."
Admin pride = growth. "Our book is public" becomes status.

### Week 9-16: Bank Partner
Once 1000 groups, R20M monthly flow → Nedbank/FNB will beg for trust account. You now have negotiating power StokFella never had.

---

**Bottom line:** StokFella built fintech for bankers. *Intuthuko builds tradition for people*, with tech hidden underneath.

The structure above ships in 8 weeks with 3 devs. Because it's simple. Stokvels are simple. The tech should be too.
