import type { buildCalculationSummary } from "./ui/result";

export type VerificationViewModel = {
    epoch?: number;
    slot: string;
    blockhash: string;
    range: number;
    winningNumber: number;
    calculation: ReturnType<typeof buildCalculationSummary>;
    generatedAt: string;
};