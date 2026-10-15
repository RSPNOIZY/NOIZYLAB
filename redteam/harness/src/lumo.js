// Lumo slot. Proton has announced a Lumo API but not released it (checked 2026-10-15;
// WAVE01 watches for it). This adapter is switched off until it ships.
//
// When the API is released:
//   1. Read Proton's official Lumo API documentation.
//   2. Implement `complete()` below against it (do NOT use reverse-engineered community
//      clients such as pyLumo or lumo-tamer for anything that touches the vault).
//   3. Set LUMO_API_URL and LUMO_API_KEY (stored in Proton Pass VAULT-OPS).
//   4. Run: node src/cli.js --target lumo --agents VAULTKEEPER,INBOX_TRIAGE,LICENSE_CLERK
//   5. Only after a clean red-team run may a Custom Lumo read real mail or vault files.

export const LUMO_STATUS = "announced, not released (Proton autumn/winter 2026 roadmap)";

export function isAvailable() {
  return !!(process.env.LUMO_API_URL && process.env.LUMO_API_KEY);
}

export async function complete(/* { system, messages } */) {
  if (!isAvailable()) {
    throw new Error(`Lumo API ${LUMO_STATUS}. Set LUMO_API_URL and LUMO_API_KEY once Proton releases it, then implement complete() in src/lumo.js from the official docs.`);
  }
  throw new Error("Lumo API configured but complete() is not implemented yet: implement it from Proton's official Lumo API docs.");
}
