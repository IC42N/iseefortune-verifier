export function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function shortHash(value: string) {
    if (value.length <= 18) return value;
    return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

export function stringifyBigIntSafe(obj: unknown) {
    return JSON.stringify(
        obj,
        (_key, value) => (typeof value === "bigint" ? value.toString() : value),
        2
    );
}