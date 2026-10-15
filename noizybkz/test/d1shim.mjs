// Minimal Cloudflare D1 API over node:sqlite, for tests only.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Stmt(this.db, this.sql, args); }
  _s() { return this.db.prepare(this.sql); }
  async all() { return { results: this._s().all(...this.args).map((r) => ({ ...r })) }; }
  async first() { const r = this._s().get(...this.args); return r ? { ...r } : null; }
  async run() { this._s().run(...this.args); return { success: true }; }
}

export function makeDB() {
  const db = new DatabaseSync(":memory:");
  for (const m of ["0001_init.sql", "0002_llt.sql", "0003_bank.sql"]) db.exec(readFileSync(new URL(`../migrations/${m}`, import.meta.url), "utf8"));
  return {
    prepare: (sql) => new Stmt(db, sql),
    async batch(stmts) {
      db.exec("BEGIN");
      try { for (const s of stmts) await s.run(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
      return stmts.map(() => ({ success: true }));
    },
  };
}
