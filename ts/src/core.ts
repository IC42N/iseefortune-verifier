import { createRequire } from "node:module";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

const require = createRequire(import.meta.url);
const bs58 = require("bs58") as {
    decode: (s: string) => Uint8Array;
    encode: (b: Uint8Array) => string;
};

export type VerifyDebug = {
    digestSha256Hex: string;
    digestSumU64: bigint;
};

export type VerifyResult = {
    winningNumber: number; // 0..range-1
    debug: VerifyDebug;
};

function assertPositiveInt(name: string, n: number) {
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
}

/**
 * Encode a u64 (slot) into 8 bytes little-endian.
 */
function u64ToLeBytes(x: bigint): Uint8Array {
    if (x < 0n) throw new Error("slot must be >= 0");

    const out = new Uint8Array(8);
    let v = x;

    for (let i = 0; i < 8; i++) {
        out[i] = Number(v & 0xffn);
        v >>= 8n;
    }

    // If v is still non-zero, the slot didn't fit in u64.
    if (v !== 0n) throw new Error("slot must fit in u64");

    return out;
}

/**
 * Canonical ISeeFortune RNG (v1):
 * 1) base58-decode blockhash -> 32 bytes
 * 2) digest = SHA256(slot_le_bytes || blockhash_bytes)
 * 3) total = sum(digest bytes)
 * 4) winning_number = total % range (range defaults to 10)
 */
export function verifyFromSlotAndBlockhash(
    slot: number | bigint,
    blockhashBase58: string,
    range = 10
): VerifyResult {
    assertPositiveInt("range", range);

    const slotBig = typeof slot === "bigint" ? slot : BigInt(slot);
    const slotLe = u64ToLeBytes(slotBig);

    const blockhashBytes = bs58.decode(blockhashBase58);
    if (blockhashBytes.length !== 32) {
        throw new Error(`decoded blockhash must be 32 bytes, got ${blockhashBytes.length}`);
    }

    // Concatenate: slot_le_bytes || blockhash_bytes
    const msg = new Uint8Array(8 + 32);
    msg.set(slotLe, 0);
    msg.set(blockhashBytes, 8);

    const digest = sha256.create().update(msg).digest(); // 32 bytes
    let total = 0n;
    for (const b of digest) total += BigInt(b);

    const winningNumber = Number(total % BigInt(range));

    return {
        winningNumber,
        debug: {
            digestSha256Hex: bytesToHex(digest),
            digestSumU64: total
        }
    };
}