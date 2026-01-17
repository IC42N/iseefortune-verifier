import { base58 } from "@scure/base";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

export type VerifyDebug = {
    decodedLen: number;

    // Inputs rendered for humans
    slotU64LeHex: string;
    blockhashBytesHex: string;
    messageHex: string;

    // Digest + reduction
    digestSha256Hex: string;
    digestSumU64: bigint;
    modulus: number;
};

export type VerifyResult = {
    slot: bigint;
    blockhash: string;
    range: number;
    winningNumber: number;
    debug: VerifyDebug;
};

function slotToLeBytes(slot: bigint): Uint8Array {
    const out = new Uint8Array(8); // u64 little-endian
    let x = slot;
    for (let i = 0; i < 8; i++) {
        out[i] = Number(x & 0xffn);
        x >>= 8n;
    }
    return out;
}


export function verifyFromSlotAndBlockhash(
    slot: bigint,
    blockhashBase58: string,
    range = 10
): VerifyResult {
    if (!Number.isInteger(range) || range <= 0) throw new Error("range must be a positive integer");
    if (slot < 0n) throw new Error("slot must be >= 0");

    const blockhashBytes = base58.decode(blockhashBase58);
    if (blockhashBytes.length !== 32) {
        throw new Error(`decoded blockhash must be 32 bytes, got ${blockhashBytes.length}`);
    }

    const slotLe = slotToLeBytes(slot);

    // msg = slot(u64 LE) || blockhash(32 bytes)
    const msg = new Uint8Array(8 + 32);
    msg.set(slotLe, 0);
    msg.set(blockhashBytes, 8);

    // sha256(msg)
    const digest = sha256.create().update(msg).digest(); // Uint8Array(32)

    // sum(digest bytes) as u64 (bigint)
    let total = 0n;
    for (const b of digest) total += BigInt(b);

    // winning = total % range
    const winning = Number(total % BigInt(range));

    return {
        slot,
        blockhash: blockhashBase58,
        range,
        winningNumber: winning,
        debug: {
            decodedLen: blockhashBytes.length,
            slotU64LeHex: bytesToHex(slotLe),
            blockhashBytesHex: bytesToHex(blockhashBytes),
            messageHex: bytesToHex(msg),
            digestSha256Hex: bytesToHex(digest),
            digestSumU64: total,
            modulus: range,
        },
    };
}
