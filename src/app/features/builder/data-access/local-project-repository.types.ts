export interface ProjectStorageLock {
  request<TValue>(name: string, callback: () => TValue | PromiseLike<TValue>): Promise<TValue>;
}
