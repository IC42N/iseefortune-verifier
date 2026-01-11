import "./style.css";
import { verifyFromSlotAndBlockhash } from "./verify";
import { Connection, EpochSchedule } from "@solana/web3.js";

const DEFAULT_RPC = "https://bernette-tb3sav-fast-mainnet.helius-rpc.com/";
const DEFAULT_RANGE = 10;
const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="wrap">
    <div class="header">
      <h1>I See Fortune • Winning Number Verifier</h1>
      <div class="small">
        Computes the winning number locally in your browser using the algorithm in
        <a
          href="https://github.com/IC42N/iseefortune-verifier/blob/main/SPEC.md"
          target="_blank"
          rel="noreferrer"
        >SPEC.md</a>.
      </div>
    </div>

    <div class="tabs">
      <button class="tab isActive" data-tab="epoch" type="button">Verify Winning Number</button>
      <button class="tab" data-tab="overview" type="button">Overview</button>
    </div>

    <!-- Panels -->
    <section class="panel isActive" data-panel="epoch">
      <div class="card">
        <div class="row">
          <div class="field" style="flex: 1 1 220px;">
            <label for="epoch">Epoch</label>
            <input id="epoch" placeholder="e.g. 700" inputmode="numeric" />
          </div>

          <div class="field" style="flex: 3 1 520px;">
            <label for="rpc">RPC URL</label>
            <input id="rpc" placeholder="Default RPC" />
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="row rowBetween">
          <div class="status" id="epochStatus">Looks up the epoch's last slot + blockhash, then verifies.</div>
          <button id="goEpoch" type="button">Verify from epoch</button>
        </div>

        <div class="explorer" id="explorerLinks"></div>
      </div>

      <div class="card">
        <div class="row rowBetween">
          <div class="field">
            <label for="slot">Slot</label>
            <input id="slot" placeholder="e.g. 432863999" inputmode="numeric" />
          </div>
          <div class="field" style="flex: 2 1 420px;">
            <label for="blockhash">Blockhash (base58)</label>
            <input id="blockhash" placeholder="e.g. 8RVJGofM2C3Rhhpm..." />
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="row rowBetween">
          <label class="small" style="display:flex; gap:8px; align-items:center;">
            <input id="debug" type="checkbox" />
            Show debug
          </label>

          <button id="go" type="button">Verify</button>
        </div>

        <div id="out" class="out" style="display:none;"></div>
      </div>
    </section>

    <section class="panel" data-panel="overview">
      <div class="card explainer">
        <div class="eyebrow">What is this page for</div>
        <p>
          The form lets anyone independently verify the winning number for an
          <a href="https://iseefortune.com" target="_blank">I See Fortune</a> game using only public Solana blockchain data.
          The calculation happens entirely in your browser — no servers, no custom APIs,
          and no trust in the game operator required.
        </p>

        <div class="divider"></div>

        <div class="eyebrow">Why this is verifiable</div>
        <p>
          Every game resolves using two pieces of data that already exist on-chain:
        </p>

        <ul class="bullets">
          <li>A <b>Solana epoch</b></li>
          <li>The <b>finalized blockhash</b> from the last slot of that epoch</li>
        </ul>

        <p class="muted">
          These values are public, immutable once finalized, and independently visible on Solana Explorer.
          The winning number is derived by hashing these values together and applying simple math.
          There is no randomness controlled by the developer and no way to alter the result after the fact.
        </p>

        <div class="divider"></div>

        <div class="eyebrow">How the winning number is calculated</div>
        <ol class="steps">
          <li>Convert <b>slot</b> into 8 bytes (<b>u64 little-endian</b>)</li>
          <li>Decode <b>blockhash</b> from base58 into 32 bytes</li>
          <li>Build message: <code>msg = slot_le_bytes || blockhash_bytes</code> (40 bytes total)</li>
          <li>Compute <code>digest = SHA-256(msg)</code></li>
          <li>Add all 32 digest bytes: <code>sum = digest[0] + ... + digest[31]</code></li>
          <li>Winning number: <code>winning = sum % ${DEFAULT_RANGE}</code></li>
        </ol>

        <p class="hint">
          Zero trust, by design. No need to trust the website, its backend, or its creator.  If two people use the same epoch and blockhash, they will always get the same result — forever.
        </p>
      </div>
    </section>

    <div class="small text-center">
      Tip: this site is static; you can inspect-source and reproduce the same output with the Rust/TS tools in the <a href="https://github.com/IC42N/iseefortune-verifier">repo</a>.
    </div>
  </div>
