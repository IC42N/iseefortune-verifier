# I See Fortune Winning Number Verifier

A deterministic, open-source verifier for the **ISeeFortune** winning number.

This tool allows anyone to independently verify that a winning number was computed correctly using **public Solana data** — without trusting any server, API, or third party.

---

## What this verifier proves

Given:
- a **Solana slot**
- the **blockhash** for that slot

The verifier deterministically computes the winning number using a fixed, documented algorithm.

Anyone running this code with the same inputs will get the **exact same result**.

---

## RNG Algorithm (v1)

**Inputs**
- `slot` (u64)
- `blockhash` (base58-encoded, 32 bytes when decoded)

**Steps**
1. Base58-decode the blockhash into raw bytes.
2. Compute:
   ```
   SHA256( slot_le_bytes || blockhash_bytes )
   ```
3. Sum all 32 bytes of the SHA-256 digest.
4. Compute:
   ```
   winning_number = sum % 10
   ```

**Output**
- A digit from **0–9**

This algorithm is fully deterministic and uses only public, immutable blockchain data.

---

## Installation

### Requirements
- Rust (stable)

Install Rust if needed:
```bash
https://rustup.rs
```

Clone the repository:
```bash
git clone <REPO_URL>
cd iseefortune-verifier
```

---

## Usage

### Verify a winning number

```bash
cargo run -- --slot <SLOT> --blockhash <BLOCKHASH>
```

Example:
```bash
cargo run -- \
  --slot 432863999 \
  --blockhash 8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG
```

### Output (default)

```json
{
  "rng_version": "v1",
  "slot": 432863999,
  "blockhash": "8RVJGofM2C3RhhpmveXAwzSQdaN6CGg3M1sBuqS6sXJG",
  "winning_number": 9
}
```

---

## Debug / Audit Mode

For full transparency, enable `--debug`:

```bash
cargo run -- --slot <SLOT> --blockhash <BLOCKHASH> --debug
```

This prints additional derivation details:

```json
{
  "rng_version": "v1",
  "slot": 432863999,
  "blockhash": "...",
  "winning_number": 9,
  "debug": {
    "digest_sha256": "...",
    "digest_sum_u64": 4369
  }
}
```

This mode is intended for auditors and advanced users.

---

## Test Vectors (Proof of Correctness)

Known-good inputs and outputs are stored in:

```
testVectors/testVectors.json
```

Each entry represents a real `(slot, blockhash)` pair with its expected winning number.

Run all verification tests:

```bash
cargo test
```

If tests pass, the verifier logic **exactly matches** the documented algorithm.

These tests run automatically on every commit via CI.

---

## RNG Versioning

This verifier currently supports:
- **`rng_version: v1`**

If the algorithm ever changes, a new version will be introduced.
All previous versions and testVectors will remain supported and verifiable.

---

## Trust Model

- No RPC calls
- No external services
- No hidden state
- No mutable inputs

The verifier is:
- deterministic
- reproducible
- auditable
- tamper-evident via test testVectors

You do not need to trust ISeeFortune — only the code and the blockchain.

---

## License

MIT

