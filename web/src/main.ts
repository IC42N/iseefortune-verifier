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
const mobileBackToVerifyEl = document.querySelector<HTMLButtonElement>("#mobileBackToVerify");
const lastEpochLinkEl = document.querySelector<HTMLAnchorElement>("#lastEpochLink")!;
//
// Helpers
//

function loadEpochFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const epochParam = params.get("epoch");

    if (!epochParam || !/^\d+$/.test(epochParam)) {
        return;
    }

    epochEl.value = epochParam;

    window.setTimeout(() => {
        goEpochEl.click();
    }, 0);
}

mobileBackToVerifyEl?.addEventListener("click", () => {
    document.querySelector(".verifierCard")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
});
function setEpochStatus(
    msg: string,
    type?: "loading" | "success" | "error",
) {
    epochStatusEl.textContent = msg;
    epochStatusEl.hidden = !msg.trim();

    epochStatusEl.classList.remove(
        "loading",
        "success",
        "error",
    );

    if (type) {
        epochStatusEl.classList.add(type);
    }
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

async function loadLatestCompletedEpochPlaceholder() {
    try {
        const rpcUrl = rpcEl.value.trim() || DEFAULT_RPC;
        const conn = new Connection(rpcUrl, "finalized");

        const currentEpoch = await getCurrentEpoch(conn);
        const latestCompletedEpoch = currentEpoch - 1;

        epochEl.placeholder = `e.g. ${latestCompletedEpoch}`;

        lastEpochLinkEl.textContent = String(latestCompletedEpoch);
        lastEpochLinkEl.href = `/?epoch=${latestCompletedEpoch}`;
    } catch (err) {
        console.error("Unable to load latest completed epoch:", err);

        epochEl.placeholder = "e.g. completed epoch";

        lastEpochLinkEl.textContent = "--";
        lastEpochLinkEl.removeAttribute("href");
    }
}

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
        setEpochStatus("Epoch is required.", "error");
        return;
    }

    if (!/^\d+$/.test(epochStr)) {
        setNetworkStatus("Ready");
        setEpochStatus("Epoch must be a non-negative integer.", "error");
        return;
    }

    const rpcUrl = rpcEl.value.trim() || DEFAULT_RPC;
    const epoch = Number(epochStr);

    try {
        const conn = new Connection(rpcUrl, "finalized");

        setEpochStatus("Checking epoch status...","loading");

        const currentEpoch = await getCurrentEpoch(conn);

        if (epoch >= currentEpoch) {
            setNetworkStatus("Waiting");
            setEpochStatus(`Epoch ${epoch} has not ended yet.`, "error");
            return;
        }

        setEpochStatus("Fetching epoch schedule...", "loading");

        const schedule = await fetchEpochSchedule(conn);
        const lastSlot = schedule.getLastSlotInEpoch(epoch);

        setEpochStatus("Searching for finalized blockhash...","loading");

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

        setEpochStatus(`✓ Verified epoch ${epoch}`, "success");
        setNetworkStatus("Finalized");
    } catch (err) {
        console.error(err);

        setNetworkStatus("Error");
        setEpochStatus(
            err instanceof Error
                ? err.message
                : String(err),
            "error",
        );
    }
});

//
// Startup
//
bindTabs();
bindModes();

void loadLatestCompletedEpochPlaceholder();

loadEpochFromUrl();

refreshTechnicalOutput();
renderIcons();