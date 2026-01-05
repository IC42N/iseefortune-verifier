# VERIFYING.md

This document explains how **anyone** can independently verify a winning number
using the public verifier tools in this repository.

No private data, secrets, or trusted servers are involved.

---

## What You Are Verifying

The winning number is derived from:

- A **Solana slot**
- The **finalized blockhash** for that slot
- A deterministic algorithm defined in `SPEC.md`

Given the same inputs, **everyone will always get the same result**.

---

## Canonical Example

These values are included in `vectors/vectors.json` and are used in CI:

- **Slot:** `432863999`
- **Blockhash:** `8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG`
- **Range:** `10`
- **Expected winning number:** `9`

---

## Verify Using Rust (CLI)

### Requirements
- Rust (stable)
- Git

### Steps
```bash
git clone https://github.com/IC42N/iseefortune-verifier.git
cd iseefortune-verifier

cargo run -- verify \
  --slot 432863999 \
  --blockhash 8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG
```

### Expected Output
```json
{
  "slot": 432863999,
  "blockhash": "8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG",
  "range": 10,
  "winning_number": 9
}
```

---

## Verify Using TypeScript

### Requirements
- Node.js 20+
- npm

### Steps
```bash
cd ts
npm ci

npm run verify -- \
  --slot 432863999 \
  --blockhash 8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG
```

### Expected Output
```json
{
  "winning_number": 9
}
```

---

## Verify All Test Vectors

### Rust
```bash
cargo test
```

### TypeScript
```bash
cd ts
npm run test:vectors
```

Both must pass for the implementation to be considered valid.

---

## Algorithm Definition

The exact algorithm, byte layout, and hashing rules are defined in:

👉 **SPEC.md**

This file intentionally does **not** redefine the algorithm — it only shows
how to verify results.

---

## Trust Model

- Inputs are public Solana blockchain data
- Code is open source
- Tests are deterministic
- CI enforces correctness on every commit

No authority, server, or maintainer approval is required.

---

## Questions or Issues?

If you believe there is a bug or discrepancy:

- Review `SPEC.md`
- Check `vectors/vectors.json`
- Follow the disclosure process in `SECURITY.md`
