import { base44 } from '@/api/base44Client';
import type { EntityMap, EntityName } from '@/types/entities';

interface EntityHandler {
  filter: (query: Record<string, unknown>, options: Record<string, unknown>) => Promise<unknown>;
}

// Charge jusqu'à 500 enregistrements (assez pour un parc de propriétaire indépendant).
export async function fetchAll<K extends EntityName>(
  entityName: K,
  query: Record<string, unknown> = {},
  options: Record<string, unknown> = {},
): Promise<EntityMap[K][]> {
  const handler = (base44.entities as unknown as Record<string, EntityHandler>)[entityName];
  const res = await handler.filter(query, {
    limit: 500,
    sort: '-created_date',
    ...options,
  });
  if (Array.isArray(res)) return res as EntityMap[K][];
  return (res as { items?: EntityMap[K][] } | null)?.items ?? [];
}

export const byId = <T extends { id: string }>(list: T[] | null | undefined): Record<string, T> => {
  const map: Record<string, T> = {};
  (list ?? []).forEach((item) => {
    map[item.id] = item;
  });
  return map;
};
