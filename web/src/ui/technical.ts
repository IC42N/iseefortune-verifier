import { stringifyBigIntSafe } from "../utils/html";

export function renderTechnicalOutput(
    outEl: HTMLPreElement,
    rawEnabled: boolean,
    debugEnabled: boolean,
    lastBase: any,
    lastDebug: any
) {
    if (!lastBase) {
        outEl.textContent =
            "Run a verification to see the raw proof values.";
        return;
    }

    if (debugEnabled) {
        outEl.textContent = stringifyBigIntSafe({
            ...lastBase,
            debug: lastDebug,
        });
        return;
    }

    if (rawEnabled) {
        outEl.textContent = stringifyBigIntSafe(lastBase);
        return;
    }

    const r = lastBase.calculation.rendered;

    outEl.textContent = [
        `Winning number: ${lastBase.winning_number}`,
        `Slot: ${lastBase.slot}`,
        `Blockhash: ${lastBase.blockhash}`,
        `Range: ${lastBase.range}`,
        "",
        "Proof values:",
        `slot_u64_le_hex: ${r.slot_u64_le_hex}`,
        `blockhash_bytes_hex: ${r.blockhash_bytes_hex}`,
        `msg_hex: ${r.msg_hex}`,
        `digest_sha256_hex: ${r.digest_sha256_hex}`,
        `digest_sum_u64: ${r.digest_sum_u64}`,
        `modulus: ${r.modulus}`,
    ].join("\n");
}