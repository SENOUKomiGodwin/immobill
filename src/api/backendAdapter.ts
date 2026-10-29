/**
 * Adaptateur temporaire pour remplacer Base44 SDK par le backend NestJS
 * Cet adaptateur mappe les méthodes Base44 vers des appels HTTP typés
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper pour obtenir le token
const getToken = (): string => {
  return localStorage.getItem('token') || '';
};

// Helper pour les requêtes HTTP
const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Types des entités (simplifiés pour l'adaptateur)
interface BaseEntity {
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
}

// Interface d'une entité avec CRUD
interface EntityHandler<T extends BaseEntity> {
  create(data: Partial<T>): Promise<T>;
  filter(query?: Record<string, unknown>, options?: Record<string, unknown>): Promise<T[] | { items: T[]; meta: any }>;
  get(id: string): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Générateur d'handler d'entité
function createEntityHandler<T extends BaseEntity>(entityName: string): EntityHandler<T> {
  return {
    async create(data: Partial<T>): Promise<T> {
      return request<T>(`/${entityName.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async filter(query?: Record<string, unknown>, options?: Record<string, unknown>): Promise<T[] | { items: T[]; meta: any }> {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const url = `/${entityName.toLowerCase()}${params.toString() ? `?${params}` : ''}`;
      return request<T[] | { items: T[]; meta: any }>(url);
    },

    async get(id: string): Promise<T> {
      return request<T>(`/${entityName.toLowerCase()}/${id}`);
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      return request<T>(`/${entityName.toLowerCase()}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<void> {
      await request<void>(`/${entityName.toLowerCase()}/${id}`, {
        method: 'DELETE',
      });
    },
  };
}

// Intégrations Core (simulées pour compatibilité)
const coreIntegrations = {
  Core: {
    UploadPrivateFile: async ({ file }: { file: File }) => {
      // Simplified: just return a mock file_uri for now
      // TODO: Implement proper file upload with backend
      const file_key = `uploads/${Date.now()}-${file.name}`;
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/files/upload-simple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type,
          size: file.size,
          file_key,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return {
        file_uri: data.file_uri,
        id: data.id,
      };
    },

    CreateFileSignedUrl: async ({ file_uri, expires_in }: { file_uri: string; expires_in: number }) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/files/signed-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_uri, expires_in }),
      });

      if (!response.ok) {
        throw new Error('Failed to create signed URL');
      }

      return response.json();
    },
  },
};

// Client principal qui remplace base44
export const backendClient = {
  entities: {
    Expense: createEntityHandler('Expense'),
    Lease: createEntityHandler('Lease'),
    Payment: createEntityHandler('Payment'),
    Property: createEntityHandler('Property'),
    RentDue: createEntityHandler('RentDue'),
    Tenant: createEntityHandler('Tenant'),
    Unit: createEntityHandler('Unit'),
    User: createEntityHandler('User'),
    Reminder: createEntityHandler('Reminder'),
  },
  integrations: coreIntegrations,
};

// Export avec le même nom que base44 pour compatibilité
export const base44 = backendClient;
