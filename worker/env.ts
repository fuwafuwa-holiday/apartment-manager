import type { drizzle } from 'drizzle-orm/d1';

/** drizzle-orm/d1 が要求する D1 クライアント型（@cloudflare/workers-types を直接参照しないための別名） */
export type D1Like = Parameters<typeof drizzle>[0];

export interface Env {
  /** D1 データベース (wrangler.jsonc の d1_databases.binding) */
  DB: D1Like;
  /** 静的アセット (renderer/out) */
  ASSETS: { fetch(request: Request): Promise<Response> };
  /**
   * Cloudflare Access の設定。両方セットした場合のみ Worker 側でも JWT を検証する。
   * 例: ACCESS_TEAM_DOMAIN="your-team.cloudflareaccess.com", ACCESS_AUD="<Application Audience Tag>"
   */
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  /** 開発時に別オリジン (next dev) から叩く場合の許可オリジン */
  ALLOWED_ORIGIN?: string;
}
