# schemas/ — MC96 + Consent Protocol Schemas

This folder contains the canonical TypeScript schema definitions for the NOIZY Empire's MC96 envelope protocol and consent token system.

## Files

| File | Purpose |
|------|---------|
| mc96-envelope.ts | MC96 message envelope contract |
| consent-token.ts | Consent token schema + validation |
| never-clause.ts | Never clause type definitions |
| voice-actor.ts | Voice actor registration schema |
| synth-request.ts | Voice synthesis request schema |
| ledger-event.ts | Immutable audit ledger event schema |

## MC96 Envelope

Every inter-system message in the NOIZY Empire routes through the MC96 envelope:

```typescript
interface MC96Envelope {
  id: string;           // UUID v4
  version: '1.0';
  timestamp: string;    // ISO 8601
  source: string;       // originating actor ID
  target: string;       // destination system
  type: string;         // message type
  payload: unknown;     // typed per message type
  receiptRef: string;   // traceable receipt reference
  covenant: '75/25';    // invariant
}
```

## Consent Token

```typescript
interface ConsentToken {
  id: string;
  actorId: string;      // RSP_001 format
  grantedBy: string;    // who issued
  grantedAt: string;    // ISO 8601
  expiresAt: string | null;
  scope: string[];      // permitted use cases
  neverClauses: NeverClause[];
  status: 'active' | 'revoked' | 'expired';
  revokedAt?: string;
  revokedBy?: string;
}
```

## Never Clause Types

```typescript
type NeverClauseCode =
  | 'NC_POLITICAL'
  | 'NC_SEXUAL'
  | 'NC_WEAPONS'
  | 'NC_DECEPTION'
  | 'NC_HATE'
  | 'NC_TRANSFER'
  | 'NC_SURVEILLANCE'
  | 'NC_SYSTEM_INTEGRITY'
  | 'NC_SYSTEM_TRANSFER';

interface NeverClause {
  code: NeverClauseCode;
  description: string;
  immutable: true;
}
```

killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
