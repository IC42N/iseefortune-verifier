# ISeeFortune RNG Specification

## Status
- Version: v1
- Status: Stable
- Normative: Yes

This document defines the canonical algorithm used to derive the ISeeFortune winning number.
Any implementation claiming compatibility with `rng_version = v1` MUST follow this specification exactly.

---

## 1. Purpose

The purpose of this specification is to define a deterministic, publicly verifiable method for
deriving a winning number using immutable Solana blockchain data.

The algorithm is designed to be:
- deterministic
- reproducible
- auditable
- independent of trusted servers or private state

---

## 2. Inputs

An implementation MUST accept the following inputs:

### 2.1 Slot
- Type: unsigned 64-bit integer (u64)
- Description: The Solana slot selected for RNG
- Encoding: Little-endian byte order (slot.to_le_bytes())

### 2.2 Blockhash
- Type: Base58-encoded string
- Description: The Solana blockhash associated with the selected slot
- Decoding: MUST be decoded using Base58 into raw bytes
- Length Requirement: Decoded blockhash MUST be exactly 32 bytes

If the decoded blockhash length is not exactly 32 bytes, verification MUST FAIL.

---

## 3. RNG Algorithm (v1)

The winning number MUST be computed using the following steps.

### Step 1: Decode Blockhash
Decode the Base58-encoded blockhash into a byte array:

blockhash_bytes = base58_decode(blockhash)

Verification MUST FAIL if len(blockhash_bytes) != 32.

---

### Step 2: Concatenate Inputs
Construct the input byte sequence by concatenating:

slot_le_bytes || blockhash_bytes

Where:
- slot_le_bytes is the 8-byte little-endian encoding of the slot
- || denotes byte concatenation

---

### Step 3: Compute Hash
Compute the SHA-256 hash of the concatenated byte sequence:

digest = SHA256(slot_le_bytes || blockhash_bytes)

The resulting digest MUST be exactly 32 bytes.

---

### Step 4: Reduce Digest
Compute the sum of all bytes in the digest:

total = sum(digest[0..31])

Each byte is treated as an unsigned 8-bit integer and summed into an unsigned 64-bit integer.

---

### Step 5: Compute Winning Number
Compute the winning number as:

winning_number = total % 10

The resulting winning number is an integer in the range 0–9 inclusive.

---

## 4. Output

An implementation MUST output:
- winning_number (integer 0–9)

An implementation MAY output additional debug or audit information, provided it does not alter
the algorithm or the final result.

---

## 5. Debug / Audit Information (Non-Normative)

The following values are commonly exposed for auditability but are NOT REQUIRED for verification:
- Full SHA-256 digest (hex-encoded)
- Digest byte sum (total)
- Intermediate byte representations

These values MUST NOT affect the winning number.

---

## 6. Test Vectors

Test testVectors are stored in testVectors/testVectors.json.

Each vector includes:
- rng_version
- slot
- blockhash
- expected_winning_number

Normative Rule:
Any implementation claiming compatibility with rng_version = v1 MUST
produce the expected winning number for all published testVectors.

Failure to do so indicates a non-compliant implementation.

---

## 7. RNG Versioning

- This specification defines rng_version = v1
- The definition of v1 MUST NOT CHANGE
- Any future algorithm changes MUST be introduced under a new version (e.g. v2)

Older versions MUST remain verifiable indefinitely.

---

## 8. Security and Trust Model

This RNG:
- uses only public blockchain data
- does not rely on secrets or private randomness
- is deterministic and reproducible
- is resistant to post-hoc manipulation

Verification requires no trust in ISeeFortune infrastructure.
Only the algorithm and the Solana blockchain are required.

---

## 9. Reference Implementation

The canonical reference implementation for rng_version = v1
is the Rust implementation provided in this repository.

Other implementations are valid only if they strictly follow this specification
and pass all published test testVectors.
