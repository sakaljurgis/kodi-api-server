export interface DataStorageServiceInterface {
  get<T>(key: string, fallback: T): Promise<T>;
  set(key: string, data: unknown): Promise<void>;
}
