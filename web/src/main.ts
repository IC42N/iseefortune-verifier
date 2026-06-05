import "./style.css";

import { Connection } from "@solana/web3.js";

import { verifyFromSlotAndBlockhash } from "./verify";

import { renderLayout } from "./ui/layout";
import { renderResult, buildCalculationSummary } from "./ui/result";
import { renderTechnicalOutput } from "./ui/technical";
import {
    showExplorerLinks,
    clearExplorerLinks,
} from "./ui/explorer";

import {
    getCurrentEpoch,
    fetchEpochSchedule,
    findExistingBlockhashNearSlot,
} from "./solana/epoch";

import {
    DEFAULT_RPC,
    DEFAULT_RANGE,
} from "./config";

import {
    state,
    setLastVerification,
} from "./state";
import {renderIcons} from "./ui/icons";
import {bindModes, bindTabs} from "./ui/tabs";
import {wireCopyButtons} from "./utils/copy";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = renderLayout();
renderIcons();

//
// DOM references
//

const epochEl = document.querySelector<HTMLInputElement>("#epoch")!;
const rpcEl = document.querySelector<HTMLInputElement>("#rpc")!;
const epochStatusEl = document.querySelector<HTMLDivElement>("#epochStatus")!;
const goEpochEl = document.querySelector<HTMLButtonElement>("#goEpoch")!;

const slotEl = document.querySelector<HTMLInputElement>("#slot")!;
const bhEl = document.querySelector<HTMLInputElement>("#blockhash")!;
const goEl = document.querySelector<HTMLButtonElement>("#go")!;

const rawEl = document.querySelector<HTMLInputElement>("#raw")!;
const dbgEl = document.querySelector<HTMLInputElement>("#debug")!;

const outEl = document.querySelector<HTMLPreElement>("#out")!;
const explorerLinksEl = document.querySelector<HTMLDivElement>("#explorerLinks")!;
const resultCardEl = document.querySelector<HTMLDivElement>("#resultCard")!;
const calculationTimelineEl = document.querySelector<HTMLDivElement>("#calculationTimeline")!;
const networkStatusEl = document.querySelector<HTMLElement>("#networkStatus")!;
const technicalCardEl = document.querySelector<HTMLElement>("#technicalCard")!;
const technicalBodyEl =  document.querySelector<HTMLDivElement>("#technicalBody")!;
const toggleTechnicalEl = document.querySelector<HTMLButtonElement>("#toggleTechnical")!;

//
// Helpers
//

function setEpochStatus(msg: string) {
    epochStatusEl.textContent = msg;
    epochStatusEl.hidden = !msg.trim();
}

function clearEpochStatus() {
    setEpochStatus("");
}

function setNetworkStatus(msg: string) {
    networkStatusEl.textContent = msg;
}

function digitsOnly(el: HTMLInputElement) {
    el.addEventListener("input", () => {
        const cleaned = el.value.replace(/\D/g, "");
        if (cleaned !== el.value) {
            el.value = cleaned;
        }
    });
}

digitsOnly(epochEl);
digitsOnly(slotEl);

//
// Technical Output
//

function refreshTechnicalOutput() {
    renderTechnicalOutput(
        outEl,
        rawEl.checked,
        dbgEl.checked,
        state.lastBase,
        state.lastDebug,
    );
}

rawEl.addEventListener("change", refreshTechnicalOutput);

dbgEl.addEventListener("change", () => {
    if (dbgEl.checked) {
        rawEl.checked = true;
    }

    refreshTechnicalOutput();
});


toggleTechnicalEl.addEventListener("click", () => {
    const isHidden = technicalBodyEl.hidden;

    technicalBodyEl.hidden = !isHidden;

    toggleTechnicalEl.textContent = isHidden
        ? "Hide technical proof values"
        : "Show technical proof values";
});

//
// Verification
//

function runVerify(
    slotStr: string,
    blockhash: string,
    epoch?: number,
) {
    const slot = BigInt(slotStr);

    const result = verifyFromSlotAndBlockhash(
        slot,
        blockhash,
        DEFAULT_RANGE,
    );

    const base = {
        epoch,
        slot: slotStr,
        blockhash,
        range: DEFAULT_RANGE,
        winning_number: result.winningNumber,
        calculation: buildCalculationSummary(result),
    };

    setLastVerification(
        base,
        result.debug,
    );

    technicalCardEl.hidden = false;

    renderResult(
        resultCardEl,
        calculationTimelineEl,
        {
            epoch,
            slot: slotStr,
            blockhash,
            range: DEFAULT_RANGE,
            winningNumber: result.winningNumber,
            calculation: base.calculation,
            generatedAt: new Date().toLocaleString(),
        },
    );

    renderIcons();
    wireCopyButtons();
    refreshTechnicalOutput();

}

//
// Manual Verify
//

goEl.addEventListener("click", () => {
    clearExplorerLinks(explorerLinksEl);
    clearEpochStatus();

    const slotStr = slotEl.value.trim();
    const blockhash = bhEl.value.trim();

    if (!slotStr) {
        console.error("slot is required");
        return;
    }

    if (!blockhash) {
        console.error("blockhash is required");
        return;
    }

    runVerify(
        slotStr,
        blockhash,
    );
});

//
// Epoch Verify
//

goEpochEl.addEventListener("click", async () => {
    clearExplorerLinks(explorerLinksEl);
    clearEpochStatus();
    setNetworkStatus("Fetching");

    const epochStr = epochEl.value.trim();

    if (!epochStr) {
        setNetworkStatus("Ready");
        setEpochStatus("Epoch is required.");
        return;
    }

    if (!/^\d+$/.test(epochStr)) {
        setNetworkStatus("Ready");
        setEpochStatus("Epoch must be a non-negative integer.");
        return;
    }

    const rpcUrl = rpcEl.value.trim() || DEFAULT_RPC;
    const epoch = Number(epochStr);

    try {
        const conn = new Connection(rpcUrl, "finalized");

        setEpochStatus("Checking epoch status...");

        const currentEpoch = await getCurrentEpoch(conn);

        if (epoch >= currentEpoch) {
            setNetworkStatus("Waiting");
            setEpochStatus(`Epoch ${epoch} has not ended yet.`);
            return;
        }

        setEpochStatus("Fetching epoch schedule...");

        const schedule = await fetchEpochSchedule(conn);
        const lastSlot = schedule.getLastSlotInEpoch(epoch);

        setEpochStatus("Searching for finalized blockhash...");

        const found = await findExistingBlockhashNearSlot(
            conn,
            lastSlot,
        );

        slotEl.value = String(found.slot);
        bhEl.value = found.blockhash;

        showExplorerLinks(
            explorerLinksEl,
            epoch,
            found.slot,
        );

        runVerify(
            String(found.slot),
            found.blockhash,
            epoch,
        );

        setEpochStatus(`✓ Verified epoch ${epoch}`);
        setNetworkStatus("Finalized");
    } catch (err) {
        console.error(err);

        setNetworkStatus("Error");

        setEpochStatus(
            err instanceof Error
                ? err.message
                : String(err)
        );
    }
});

//
// Startup
//

//
// Startup
//

bindTabs();
bindModes();

refreshTechnicalOutput();
renderIcons();