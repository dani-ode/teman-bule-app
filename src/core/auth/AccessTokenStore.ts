/**
 * Access-token memory store. Access tokens live only in memory (R05);
 * never persisted to disk, navigation params, or analytics.
 */
export class AccessTokenStore {
  private token: string | null = null;

  public get(): string | null {
    return this.token;
  }

  public set(token: string): void {
    this.token = token;
  }

  public clear(): void {
    this.token = null;
  }
}
