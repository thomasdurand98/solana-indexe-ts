// src/types/index.ts
import { SlotUpdate as SolanaSlotUpdate } from '@solana/web3.js';

export interface SolanaConfig {
    rpcEndpoint: string;
    wsEndpoint: string;
}

export interface WebSocketMessage {
    jsonrpc: string;
    method?: string;
    params?: {
        result: SolanaSlotUpdate;
        subscription: number;
    };
    result?: any;
    id?: number;
}