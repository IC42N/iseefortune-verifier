import { verifyFromSlotAndBlockhash } from "./core.js";

type Args = {
    slot: bigint;
    blockhash: string;
    debug: boolean;
};

function parseArgs(argv: string[]): Args {
    const get = (name: string): string | undefined => {
        const idx = argv.indexOf(name);
        if (idx === -1) return undefined;
        return argv[idx + 1];
    };

    const has = (name: string) => argv.includes(name);

    const slotStr = get("--slot");
    const blockhash = get("--blockhash");

    if (!slotStr) throw new Error("missing --slot <u64>");
    if (!blockhash) throw new Error("missing --blockhash <base58>");

    // Allow bigint slots safely
    const slot = BigInt(slotStr);

    return { slot, blockhash, debug: has("--debug") };
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const res = verifyFromSlotAndBlockhash(args.slot, args.blockhash, 10);

    const out: any = {
        rng_version: "v1",
        slot: args.slot.toString(), // JSON-safe
        blockhash: args.blockhash,
        winning_number: res.winningNumber
    };

    if (args.debug) {
        out.debug = {
            digest_sha256: res.debug.digestSha256Hex,
            digest_sum_u64: res.debug.digestSumU64.toString()
        };
    }

    console.log(JSON.stringify(out, null, 2));
}

main();