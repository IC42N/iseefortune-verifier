import "./style.css";
import { verifyFromSlotAndBlockhash } from "./verify";
import { Connection, EpochSchedule } from "@solana/web3.js";

const DEFAULT_RPC = "https://bernette-tb3sav-fast-mainnet.helius-rpc.com/";
const DEFAULT_RANGE = 10;
const EXPLORER_BASE = "https://explorer.solana.com";

type VerificationViewModel = {
    epoch?: number;
    slot: string;
    blockhash: string;
    range: number;
    winningNumber: number;
    calculation: ReturnType<typeof buildCalculationSummary>;
    generatedAt: string;
};

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div class="brandRow">
        <div class="brandMark">
          <img src="/assets/logo.png" alt="I See Fortune" />
        </div>
        <div>
          <div class="brand">I See Fortune</div>
          <div class="brandSub">Winning Number Verifier</div>
        </div>
      </div>

      <div class="heroGrid">
        <div class="heroCopy">
          <div class="trustBadge">Verified locally • Public Solana data • Offline reproducible</div>
          <h1>Verify any winning number yourself.</h1>
          <p>
            Enter an epoch, fetch the finalized Solana blockhash, and your browser recomputes the winning number step by step.
            No private server result. No hidden randomness. Same inputs, same result forever.
          </p>
          <div class="heroActions">
            <a class="ghostButton" href="https://github.com/IC42N/iseefortune-verifier" target="_blank" rel="noreferrer">View source</a>
            <button class="ghostButton" id="jumpHow" type="button">How it works</button>
          </div>
        </div>

        <aside class="trustPanel" aria-label="Trust summary">
          <div class="trustItem"><span>1</span><div><b>Public input</b><small>Epoch + finalized Solana blockhash</small></div></div>
          <div class="trustItem"><span>2</span><div><b>Local calculation</b><small>Runs inside your browser</small></div></div>
          <div class="trustItem"><span>3</span><div><b>Reproducible output</b><small>Can be checked offline with the repo</small></div></div>
        </aside>
      </div>
    </section>

    <nav class="tabs" aria-label="Verifier sections">
      <button class="tab isActive" data-tab="verify" type="button">Verify</button>
      <button class="tab" data-tab="docs" type="button">Overview & Docs</button>
    </nav>

    <section class="panel isActive" data-panel="verify">
      <div class="mainGrid">
        <section class="card verifierCard">
          <div class="sectionTitle">
            <div>
              <span class="stepPill">Step 1</span>
              <h2>Input any epoch</h2>
            </div>
            <p>Most visitors should use epoch mode. The app finds the finalized slot and blockhash for you.</p>
          </div>

          <div class="modeSwitch" role="tablist" aria-label="Verification mode">
            <button class="modeButton isActive" data-mode="epoch" type="button">By epoch</button>
            <button class="modeButton" data-mode="manual" type="button">By slot + blockhash</button>
          </div>

          <div class="modePanel isActive" data-mode-panel="epoch">
            <div class="formGrid">
              <div class="field compactField">
                <label for="epoch">Epoch</label>
                <input id="epoch" placeholder="e.g. 981" inputmode="numeric" pattern="\\d*" autocomplete="off" />
              </div>

              <div class="field">
                <label for="rpc">RPC endpoint <span>(optional)</span></label>
                <input id="rpc" placeholder="Default RPC" autocomplete="off" />
              </div>
            </div>

            <div class="statusBox" id="epochStatus">Ready. Enter a completed epoch to fetch public Solana data.</div>

            <div class="actionRow">
              <button id="goEpoch" type="button">Fetch epoch data & verify</button>
            </div>

            <div class="explorer" id="explorerLinks"></div>
          </div>

          <div class="modePanel" data-mode-panel="manual">
            <div class="formGrid">
              <div class="field compactField">
                <label for="slot">Slot</label>
                <input id="slot" placeholder="e.g. 424223999" inputmode="numeric" autocomplete="off" />
              </div>
              <div class="field">
                <label for="blockhash">Blockhash <span>(base58)</span></label>
                <input id="blockhash" placeholder="Paste finalized blockhash" autocomplete="off" />
              </div>
            </div>

            <div class="actionRow">
              <button id="go" type="button">Verify slot + blockhash</button>
            </div>
          </div>
        </section>

        <aside class="card networkCard">
          <div class="networkTop">
            <div class="solanaOrb"></div>
            <div>
              <h3>Solana Mainnet</h3>
              <p>Finalized blockchain data</p>
            </div>
          </div>
          <div class="networkStat"><span>Status</span><b id="networkStatus">Ready</b></div>
          <div class="networkStat"><span>Range</span><b>1 – ${DEFAULT_RANGE}</b></div>
          <div class="networkStat"><span>Calculation</span><b>SHA-256</b></div>
        </aside>
      </div>

      <section id="resultCard" class="card resultCard isEmpty">
        <div class="emptyState">
          <div class="emptyIcon">✓</div>
          <h2>Result will appear here</h2>
          <p>After verification, this section shows the winning number, the exact inputs, and the full calculation trail.</p>
        </div>
      </section>

      <section class="card breakdownCard" id="breakdownCard">
        <div class="sectionTitle rowTitle">
          <div>
            <span class="stepPill">Step 2</span>
            <h2>How the winning number is generated</h2>
            <p>Step-by-step breakdown of how the winning number is calculated.</p>
          </div>
          <p>These are the same steps your browser runs. They are shown in plain English first, with technical values available after verification.</p>
        </div>

        <div class="timeline" id="calculationTimeline">
          <div class="timelineStep"><span>1</span><div><b>Find the epoch slot</b><small>Get the final available finalized slot for the selected epoch.</small></div></div>
          <div class="timelineStep"><span>2</span><div><b>Fetch the blockhash</b><small>Read the blockhash directly from Solana for that slot.</small></div></div>
          <div class="timelineStep"><span>3</span><div><b>Hash the inputs</b><small>Combine slot bytes + blockhash bytes, then SHA-256 the message.</small></div></div>
          <div class="timelineStep"><span>4</span><div><b>Reduce to a number</b><small>Add the digest bytes and apply modulus ${DEFAULT_RANGE}.</small></div></div>
          <div class="timelineStep"><span>5</span><div><b>Final winning number</b><small>The final value is converted to the game range.</small></div></div>
        </div>
      </section>

      <section class="card technicalCard">
        <button class="accordionButton" id="toggleTechnical" type="button">Show technical proof values</button>
        <div class="technicalBody" id="technicalBody" hidden>
          <div class="optionRow">
            <label><input id="raw" type="checkbox" /> Show raw JSON</label>
            <label><input id="debug" type="checkbox" /> Include debug payload</label>
          </div>
          <pre id="out" class="out"></pre>
        </div>
      </section>
    </section>

    <section class="panel" data-panel="docs">
      <div class="docsGrid">
        <section class="card explainer">
          <div class="eyebrow">What this tool proves</div>
          <h2>Anyone can recompute the same winning number.</h2>
          <p>
            This verifier uses public Solana data and deterministic math. The website is only a convenience layer.
            The result does not depend on a private backend, database, admin panel, or secret value.
          </p>

          <div class="proofTiles">
            <div><b>100% public</b><span>Inputs come from Solana.</span></div>
            <div><b>Local only</b><span>Calculation happens in-browser.</span></div>
            <div><b>Open source</b><span>Code can be inspected and copied.</span></div>
          </div>
        </section>

        <section class="card explainer" id="howItWorks">
          <div class="eyebrow">Algorithm</div>
          <h2>The complete calculation</h2>
          <ol class="steps">
            <li>Convert <b>slot</b> into 8 bytes: <code>u64 little-endian</code></li>
            <li>Decode <b>blockhash</b> from base58 into 32 bytes</li>
            <li>Build message: <code>slot_le_bytes || blockhash_bytes</code></li>
            <li>Compute <code>SHA-256(message)</code></li>
            <li>Add all 32 digest bytes together</li>
            <li>Apply <code>sum % ${DEFAULT_RANGE}</code>, then display the winning number in the game range</li>
          </ol>
          <p class="hint">Same epoch + same blockhash = same winning number forever.</p>
        </section>
      </div>
    </section>

    <footer class="footer">
        <section class="trustFooter">
          <div class="trustFooterIcon">
            🛡️
          </div>
          <div>
            <strong>This is a tool, not a black box.</strong>
            <p>Verify everything. No blind trust required</p>
          </div>
        </section>
    </footer>
  </main>
