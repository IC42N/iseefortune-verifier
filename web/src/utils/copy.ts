import { escapeHtml } from "./html";

export function copyIcon(value: string, label = "Copy") {
    return `
      <button
        class="copyIcon"
        type="button"
        data-copy="${escapeHtml(value)}"
        aria-label="${escapeHtml(label)}"
        title="${escapeHtml(label)}"
      >
        <i data-lucide="copy"></i>
      </button>
    `;
}

export function wireCopyButtons() {
    document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const value = btn.dataset.copy ?? "";
            const originalText = btn.textContent;

            await navigator.clipboard.writeText(value);

            btn.classList.add("isCopied");
            btn.setAttribute("aria-label", "Copied");
            btn.setAttribute("title", "Copied");

            if (btn.classList.contains("copyTextButton")) {
                btn.textContent = "Copied";
            }

            setTimeout(() => {
                btn.classList.remove("isCopied");
                btn.setAttribute("aria-label", "Copy");
                btn.setAttribute("title", "Copy");

                if (btn.classList.contains("copyTextButton")) {
                    btn.textContent = originalText;
                }
            }, 900);
        });
    });
}