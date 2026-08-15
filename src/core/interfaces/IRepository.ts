/**
 * IRepository.ts — core/interfaces/
 *
 * Generic repository interface for data persistence. All domain entities
 * are accessed through repositories that implement this contract, allowing
 * the domain layer to remain agnostic of the storage mechanism (API client,
 * local cache, mock data, etc.).
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: unknown): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}