`;

const epochEl = document.querySelector<HTMLInputElement>("#epoch")!;
const rpcEl = document.querySelector<HTMLInputElement>("#rpc")!;
const epochStatusEl = document.querySelector<HTMLDivElement>("#epochStatus")!;
const goEpochEl = document.querySelector<HTMLButtonElement>("#goEpoch")!;

const slotEl = document.querySelector<HTMLInputElement>("#slot")!;
const bhEl = document.querySelector<HTMLInputElement>("#blockhash")!;
const dbgEl = document.querySelector<HTMLInputElement>("#debug")!;
const outEl = document.querySelector<HTMLDivElement>("#out")!;
const goEl = document.querySelector<HTMLButtonElement>("#go")!;
const explorerLinksEl = document.querySelector<HTMLDivElement>("#explorerLinks")!;

function stringifyBigIntSafe(obj: unknown) {
    return JSON.stringify(
        obj,
        (_key, value) => (typeof value === "bigint" ? value.toString() : value),
        2
    );
}

function show(obj: unknown) {
    outEl.style.display = "block";
    outEl.textContent = stringifyBigIntSafe(obj);
}

function showError(msg: string) {
    show({ error: msg });
}

function setEpochStatus(msg: string) {
    epochStatusEl.textContent = msg;
}

function resolveRpcUrl(raw: string): string {
    const s = raw.trim();
    if (!s) return DEFAULT_RPC;                 // empty => default
    if (s.toLowerCase() === "default rpc") return DEFAULT_RPC; // just in case
    return s;                                   // user supplied
}

function buildCalculationSummary(res: ReturnType<typeof verifyFromSlotAndBlockhash>) {
    const d = res.debug;
    return {
        steps: [
            "slot_le = slot encoded as u64 little-endian (8 bytes)",
            "blockhash_bytes = base58_decode(blockhash) (32 bytes)",
            "msg = slot_le || blockhash_bytes (40 bytes)",
            "digest = sha256(msg) (32 bytes)",
            "sum = Σ digest[i] for i=0..31",
            `winning = sum % ${res.range}`,
        ],
        rendered: {
            slot_u64_le_hex: d.slotU64LeHex,
            blockhash_bytes_hex: d.blockhashBytesHex,
            msg_hex: d.messageHex,
            digest_sha256_hex: d.digestSha256Hex,
            digest_sum_u64: d.digestSumU64,
            modulus: d.modulus,
            winning: res.winningNumber,
        },
    };
}

function runVerify(slotStr: string, blockhash: string) {
    const slot = BigInt(slotStr);
    const res = verifyFromSlotAndBlockhash(slot, blockhash, DEFAULT_RANGE);

    const base = {
        slot: slotStr,
        blockhash,
        range: DEFAULT_RANGE,
        winning_number: res.winningNumber,
        calculation: buildCalculationSummary(res),
    };

    if (dbgEl.checked) {
        show({
            ...base,
            debug: res.debug,
        });
    } else {
        show(base);
    }
}

const EXPLORER_BASE = "https://explorer.solana.com";

function explorerEpochUrl(epoch: number) {
    return `${EXPLORER_BASE}/epoch/${epoch}`;
}

function explorerBlockUrl(slot: number) {
    // Solana explorer uses /block/<slot> (slot number)
    return `${EXPLORER_BASE}/block/${slot}`;
}

function showExplorerLinks(epoch: number, slot: number) {
    const epochUrl = explorerEpochUrl(epoch);
    const blockUrl = explorerBlockUrl(slot);

    explorerLinksEl.classList.add("isVisible");
    explorerLinksEl.innerHTML = `
    <span>Solana Explorer:</span>
    <a href="${epochUrl}" target="_blank" rel="noreferrer">Epoch ${epoch}</a>
    <a href="${blockUrl}" target="_blank" rel="noreferrer">Block ${slot}</a>
  `;
}

function clearExplorerLinks() {
    explorerLinksEl.classList.remove("isVisible");
    explorerLinksEl.innerHTML = "";
}


goEl.addEventListener("click", () => {
    try {
        const slotStr = slotEl.value.trim();
        const blockhash = bhEl.value.trim();

        if (!slotStr) return showError("slot is required");
        if (!blockhash) return showError("blockhash is required");

        runVerify(slotStr, blockhash);
    } catch (e) {
        showError(e instanceof Error ? e.message : String(e));
    }
});

// --- Epoch lookup + verify ---

async function fetchEpochSchedule(conn: Connection): Promise<EpochSchedule> {
    const raw: any = await conn.getEpochSchedule();
    // Solana web3.js docs show the constructor signature clearly.
    // [oai_citation:1‡Solana Foundation](https://solana-foundation.github.io/solana-web3.js/classes/EpochSchedule.html)
    return new EpochSchedule(
        raw.slotsPerEpoch,
        raw.leaderScheduleSlotOffset,
        raw.warmup,
        raw.firstNormalEpoch,
        raw.firstNormalSlot
    );
}

async function findExistingBlockhashNearSlot(conn: Connection, startSlot: number) {
    // Walk backward to tolerate skipped slots / pruned blocks.
    // Keep it modest so the UI stays snappy.
    const MAX_BACKTRACK = 500;

    for (let i = 0; i <= MAX_BACKTRACK; i++) {
        const slot = startSlot - i;
        if (slot < 0) break;

        try {
            // Ask for minimal block payload.
            const block: any = await conn.getBlock(slot, {
                commitment: "finalized",
                transactionDetails: "none",
                rewards: false,
                maxSupportedTransactionVersion: 0,
            });

            if (block?.blockhash) {
                return { slot, blockhash: String(block.blockhash) };
            }
        } catch {
            // ignore and continue backtracking
        }
    }

    throw new Error(`could not find a finalized block within ${MAX_BACKTRACK} slots of ${startSlot}`);
}

goEpochEl.addEventListener("click", async () => {
    try {
        clearExplorerLinks();
        const epochStr = epochEl.value.trim();
        const rpcUrl = resolveRpcUrl(rpcEl.value);

        if (!epochStr) return showError("epoch is required");
        if (!/^\d+$/.test(epochStr)) return showError("epoch must be a non-negative integer");
        const epoch = Number(epochStr);

        setEpochStatus("Fetching epoch schedule...");
        const conn = new Connection(rpcUrl, "finalized");

        const sched = await fetchEpochSchedule(conn);

        const lastSlot = sched.getLastSlotInEpoch(epoch);

        setEpochStatus(`Epoch ${epoch} → last slot ≈ ${lastSlot}. Fetching blockhash...`);
        const found = await findExistingBlockhashNearSlot(conn, lastSlot);

        // Populate the other form too (nice UX)
        slotEl.value = String(found.slot);
        bhEl.value = found.blockhash;

        // Show explorer links
        showExplorerLinks(epoch, found.slot);

        setEpochStatus(`Found finalized slot ${found.slot}. Verifying...`);
        runVerify(String(found.slot), found.blockhash);

        setEpochStatus(`Done. Epoch ${epoch} resolved using slot ${found.slot}.`);
    } catch (e) {
        setEpochStatus("Failed.");
        showError(e instanceof Error ? e.message : String(e));
    }
});

function setActiveTab(name: string) {
    document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
        btn.classList.toggle("isActive", btn.dataset.tab === name);
    });

    document.querySelectorAll<HTMLElement>(".panel").forEach((panel) => {
        panel.classList.toggle("isActive", panel.dataset.panel === name);
    });
}

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (!tab) return;

        setActiveTab(tab);

        // Nice UX: when switching, keep output visible if you're on slot tab
        if (tab !== "slot") {
            // optional: hide output when leaving slot tab
            // outEl.style.display = "none";
        }
    });
});