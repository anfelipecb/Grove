const crisisSignals = [
  "kill myself",
  "end my life",
  "suicide",
  "self harm",
  "self-harm",
  "hurt myself",
  "can't go on",
  "cant go on",
];

export const CRISIS_SUPPORT_MESSAGE =
  "Grove is not crisis support. If you might hurt yourself or someone else, call 988 in the U.S. or your local emergency number now. If you can, reach out to a trusted person and stay near other people while you get help.";

export function containsCrisisSignal(input: string) {
  const normalized = input.toLowerCase();
  return crisisSignals.some((signal) => normalized.includes(signal));
}

