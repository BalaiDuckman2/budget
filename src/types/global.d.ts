// Déclarations de types globaux
import type { APIClient } from '@/utils/api-client';

declare global {
    interface Window {
        apiClient: APIClient;
    }
}

export {};
