import "./style.css";
import { verifyFromSlotAndBlockhash } from "./verify";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="wrap">
  <div class="header">
       <h1>ISeeFortune Verifier</h1>
        <div class="small">
          Computes the winning number locally in your browser using the algorithm in <a
              href="https://github.com/IC42N/iseefortune-verifier/blob/main/SPEC.md"
              target="_blank"
              rel="noreferrer"
            >SPEC.md</a>.
        </div>
    </div>
   

    <div style="height:14px"></div>

    <div class="card">
      <div class="row">
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

      <div class="row" style="align-items:center; justify-content: space-between;">
        <label class="small" style="display:flex; gap:8px; align-items:center;">
          <input id="debug" type="checkbox" />
          Show debug
        </label>

        <button id="go">Verify</button>
      </div>

      <div id="out" class="out" style="display:none;"></div>
    </div>

    <div style="height:14px"></div>
    <div class="small text-center">
      Tip: this site is static; you can inspect-source and reproduce the same output with the Rust/TS tools in the repo.
    </div>
  </div>
`;

const slotEl = document.querySelector<HTMLInputElement>("#slot")!;
const bhEl = document.querySelector<HTMLInputElement>("#blockhash")!;
const dbgEl = document.querySelector<HTMLInputElement>("#debug")!;
const outEl = document.querySelector<HTMLDivElement>("#out")!;
const goEl = document.querySelector<HTMLButtonElement>("#go")!;

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

goEl.addEventListener("click", () => {
    try {
        const slotStr = slotEl.value.trim();
        const blockhash = bhEl.value.trim();

        if (!slotStr) return showError("slot is required");
        if (!blockhash) return showError("blockhash is required");

        // BigInt parse
        const slot = BigInt(slotStr);

        const res = verifyFromSlotAndBlockhash(slot, blockhash, 10);

        if (dbgEl.checked) {
            show({
                slot: slotStr,
                blockhash,
                range: 10,
                winning_number: res.winningNumber,
                debug: res.debug
            });
        } else {
            show({
                slot: slotStr,
                blockhash,
                range: 10,
                winning_number: res.winningNumber
            });
        }
    } catch (e) {
        showError(e instanceof Error ? e.message : String(e));
    }
});