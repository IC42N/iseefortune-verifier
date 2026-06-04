/**
 * Winning number calculation (Node.js)
 *
 * Steps:
 * 1) slot -> 8 bytes u64 little-endian
 * 2) blockhash (base58) -> 32 bytes
 * 3) msg = slotLE || blockhashBytes (40 bytes)
 * 4) digest = SHA-256(msg)
 * 5) sum all 32 digest bytes
 * 6) winning = sum % 10
 */

const crypto = require("crypto");

// Base58 alphabet used by Solana
const BASE58_ALPHABET =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str) {
    if (typeof str !== "string" || str.length === 0) {
        throw new Error("blockhash must be a non-empty base58 string");
    }

    // Convert base58 string to a BigInt-like byte array algorithm
    const bytes = [0]; // little-endian base256 representation

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const value = BASE58_ALPHABET.indexOf(ch);
        if (value === -1) {
            throw new Error(`Invalid base58 character "${ch}" at position ${i}`);
        }

        // Multiply current number by 58 and add value
        let carry = value;
        for (let j = 0; j < bytes.length; j++) {
            const x = bytes[j] * 58 + carry;
            bytes[j] = x & 0xff;
            carry = x >> 8;
        }
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }

    // Handle leading zeros (base58 '1' = 0x00 byte)
    let leadingZeros = 0;
    while (leadingZeros < str.length && str[leadingZeros] === "1") {
        leadingZeros++;
    }

    // Convert little-endian to big-endian and add leading zeros
    const decoded = Buffer.from(bytes.reverse());
    if (leadingZeros === 0) return decoded;

    return Buffer.concat([Buffer.alloc(leadingZeros, 0), decoded]);
}

function slotToU64LE(slot) {
    // Accept number or bigint
    const s = typeof slot === "bigint" ? slot : BigInt(slot);
    if (s < 0n) throw new Error("slot must be non-negative");

    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(s, 0);
    return buf;
}

function calculateWinningNumber(slot, blockhashBase58) {
    const slotLE = slotToU64LE(slot);

    const blockhashBytes = base58Decode(blockhashBase58);
    if (blockhashBytes.length !== 32) {
        throw new Error(
            `Decoded blockhash must be 32 bytes, got ${blockhashBytes.length}`
        );
    }

    const msg = Buffer.concat([slotLE, blockhashBytes]); // 40 bytes
    const digest = crypto.createHash("sha256").update(msg).digest(); // 32 bytes

    let sum = 0;
    for (const b of digest) sum += b;

    const winning = sum % 10;
    return { winning, sum, digestHex: digest.toString("hex") };
}

// -------------------
// Example usage:
// -------------------
// Replace these with real values
const slot = 400031999;
const blockhash = "JA9ZbTUbpnv5RWbAoYwVjmfFjU5fBbje2DZjPhu2MRwD";

const result = calculateWinningNumber(slot, blockhash);
console.log("winning:", result.winning);
console.log("sum:", result.sum);
console.log("digestHex:", result.digestHex);