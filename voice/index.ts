// NOIZYLAB · voice/index.ts — Sovereign Voice Pipeline entry point
// Pipeline: input → route brand → validate consent → speak → log DAZEFLOW
// killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
export * from "./engine/VoiceEngine.js";
export * from "./engine/voice/consent/ConsentOracle.js";
export * from "./engine/voice/consent/voice/router/EmpireRouter.js";
export * from "./engine/voice/consent/voice/router/voice/dazeflow/DazeflowLogger.js";
export * from "./engine/voice/consent/voice/router/voice/dazeflow/voice/index.js";