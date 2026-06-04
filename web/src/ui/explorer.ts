import { EXPLORER_BASE } from "../config";

export function explorerEpochUrl(epoch: number) {
    return `${EXPLORER_BASE}/epoch/${epoch}`;
}

export function explorerBlockUrl(slot: number) {
    return `${EXPLORER_BASE}/block/${slot}`;
}

export function showExplorerLinks(
    explorerLinksEl: HTMLDivElement,
    epoch: number,
    slot: number
) {
    explorerLinksEl.classList.add("isVisible");

    explorerLinksEl.innerHTML = `
      <span>Source links:</span>

      <a
        href="${explorerEpochUrl(epoch)}"
        target="_blank"
        rel="noreferrer"
      >
        View epoch ${epoch}
      </a>

      <a
        href="${explorerBlockUrl(slot)}"
        target="_blank"
        rel="noreferrer"
      >
        View slot ${slot}
      </a>
    `;
}

export function clearExplorerLinks(
    explorerLinksEl: HTMLDivElement
) {
    explorerLinksEl.classList.remove("isVisible");
    explorerLinksEl.innerHTML = "";
}