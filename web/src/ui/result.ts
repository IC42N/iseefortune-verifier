import { escapeHtml, shortHash } from "../utils/html";
import { copyIcon } from "../utils/copy";
import { wireCopyButtons } from "../utils/copy";
import type { VerificationViewModel } from "../types";
import {renderIcons} from "./icons";

export function buildCalculationSummary(res: any) {
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

export function renderResult(
    resultCardEl: HTMLDivElement,
    calculationTimelineEl: HTMLDivElement,
    vm: VerificationViewModel
) {
    const epochLine =
        vm.epoch == null
            ? "Manual slot verification"
            : `Epoch ${vm.epoch}`;

    resultCardEl.classList.remove("isEmpty");

    resultCardEl.innerHTML = `
      <div class="resultGrid">
        <div class="winningPanel">
          <span class="stepPill success">Verified</span>
          <p>Winning Number</p>
          <div class="winningNumber">${vm.winningNumber}</div>
          <small>${epochLine}</small>
        </div>

        <div class="resultFacts">
          <div>
            <span>Slot</span>
            <b>${escapeHtml(vm.slot)}</b>
          </div>

          <div>
            <span>Blockhash</span>
            <b title="${escapeHtml(vm.blockhash)}">
              ${escapeHtml(shortHash(vm.blockhash))}
            </b>
            ${copyIcon(vm.blockhash, "Copy blockhash")}
          </div>

          <div>
            <span>Range</span>
            <b>0 ~ 9</b>
          </div>

          <div>
            <span>Generated</span>
            <b>${escapeHtml(vm.generatedAt)}</b>
          </div>
        </div>

        <div class="offlineBox">
          <h3>Verify offline</h3>
          <p>
            Copy these exact inputs or download the repo.
            Anyone using the same slot and blockhash should
            get this same result.
          </p>

          <div class="miniActions">
            <button
              class="copyTextButton"
              data-copy="${escapeHtml(vm.slot)}"
            >
              Copy slot
            </button>

            <button
              class="copyTextButton"
              data-copy="${escapeHtml(vm.blockhash)}"
            >
              Copy blockhash
            </button>
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
          <small>
            <code>${String(r.digest_sum_u64)}</code>
          </small>
        </div>
      </div>

      <div class="timelineStep isDone">
        <span>4</span>
        <div>
          <b>Apply Formula</b>
          <small>Number % ${r.modulus} + 1</small>
          <small>
            <code>
              (${String(r.digest_sum_u64)} % ${r.modulus}) + 1
              = ${vm.winningNumber}
            </code>
          </small>
        </div>
      </div>

      <div class="timelineStep isDone winningStep">
        <span>5</span>

        <div class="winningResult">
          <b>Winning Number</b>

          <div class="timelineWinningContainer">
            <div class="timelineWinning">
              ${vm.winningNumber}
            </div>
          </div>
        </div>
      </div>
    `;

    renderIcons();
    wireCopyButtons();
}