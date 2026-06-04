import { Connection, EpochSchedule } from "@solana/web3.js";
import { DEFAULT_RPC } from "../config";

export function resolveRpcUrl(raw: string): string {
    const s = raw.trim();
    if (!s) return DEFAULT_RPC;
    if (s.toLowerCase() === "default rpc") return DEFAULT_RPC;
    return s;
}

export async function getCurrentEpoch(conn: Connection): Promise<number> {
    const info = await conn.getEpochInfo("finalized");
    return info.epoch;
}

export async function fetchEpochSchedule(conn: Connection): Promise<EpochSchedule> {
    const raw: any = await conn.getEpochSchedule();

    return new EpochSchedule(
        raw.slotsPerEpoch,
        raw.leaderScheduleSlotOffset,
        raw.warmup,
        raw.firstNormalEpoch,
        raw.firstNormalSlot
    );
}

export async function findExistingBlockhashNearSlot(
    conn: Connection,
    startSlot: number
) {
    const MAX_BACKTRACK = 500;

    for (let i = 0; i <= MAX_BACKTRACK; i++) {
        const slot = startSlot - i;
        if (slot < 0) break;

        try {
            const block: any = await conn.getBlock(slot, {
                commitment: "finalized",
                transactionDetails: "none",
                rewards: false,
                maxSupportedTransactionVersion: 0,
            });

            if (block?.blockhash) {
                return {
                    slot,
                    blockhash: String(block.blockhash),
                };
            }
        } catch {
            // Skipped/pruned slot. Keep walking backward.
        }
    }

    throw new Error(
        `could not find a finalized block within ${MAX_BACKTRACK} slots of ${startSlot}`
    );
}