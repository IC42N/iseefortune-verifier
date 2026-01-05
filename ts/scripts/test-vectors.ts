import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import * as assert from "node:assert/strict";
import { verifyFromSlotAndBlockhash } from "../src/core.js";

type Vector = {
    name: string;
    rng_version: string;
    slot: number | string;
    blockhash: string;
    expected_winning_number: number;
};

// When running from /verifier/ts
// repo root is one level up
const repoRoot = resolve(process.cwd(), "..");
const vectorsPath = join(repoRoot, "vectors", "vectors.json");

const raw = readFileSync(vectorsPath, "utf8");
const vectors: Vector[] = JSON.parse(raw);

assert.ok(vectors.length > 0, "vectors.json must not be empty");

for (const v of vectors) {
    assert.equal(v.rng_version, "v1", `unsupported rng_version in ${v.name}`);

    const slotBig = typeof v.slot === "string" ? BigInt(v.slot) : BigInt(v.slot);
    const res = verifyFromSlotAndBlockhash(slotBig, v.blockhash, 10);

    assert.equal(
        res.winningNumber,
        v.expected_winning_number,
        `vector '${v.name}' mismatch`
    );
}

console.log(`OK: ${vectors.length} vector(s) passed`);