`;

const epochEl = document.querySelector<HTMLInputElement>("#epoch")!;
const rpcEl = document.querySelector<HTMLInputElement>("#rpc")!;
const epochStatusEl = document.querySelector<HTMLDivElement>("#epochStatus")!;
const goEpochEl = document.querySelector<HTMLButtonElement>("#goEpoch")!;
const slotEl = document.querySelector<HTMLInputElement>("#slot")!;
const bhEl = document.querySelector<HTMLInputElement>("#blockhash")!;
const dbgEl = document.querySelector<HTMLInputElement>("#debug")!;
const rawEl = document.querySelector<HTMLInputElement>("#raw")!;
const goEl = document.querySelector<HTMLButtonElement>("#go")!;
const outEl = document.querySelector<HTMLPreElement>("#out")!;
const explorerLinksEl = document.querySelector<HTMLDivElement>("#explorerLinks")!;
const resultCardEl = document.querySelector<HTMLDivElement>("#resultCard")!;
const calculationTimelineEl = document.querySelector<HTMLDivElement>("#calculationTimeline")!;
const technicalBodyEl = document.querySelector<HTMLDivElement>("#technicalBody")!;
const toggleTechnicalEl = document.querySelector<HTMLButtonElement>("#toggleTechnical")!;
const networkStatusEl = document.querySelector<HTMLElement>("#networkStatus")!;

let lastBase: any = null;
let lastDebug: any = null;

function digitsOnly(el: HTMLInputElement) {
    el.addEventListener("input", () => {
        const cleaned = el.value.replace(/\D/g, "");
        if (el.value !== cleaned) el.value = cleaned;
    });
}

digitsOnly(epochEl);
digitsOnly(slotEl);

dbgEl.addEventListener("change", () => {
    if (dbgEl.checked) rawEl.checked = true;
    renderTechnicalOutput();
});
rawEl.addEventListener("change", renderTechnicalOutput);

toggleTechnicalEl.addEventListener("click", () => {
    const isHidden = technicalBodyEl.hidden;
    technicalBodyEl.hidden = !isHidden;
    toggleTechnicalEl.textContent = isHidden ? "Hide technical proof values" : "Show technical proof values";
});

function stringifyBigIntSafe(obj: unknown) {
    return JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function shortHash(value: string) {
    if (value.length <= 18) return value;
    return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function copyButton(value: string, label = "Copy") {
    return `<button class="copyButton" type="button" data-copy="${escapeHtml(value)}">${label}</button>`;
}

function wireCopyButtons() {
    document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const value = btn.dataset.copy ?? "";
            await navigator.clipboard.writeText(value);
            const old = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(() => (btn.textContent = old), 900);
        });
    });
}

function showError(msg: string) {
    resultCardEl.classList.remove("isEmpty");
    resultCardEl.innerHTML = `
      <div class="errorState">
        <div class="emptyIcon danger">!</div>
        <h2>Verification failed</h2>
        <p>${escapeHtml(msg)}</p>
      </div>
    `;
    outEl.textContent = stringifyBigIntSafe({ error: msg });
}

function renderTechnicalOutput() {
    if (!lastBase) {
        outEl.textContent = "Run a verification to see the raw proof values.";
        return;
    }

    if (dbgEl.checked) {
        outEl.textContent = stringifyBigIntSafe({ ...lastBase, debug: lastDebug });
        return;
    }

    if (rawEl.checked) {
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

function setEpochStatus(msg: string) {
    epochStatusEl.textContent = msg;
}

function setNetworkStatus(msg: string) {
    networkStatusEl.textContent = msg;
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
            `winning = (sum % ${res.range}) + 1`,
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

function renderResult(vm: VerificationViewModel) {
    resultCardEl.classList.remove("isEmpty");
    const epochLine = vm.epoch == null ? "Manual slot verification" : `Epoch ${vm.epoch}`;

    resultCardEl.innerHTML = `
      <div class="resultGrid">
        <div class="winningPanel">
          <span class="stepPill success">Verified</span>
          <p>Winning Number</p>
          <div class="winningNumber">${vm.winningNumber}</div>
          <small>${epochLine}</small>
        </div>

        <div class="resultFacts">
          <div><span>Slot</span><b>${escapeHtml(vm.slot)}</b></div>
          <div><span>Blockhash</span><b title="${escapeHtml(vm.blockhash)}">${escapeHtml(shortHash(vm.blockhash))}</b>${copyButton(vm.blockhash)}</div>
          <div><span>Range</span><b>1 – ${vm.range}</b></div>
          <div><span>Generated</span><b>${escapeHtml(vm.generatedAt)}</b></div>
        </div>

        <div class="offlineBox">
          <h3>Verify offline</h3>
          <p>Copy these exact inputs or download the repo. Anyone using the same slot and blockhash should get this same result.</p>
          <div class="miniActions">
            ${copyButton(vm.slot, "Copy slot")}
            ${copyButton(vm.blockhash, "Copy blockhash")}
          </div>
        </div>
      </div>
    `;

    const r = vm.calculation.rendered;
    calculationTimelineEl.innerHTML = `
          <div class="timelineStep isDone">
            <span>1</span>
            <div>
              <b>Blockhash <small>(base58)</small></b>
              <div class="valueBox">
                  <code>${escapeHtml(vm.blockhash)}</code>
                  ${copyIcon(vm.blockhash)}
               </div>
            </div>
          </div>
        
          <div class="timelineStep isDone">
            <span>2</span>
            <div>
              <b>Hash <small>(SHA-256)</small></b>
              <div class="valueBox">
                <code>${escapeHtml(String(r.digest_sha256_hex))}</code>
                 ${copyIcon(String(r.digest_sha256_hex))}
              </div>
            </div>
          </div>
        
          <div class="timelineStep isDone">
            <span>3</span>
            <div>
              <b>Convert to Number</b>
              <small>Hex to u64 little-endian</small>
              <small><code>${String(r.digest_sum_u64)}</code></small>
            </div>
          </div>
        
          <div class="timelineStep isDone">
            <span>4</span>
            <div>
              <b>Apply Formula</b>
              <small>Number % ${r.modulus} + 1</small>
              <small><code>(${String(r.digest_sum_u64)} % ${r.modulus}) + 1 = ${vm.winningNumber}</code></small>
            </div>
          </div>
        
        <div class="timelineStep isDone winningStep">
          <span>5</span>
          <div class="winningResult">
            <b>Winning Number</b>
            <div class="timelineWinningContainer">
              <div class="timelineWinning">${vm.winningNumber}</div>
            </div>
          </div>
        </div>
        `;

    wireCopyButtons();
}


function copyIcon(value: string) {
    return `
      <button
        class="copyIcon"
        type="button"
        data-copy="${escapeHtml(value)}"
        aria-label="Copy"
      >
        📋
      </button>
    `;
}

function runVerify(slotStr: string, blockhash: string, epoch?: number) {
    const slot = BigInt(slotStr);
    const res = verifyFromSlotAndBlockhash(slot, blockhash, DEFAULT_RANGE);

    const base = {
        epoch,
        slot: slotStr,
        blockhash,
        range: DEFAULT_RANGE,
        winning_number: res.winningNumber,
        calculation: buildCalculationSummary(res),
    };

    lastBase = base;
    lastDebug = res.debug;

    renderResult({
        epoch,
        slot: slotStr,
        blockhash,
        range: DEFAULT_RANGE,
        winningNumber: res.winningNumber,
        calculation: base.calculation,
        generatedAt: new Date().toLocaleString(),
    });

    renderTechnicalOutput();
}

function explorerEpochUrl(epoch: number) {
    return `${EXPLORER_BASE}/epoch/${epoch}`;
}

function explorerBlockUrl(slot: number) {
    return `${EXPLORER_BASE}/block/${slot}`;
}

function showExplorerLinks(epoch: number, slot: number) {
    explorerLinksEl.classList.add("isVisible");
    explorerLinksEl.innerHTML = `
      <span>Source links:</span>
      <a href="${explorerEpochUrl(epoch)}" target="_blank" rel="noreferrer">View epoch ${epoch}</a>
      <a href="${explorerBlockUrl(slot)}" target="_blank" rel="noreferrer">View slot ${slot}</a>
    `;
}

function clearExplorerLinks() {
    explorerLinksEl.classList.remove("isVisible");
    explorerLinksEl.innerHTML = "";
}

goEl.addEventListener("click", () => {
    try {
        clearExplorerLinks();
        const slotStr = slotEl.value.trim();
        const blockhash = bhEl.value.trim();

        if (!slotStr) return showError("slot is required");
        if (!blockhash) return showError("blockhash is required");

        runVerify(slotStr, blockhash);
    } catch (e) {
        showError(e instanceof Error ? e.message : String(e));
    }
});

function resolveRpcUrl(raw: string): string {
    const s = raw.trim();
    if (!s) return DEFAULT_RPC;
    if (s.toLowerCase() === "default rpc") return DEFAULT_RPC;
    return s;
}

async function getCurrentEpoch(conn: Connection): Promise<number> {
    const info = await conn.getEpochInfo("finalized");
    return info.epoch;
}

async function fetchEpochSchedule(conn: Connection): Promise<EpochSchedule> {
    const raw: any = await conn.getEpochSchedule();
    return new EpochSchedule(raw.slotsPerEpoch, raw.leaderScheduleSlotOffset, raw.warmup, raw.firstNormalEpoch, raw.firstNormalSlot);
}

async function findExistingBlockhashNearSlot(conn: Connection, startSlot: number) {
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

            if (block?.blockhash) return { slot, blockhash: String(block.blockhash) };
        } catch {
            // Continue walking backward for skipped/pruned slots.
        }
    }

    throw new Error(`could not find a finalized block within ${MAX_BACKTRACK} slots of ${startSlot}`);
}

goEpochEl.addEventListener("click", async () => {
    try {
        clearExplorerLinks();
        setNetworkStatus("Fetching");

        const epochStr = epochEl.value.trim();
        const rpcUrl = resolveRpcUrl(rpcEl.value);

        if (!epochStr) return showError("epoch is required");
        if (!/^\d+$/.test(epochStr)) return showError("epoch must be a non-negative integer");

        const epoch = Number(epochStr);
        const conn = new Connection(rpcUrl, "finalized");

        setEpochStatus("Checking whether this epoch is finalized...");
        const currentEpoch = await getCurrentEpoch(conn);

        if (epoch >= currentEpoch) {
            setEpochStatus("Not available yet. The epoch must be completed first.");
            setNetworkStatus("Waiting");
            showError(`Epoch ${epoch} has not ended yet. Current epoch is ${currentEpoch}.`);
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set("epoch", String(epoch));
        history.replaceState({}, "", url.toString());

        setEpochStatus("Fetching Solana epoch schedule...");
        const sched = await fetchEpochSchedule(conn);
        const lastSlot = sched.getLastSlotInEpoch(epoch);

        setEpochStatus(`Epoch ${epoch} ends near slot ${lastSlot}. Looking for finalized blockhash...`);
        const found = await findExistingBlockhashNearSlot(conn, lastSlot);

        slotEl.value = String(found.slot);
        bhEl.value = found.blockhash;
        showExplorerLinks(epoch, found.slot);

        setEpochStatus("Blockhash found. Recomputing winning number locally...");
        runVerify(String(found.slot), found.blockhash, epoch);

        setEpochStatus(`Verified. Epoch ${epoch} resolved using finalized slot ${found.slot}.`);
        setNetworkStatus("Finalized");
    } catch (e) {
        setEpochStatus("Failed. Check the epoch or RPC endpoint and try again.");
        setNetworkStatus("Error");
        showError(e instanceof Error ? e.message : String(e));
    }
});

function setActiveTab(name: string) {
    document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => btn.classList.toggle("isActive", btn.dataset.tab === name));
    document.querySelectorAll<HTMLElement>(".panel").forEach((panel) => panel.classList.toggle("isActive", panel.dataset.panel === name));
}

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab) setActiveTab(tab);
    });
});

function setMode(name: string) {
    document.querySelectorAll<HTMLButtonElement>(".modeButton").forEach((btn) => btn.classList.toggle("isActive", btn.dataset.mode === name));
    document.querySelectorAll<HTMLElement>(".modePanel").forEach((panel) => panel.classList.toggle("isActive", panel.dataset.modePanel === name));
}

document.querySelectorAll<HTMLButtonElement>(".modeButton").forEach((btn) => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (mode) setMode(mode);
    });
});

document.querySelector<HTMLButtonElement>("#jumpHow")!.addEventListener("click", () => {
    setActiveTab("docs");
    document.querySelector("#howItWorks")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

function getQueryParam(name: string): string | null {
    return new URLSearchParams(window.location.search).get(name);
}

function parseNonNegativeInt(s: string | null): number | null {
    if (!s) return null;
    if (!/^\d+$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

let didAutoRun = false;

window.addEventListener("DOMContentLoaded", () => {
    if (didAutoRun) return;
    renderTechnicalOutput();

    const epoch = parseNonNegativeInt(getQueryParam("epoch"));
    if (epoch == null) return;

    didAutoRun = true;
    epochEl.value = String(epoch);
    setActiveTab("verify");
    goEpochEl.click();
});
