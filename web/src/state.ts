// src/state.ts

export interface VerificationState {
    lastBase: any | null;
    lastDebug: any | null;
}

export const state: VerificationState = {
    lastBase: null,
    lastDebug: null,
};

export function setLastVerification(
    base: any,
    debug: any,
): void {
    state.lastBase = base;
    state.lastDebug = debug;
}