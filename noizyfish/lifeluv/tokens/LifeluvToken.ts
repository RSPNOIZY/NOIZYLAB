/**
 *  * NOIZYFISH · LIFELUV · Token System
  * ─────────────────────────────────────────────────────────────────────────────
   * Credits & Tokens for everyone who helps share LIFELUV — in every way possible.
    *
     * 1,000 Credits = 1 LIFELUV Token
      * 75% of token revenue → contributors & recipients
       * 25% → program operations, new territory entry, restoration supplies
        *
         * Ledger: append-only. Never UPDATE. Never DELETE.
          * killSwitchHolder: RSP_001 | covenant: 75/25 | canon: noizy.ai
           * ─────────────────────────────────────────────────────────────────────────────
            */

            import { randomBytes } from "node:crypto";

            // ═══════════════════════════════════════════════════════════════
            // CREDIT ACTIONS — every way to earn
            // ═══════════════════════════════════════════════════════════════

            export const CREDIT_ACTIONS = {
              // Restoration
                RESTORE_INSTRUMENT:      { credits: 500, label: "Restore an instrument" },
                  RESTORE_APPLE_DEVICE:    { credits: 300, label: "Restore an Apple device" },

                    // Teaching & Content
                      TEACH_MUSIC_LESSON:      { credits: 200, label: "Teach a music lesson (1 hour)" },
                        RECORD_TUTORIAL:         { credits: 400, label: "Record a lesson or tutorial" },
                          TRANSLATE_CONTENT:       { credits: 300, label: "Translate LIFELUV content to local language" },
                            FACILITATE_WORKSHOP:     { credits: 500, label: "Community workshop facilitation" },

                              // Logistics & Distribution
                                DELIVER_GEAR:            { credits: 100, label: "Deliver/transport gear" },
                                  SUBMIT_INSTRUMENT:       { credits:  50, label: "Submit an instrument for restoration" },

                                    // Community Growth
                                      REFER_PARTNER:           { credits: 250, label: "Refer a new community partner" },
                                        INTRO_MILITARY_PARTNER:  { credits: 1000, label: "Military/public works partnership intro" },
                                          SHARE_SOCIAL_MEDIA:      { credits:  25, label: "Share LIFELUV on social media" },

                                            // Family & App
                                              REGISTER_RECIPIENT_FAMILY: { credits: 150, label: "Register a recipient family" },
                                                COMPLETE_FAMILY_PROFILE:   { credits: 100, label: "Complete a myFAMILY.AI family profile" },
                                                  INVITE_FAMILY_MEMBER:      { credits:  75, label: "Invite a family member to myFAMILY.AI" },
                                                  } as const;

                                                  export type CreditAction = keyof typeof CREDIT_ACTIONS;

                                                  // ═══════════════════════════════════════════════════════════════
                                                  // TOKEN TIERS
                                                  // ═══════════════════════════════════════════════════════════════

                                                  export const TOKEN_TIERS = [
                                                    { name: "Seed",    minTokens: 0,   maxTokens: 9,    status: "Community Member",     perks: ["Base access"] },
                                                      { name: "Root",    minTokens: 10,  maxTokens: 49,   status: "LIFELUV Contributor",  perks: ["Priority support", "Digital badge"] },
                                                        { name: "Branch",  minTokens: 50,  maxTokens: 199,  status: "LIFELUV Builder",      perks: ["Producer tools unlocked", "Priority distribution"] },
                                                          { name: "Canopy",  minTokens: 200, maxTokens: 499,  status: "LIFELUV Leader",       perks: ["Revenue sharing", "Profile feature", "Territory lead eligible"] },
                                                            { name: "Forest",  minTokens: 500, maxTokens: Infinity, status: "LIFELUV Legend",   perks: ["Full empire access", "Ambassador status", "Direct RSP_001 channel"] },
                                                            ] as const;

                                                            export type TokenTierName = "Seed" | "Root" | "Branch" | "Canopy" | "Forest";

                                                            // ═══════════════════════════════════════════════════════════════
                                                            // TYPES
                                                            // ═══════════════════════════════════════════════════════════════

                                                            export interface LifeluvContributor {
                                                              id: string;
                                                                name: string;
                                                                  territory: string;
                                                                    program: "INSTRUMENTS" | "APPLE_DEVICES" | "myFAMILY_AI" | "ALL";
                                                                      totalCredits: number;
                                                                        totalTokens: number;
                                                                          tier: TokenTierName;
                                                                            joinedAt: string;
                                                                              lastActivityAt: string;
                                                                                isActive: boolean;
                                                                                }

                                                                                export interface CreditTransaction {
                                                                                  id: string;
                                                                                    contributorId: string;
                                                                                      action: CreditAction;
                                                                                        credits: number;
                                                                                          note?: string;
                                                                                            territory?: string;
                                                                                              timestamp: string;
                                                                                                verifiedBy?: string;   // RSP_001 or local champion ID
                                                                                                }

                                                                                                export interface TokenRedemption {
                                                                                                  id: string;
                                                                                                    contributorId: string;
                                                                                                      tokens: number;
                                                                                                        redeemFor: string;     // "cash_usd" | "cash_local" | "producer_tools" | "noizyvox_credits" | etc.
                                                                                                          amountUsd?: number;
                                                                                                            status: "pending" | "approved" | "paid" | "cancelled";
                                                                                                              requestedAt: string;
                                                                                                                processedAt?: string;
                                                                                                                }

                                                                                                                export interface LifeluvLedgerEntry {
                                                                                                                  id: string;
                                                                                                                    type: "credit_earned" | "token_converted" | "token_redeemed" | "tier_upgrade" | "kill_switch";
                                                                                                                      contributorId: string;
                                                                                                                        credits?: number;
                                                                                                                          tokens?: number;
                                                                                                                            action?: CreditAction;
                                                                                                                              note: string;
                                                                                                                                timestamp: string;
                                                                                                                                  rspPrincipal: "RSP_001";
                                                                                                                                  }

                                                                                                                                  // ═══════════════════════════════════════════════════════════════
                                                                                                                                  // TOKEN ENGINE
                                                                                                                                  // ═══════════════════════════════════════════════════════════════

                                                                                                                                  export class LifeluvTokenEngine {

                                                                                                                                    private readonly CREDITS_PER_TOKEN = 1000;
                                                                                                                                      private readonly REVENUE_SPLIT = { contributors: 75, operations: 25 };

                                                                                                                                        /**
                                                                                                                                           * Calculate credits for an action.
                                                                                                                                              */
                                                                                                                                                creditsFor(action: CreditAction): number {
                                                                                                                                                    return CREDIT_ACTIONS[action].credits;
                                                                                                                                                      }

                                                                                                                                                        /**
                                                                                                                                                           * Convert accumulated credits to tokens.
                                                                                                                                                              * Returns tokens earned (floor division).
                                                                                                                                                                 */
                                                                                                                                                                   convertToTokens(totalCredits: number): { tokens: number; remainingCredits: number } {
                                                                                                                                                                       const tokens = Math.floor(totalCredits / this.CREDITS_PER_TOKEN);
                                                                                                                                                                           const remainingCredits = totalCredits % this.CREDITS_PER_TOKEN;
                                                                                                                                                                               return { tokens, remainingCredits };
                                                                                                                                                                                 }

                                                                                                                                                                                   /**
                                                                                                                                                                                      * Determine tier from lifetime token count.
                                                                                                                                                                                         */
                                                                                                                                                                                           tierFor(totalTokens: number): typeof TOKEN_TIERS[number] {
                                                                                                                                                                                               return [...TOKEN_TIERS].reverse().find((t) => totalTokens >= t.minTokens) ?? TOKEN_TIERS[0];
                                                                                                                                                                                                 }

                                                                                                                                                                                                   /**
                                                                                                                                                                                                      * Calculate revenue split for a token redemption.
                                                                                                                                                                                                         * 75% to contributor, 25% to operations.
                                                                                                                                                                                                            */
                                                                                                                                                                                                              revenueSplit(totalUsd: number): { toContributor: number; toOperations: number } {
                                                                                                                                                                                                                  return {
                                                                                                                                                                                                                        toContributor: Math.round(totalUsd * this.REVENUE_SPLIT.contributors) / 100,
                                                                                                                                                                                                                              toOperations:  Math.round(totalUsd * this.REVENUE_SPLIT.operations) / 100,
                                                                                                                                                                                                                                  };
                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                      /**
                                                                                                                                                                                                                                         * Generate a credit transaction record.
                                                                                                                                                                                                                                            */
                                                                                                                                                                                                                                              buildCreditTransaction(
                                                                                                                                                                                                                                                  contributorId: string,
                                                                                                                                                                                                                                                      action: CreditAction,
                                                                                                                                                                                                                                                          opts?: { note?: string; territory?: string; verifiedBy?: string }
                                                                                                                                                                                                                                                            ): CreditTransaction {
                                                                                                                                                                                                                                                                return {
                                                                                                                                                                                                                                                                      id: this._genId("cred"),
                                                                                                                                                                                                                                                                            contributorId,
                                                                                                                                                                                                                                                                                  action,
                                                                                                                                                                                                                                                                                        credits: this.creditsFor(action),
                                                                                                                                                                                                                                                                                              note: opts?.note,
                                                                                                                                                                                                                                                                                                    territory: opts?.territory,
                                                                                                                                                                                                                                                                                                          timestamp: new Date().toISOString(),
                                                                                                                                                                                                                                                                                                                verifiedBy: opts?.verifiedBy ?? "RSP_001",
                                                                                                                                                                                                                                                                                                                    };
                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                        /**
                                                                                                                                                                                                                                                                                                                           * Build an append-only ledger entry. Never UPDATE or DELETE this.
                                                                                                                                                                                                                                                                                                                              */
                                                                                                                                                                                                                                                                                                                                buildLedgerEntry(
                                                                                                                                                                                                                                                                                                                                    type: LifeluvLedgerEntry["type"],
                                                                                                                                                                                                                                                                                                                                        contributorId: string,
                                                                                                                                                                                                                                                                                                                                            note: string,
                                                                                                                                                                                                                                                                                                                                                opts?: { credits?: number; tokens?: number; action?: CreditAction }
                                                                                                                                                                                                                                                                                                                                                  ): LifeluvLedgerEntry {
                                                                                                                                                                                                                                                                                                                                                      return {
                                                                                                                                                                                                                                                                                                                                                            id: this._genId("ledg"),
                                                                                                                                                                                                                                                                                                                                                                  type,
                                                                                                                                                                                                                                                                                                                                                                        contributorId,
                                                                                                                                                                                                                                                                                                                                                                              credits: opts?.credits,
                                                                                                                                                                                                                                                                                                                                                                                    tokens: opts?.tokens,
                                                                                                                                                                                                                                                                                                                                                                                          action: opts?.action,
                                                                                                                                                                                                                                                                                                                                                                                                note,
                                                                                                                                                                                                                                                                                                                                                                                                      timestamp: new Date().toISOString(),
                                                                                                                                                                                                                                                                                                                                                                                                            rspPrincipal: "RSP_001",
                                                                                                                                                                                                                                                                                                                                                                                                                };
                                                                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                                                                    /**
                                                                                                                                                                                                                                                                                                                                                                                                                       * All actions — for UI display and onboarding.
                                                                                                                                                                                                                                                                                                                                                                                                                          */
                                                                                                                                                                                                                                                                                                                                                                                                                            allActions(): Array<{ action: CreditAction; credits: number; label: string }> {
                                                                                                                                                                                                                                                                                                                                                                                                                                return (Object.entries(CREDIT_ACTIONS) as [CreditAction, { credits: number; label: string }][])
                                                                                                                                                                                                                                                                                                                                                                                                                                      .map(([action, def]) => ({ action, credits: def.credits, label: def.label }))
                                                                                                                                                                                                                                                                                                                                                                                                                                            .sort((a, b) => b.credits - a.credits);
                                                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                                                /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                   * All tiers — for UI display.
                                                                                                                                                                                                                                                                                                                                                                                                                                                      */
                                                                                                                                                                                                                                                                                                                                                                                                                                                        allTiers(): typeof TOKEN_TIERS {
                                                                                                                                                                                                                                                                                                                                                                                                                                                            return TOKEN_TIERS;
                                                                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                // ─── private ─────────────────────────────────────────────────

                                                                                                                                                                                                                                                                                                                                                                                                                                                                  private _genId(prefix: string): string {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          return `${prefix}_${date}_${randomBytes(4).toString("hex")}`;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                            // ═══════════════════════════════════════════════════════════════
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            // SINGLETON
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            // ═══════════════════════════════════════════════════════════════

                                                                                                                                                                                                                                                                                                                                                                                                                                                                            export const lifeluvTokens = new LifeluvTokenEngine();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            export default lifeluvTokens;
 */