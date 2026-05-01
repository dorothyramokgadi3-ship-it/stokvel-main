# Intuthuko Database Schema — Design Rationale

> "Every table is a tradition. Every field is a reason."

---

## Design Philosophy

This schema is built on one insight: **stokvels are not startups**. They're 
cultural institutions with 200+ years of history. The database must respect 
the rituals, language, and power structures that make stokvels work.

### Core Rules

1. **Money in cents, always.** `R500 = 50000`. No floating point. No rounding errors. 
   Gogo's R500 is exactly R500.

2. **Append-only for money.** Contributions and payouts are never edited or deleted. 
   Like ink in the physical book. Corrections create new entries with `REFUNDED` status.

3. **Roles match tradition.** `SECRETARY`, `TREASURER`, `CHAIR` — not `ADMIN`, `MODERATOR`, 
   `SUPERADMIN`. When Mama Nomsa sees "Unobhala" she knows exactly what it means.

4. **2-of-3 multisig.** No single person moves money. `PayoutApproval` implements the 
   traditional "two keys to the money box" pattern digitally.

5. **The ledger is public.** `LedgerEntry` creates a nightly hash chain. Anyone can 
   verify. "Book on the table" — but the table is the internet.

---

## Table Map — Tradition to Tech

| Tradition | Table | What It Represents |
|-----------|-------|-------------------|
| The Circle | `Group` | The stokvel itself — name, rules, cycle |
| The Members | `User` + `GroupMember` | People and their seats at the table |
| The Book | `Contribution` + `Payout` | Every rand in and out |
| The Key Box | `PayoutApproval` | 2-of-3 signatures to move money |
| The Nightly Close | `LedgerEntry` | SHA-256 proof published publicly |
| The Dispute Meeting | `Dispute` | Evidence-based conflict resolution |
| The Treasurer's Pocket | `Wallet` | Internal balance for instant transfers |
| The Record | `AuditLog` | Who did what, when, from where |

---

## Key Design Decisions

### Why `rotationPosition` on GroupMember?

In a rotating stokvel, **position is everything**. Position 1 gets paid first (January), 
position 12 gets paid last (December). This field:
- Determines the payout schedule
- Settles "whose turn is it?" disputes instantly
- Is `NULL` for non-rotating types (SAVINGS, BURIAL)
- Can only be changed with 3-of-3 admin consensus

### Why `forMonth` and `forCycle` on Contribution?

A member might pay late. They might pay early. They might pay twice. 
`forMonth` answers: "Which month is this payment FOR?" not "When was it made?"
`forCycle` answers: "Which rotation cycle?" — because stokvels run year after year.

### Why separate `Contribution` and `Payout`?

Money IN and money OUT are fundamentally different:
- **Contributions** come from members, via multiple payment methods, need proof
- **Payouts** go to members, need multisig approval, use different channels
- Combining them creates the kind of confused data model StokFella has

### Why `previousHash` on LedgerEntry?

Each entry links to the previous one, forming a hash chain. If anyone 
tampers with an old entry, the chain breaks. This is the "book that can't burn" 
— not because of blockchain buzzwords, but because SHA-256 chains are 
mathematically tamper-evident.

### Why `MemberStatus` has 6 states?

Traditional stokvels have nuanced membership:
- `INVITED` — door is open, haven't walked in
- `ACTIVE` — in good standing, paying on time
- `BEHIND` — missed 1-2, gentle nudge (not public shaming)
- `SUSPENDED` — missed 3+, frozen until caught up
- `LEFT` — chose to leave (dignity preserved)
- `REMOVED` — voted out (consensus, not dictator)

### Why `channel` on multiple tables?

Users interact via WhatsApp, web, or USSD. Knowing the channel:
- Helps format responses (WhatsApp gets emojis, USSD gets abbreviations)
- Tracks which interface drives engagement
- Is audit evidence ("approved via WhatsApp at 14:32")

### Why `GroupType` enum?

Not all stokvels are the same:
- **ROTATING**: Classic round-robin — each member gets the full pot once
- **SAVINGS**: Pool money all year, split in December (Christmas clubs)
- **BURIAL**: Emergency fund for funerals — no rotation, claim-based
- **INVESTMENT**: Pool and invest via licensed partner

Each type has different payout logic, but shares the same trust infrastructure.

---

## Indexes — Speed Where It Matters

Every index serves a real query pattern:

| Index | Query It Serves |
|-------|----------------|
| `users.phone` | Login: "Find user by phone number" |
| `groups.code` | Join: "Find group by join code MAS123" |
| `group_members.groupId + rotationPosition` | Circle view: "Show rotation order" |
| `contributions.groupId + forMonth` | Book: "All payments for May 2026" |
| `contributions.externalRef` | Webhook: "Ozow says TX123 succeeded" |
| `ledger_entries.dataHash` | Verify: "Does this hash exist?" |
| `audit_logs.groupId + createdAt` | History: "What happened in Masakhane today?" |

---

## Security Notes

1. **Bank account numbers** (`bankAccount`) must be encrypted at rest (Prisma middleware or column-level encryption)
2. **OTP codes** stored as bcrypt hashes, never plaintext
3. **ID numbers** (`idNumber`) encrypted, only decrypted for KYC verification
4. **Wallet balances** protected by row-level locks on transactions
5. **Audit logs** are immutable — no UPDATE or DELETE permissions on the `audit_logs` table

---

## Migration Path

```bash
# Generate migration
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed

# Generate client
npx prisma generate
```

---

*This schema handles R50 billion in annual stokvel contributions with 13 tables. 
StokFella needs 95+ endpoints because they didn't think about the data model first.*
