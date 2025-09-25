// Simple in-memory session storage (in production, use Redis or database)
class SessionStorage {
  private sessions = new Map<string, any>();

  set(sessionId: string, data: any): void {
    this.sessions.set(sessionId, data);
  }

  get(sessionId: string): any {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

// Export singleton instance
const sessionStorage = new SessionStorage();
export default sessionStorage;