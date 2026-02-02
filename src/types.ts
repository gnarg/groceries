import type { AuthProviderInfo as PBAuthProviderInfo } from 'pocketbase';

export interface ItemType {
	id?: string;
	name?: string;
	tags?: string;
	purchased?: boolean;
	purchases?: string[];
	notes?: string;
	count?: number; // Computed: purchases in last 30 days (for sorting)
}

export interface NewItemForm {
	name: string;
	tags: string;
	notes: string;
	purchased: boolean;
}

export type AuthProviderInfo = PBAuthProviderInfo;
