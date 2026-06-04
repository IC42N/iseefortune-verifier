export function setActiveTab(name: string) {
    document
        .querySelectorAll<HTMLButtonElement>(".tab")
        .forEach((btn) => {
            btn.classList.toggle("isActive", btn.dataset.tab === name);
        });

    document
        .querySelectorAll<HTMLElement>(".panel")
        .forEach((panel) => {
            panel.classList.toggle("isActive", panel.dataset.panel === name);
        });
}

export function bindTabs() {
    document
        .querySelectorAll<HTMLButtonElement>(".tab")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                if (tab) setActiveTab(tab);
            });
        });

    document
        .querySelector<HTMLButtonElement>("#jumpHow")
        ?.addEventListener("click", () => {
            setActiveTab("docs");
            document
                .querySelector("#howItWorks")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
}

export function setMode(name: string) {
    document
        .querySelectorAll<HTMLButtonElement>(".modeButton")
        .forEach((btn) => {
            btn.classList.toggle("isActive", btn.dataset.mode === name);
        });

    document
        .querySelectorAll<HTMLElement>(".modePanel")
        .forEach((panel) => {
            panel.classList.toggle(
                "isActive",
                panel.dataset.modePanel === name
            );
        });
}

export function bindModes() {
    document
        .querySelectorAll<HTMLButtonElement>(".modeButton")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.mode;
                if (mode) setMode(mode);
            });
        });
}