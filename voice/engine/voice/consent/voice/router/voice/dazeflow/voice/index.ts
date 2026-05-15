/**
 *  * NOIZYLAB · voice/index.ts
  * ─────────────────────────────────────────────────────────────────────────────
   * Sovereign Voice Pipeline — empire entry point.
    * Wires VoiceEngine + ConsentOracle + EmpireRouter + DazeflowLogger together.
     *
      * Pipeline: input → route brand → validate consent → speak → log to DAZEFLOW
       *
        * Usage:
         *   import { pipeline } from "./voice/index.js";
          *   await pipeline.say("Deploy noizyfish.com", { requireConsent: true });
           *
            * killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
             * ─────────────────────────────────────────────────────────────────────────────
              */

              export { VoiceEngine, voiceEngine } from "./engine/VoiceEngine.js";
              export type { VoicePersona, VoiceRequest, VoiceResponse, VoiceEngineConfig } from "./engine/VoiceEngine.js";

              export { ConsentOracle, consentOracle, NEVER_CLAUSES } from "./consent/ConsentOracle.js";
              export type { ConsentToken, CovenantCheckResult, SynthesisRequest, NeverClauseCode } from "./consent/ConsentOracle.js";

              export { EmpireRouter, empireRouter, EMPIRE_BRANDS } from "./router/EmpireRouter.js";
              export type { EmpireBrand, BrandConfig, RouteResult } from "./router/EmpireRouter.js";

              export { DazeflowLogger, dazeflow } from "./dazeflow/DazeflowLogger.js";
              export type { DazeflowEvent, DazeflowEventType, DazeflowConfig } from "./dazeflow/DazeflowLogger.js";

              import { voiceEngine } from "./engine/VoiceEngine.js";
              import { consentOracle } from "./consent/ConsentOracle.js";
              import { empireRouter } from "./router/EmpireRouter.js";
              import { dazeflow } from "./dazeflow/DazeflowLogger.js";

              // ═══════════════════════════════════════════════════════════════
              // PIPELINE — the sovereign voice execution layer
              // ═══════════════════════════════════════════════════════════════

              export interface PipelineOptions {
                persona?: string;
                  requireConsent?: boolean;
                    consentToken?: string;
                      actorId?: string;
                        descendantId?: string;
                          territory?: string;
                            priority?: "normal" | "urgent" | "background";
                            }

                            export interface PipelineResult {
                              success: boolean;
                                brand?: string;
                                  persona: string;
                                    voiceResult?: import("./engine/VoiceEngine.js").VoiceResponse;
                                      consentResult?: import("./consent/ConsentOracle.js").CovenantCheckResult;
                                        durationMs: number;
                                          error?: string;
                                          }

                                          class SovereignVoicePipeline {
                                            /**
                                               * Route input → validate consent → speak → log.
                                                  * This is the primary API for the entire voice layer.
                                                     */
                                                       async say(text: string, opts: PipelineOptions = {}): Promise<PipelineResult> {
                                                           const started = Date.now();

                                                               // 1. Route to brand
                                                                   const route = empireRouter.route(text);
                                                                       const persona = (opts.persona ?? route.config.voicePersona) as import("./engine/VoiceEngine.js").VoicePersona;

                                                                           // 2. Consent check (if required)
                                                                               if (opts.requireConsent && opts.consentToken) {
                                                                                     const consentResult = await consentOracle.validate({
                                                                                             tokenId: opts.consentToken,
                                                                                                     actorId: opts.actorId ?? "RSP_001",
                                                                                                             descendantId: opts.descendantId ?? "",
                                                                                                                     useCategory: "voice_synthesis",
                                                                                                                             territory: opts.territory ?? "CA",
                                                                                                                                     text,
                                                                                                                                           });

                                                                                                                                                 await dazeflow.consentLog(
                                                                                                                                                         consentResult.pass,
                                                                                                                                                                 opts.consentToken,
                                                                                                                                                                         route.brand
                                                                                                                                                                               );

                                                                                                                                                                                     if (!consentResult.pass) {
                                                                                                                                                                                             if (consentResult.neverClausesViolated.length > 0) {
                                                                                                                                                                                                       await dazeflow.neverClauseHit(consentResult.neverClausesViolated, text.slice(0, 100));
                                                                                                                                                                                                               }
                                                                                                                                                                                                                       return {
                                                                                                                                                                                                                                 success: false,
                                                                                                                                                                                                                                           brand: route.brand,
                                                                                                                                                                                                                                                     persona,
                                                                                                                                                                                                                                                               consentResult,
                                                                                                                                                                                                                                                                         durationMs: Date.now() - started,
                                                                                                                                                                                                                                                                                   error: `consent_fail: ${consentResult.checks.filter((c) => !c.pass).map((c) => c.name).join(", ")}`,
                                                                                                                                                                                                                                                                                           };
                                                                                                                                                                                                                                                                                                 }
                                                                                                                                                                                                                                                                                                     }

                                                                                                                                                                                                                                                                                                         // 3. Speak
                                                                                                                                                                                                                                                                                                             const voiceResult = await voiceEngine.speak({ text, persona, priority: opts.priority });

                                                                                                                                                                                                                                                                                                                 // 4. Log to DAZEFLOW
                                                                                                                                                                                                                                                                                                                     await dazeflow.voiceSpoken(persona, text, route.brand);

                                                                                                                                                                                                                                                                                                                         return {
                                                                                                                                                                                                                                                                                                                               success: voiceResult.success,
                                                                                                                                                                                                                                                                                                                                     brand: route.brand,
                                                                                                                                                                                                                                                                                                                                           persona,
                                                                                                                                                                                                                                                                                                                                                 voiceResult,
                                                                                                                                                                                                                                                                                                                                                       durationMs: Date.now() - started,
                                                                                                                                                                                                                                                                                                                                                             error: voiceResult.error,
                                                                                                                                                                                                                                                                                                                                                                 };
                                                                                                                                                                                                                                                                                                                                                                   }

                                                                                                                                                                                                                                                                                                                                                                     /**
                                                                                                                                                                                                                                                                                                                                                                        * Health check across the full voice stack.
                                                                                                                                                                                                                                                                                                                                                                           */
                                                                                                                                                                                                                                                                                                                                                                             async health(): Promise<{
                                                                                                                                                                                                                                                                                                                                                                                 voiceService: string;
                                                                                                                                                                                                                                                                                                                                                                                     router: boolean;
                                                                                                                                                                                                                                                                                                                                                                                         covenant: boolean;
                                                                                                                                                                                                                                                                                                                                                                                           }> {
                                                                                                                                                                                                                                                                                                                                                                                               const [voiceService] = await Promise.all([
                                                                                                                                                                                                                                                                                                                                                                                                     voiceEngine.health(),
                                                                                                                                                                                                                                                                                                                                                                                                         ]);

                                                                                                                                                                                                                                                                                                                                                                                                             return {
                                                                                                                                                                                                                                                                                                                                                                                                                   voiceService,
                                                                                                                                                                                                                                                                                                                                                                                                                         router: true,
                                                                                                                                                                                                                                                                                                                                                                                                                               covenant: empireRouter.verifyCovenant(),
                                                                                                                                                                                                                                                                                                                                                                                                                                   };
                                                                                                                                                                                                                                                                                                                                                                                                                                     }

                                                                                                                                                                                                                                                                                                                                                                                                                                       /**
                                                                                                                                                                                                                                                                                                                                                                                                                                          * Morning brief — log empire status to DAZEFLOW.
                                                                                                                                                                                                                                                                                                                                                                                                                                             */
                                                                                                                                                                                                                                                                                                                                                                                                                                               async morningBrief(stats: Record<string, unknown>): Promise<void> {
                                                                                                                                                                                                                                                                                                                                                                                                                                                   const h = await this.health();
                                                                                                                                                                                                                                                                                                                                                                                                                                                       await dazeflow.morningBrief(
                                                                                                                                                                                                                                                                                                                                                                                                                                                             `Empire morning brief — voice: ${h.voiceService} | covenant: ${h.covenant ? "OK" : "VIOLATED"}`,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                   { ...stats, health: h, timestamp: new Date().toISOString() }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                       );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                           await this.say("Good morning. Empire systems online. GABRIEL ready.", {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 persona: "gabriel",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       export const pipeline = new SovereignVoicePipeline();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       export default pipeline;
 */