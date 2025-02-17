// src/config/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    solana: {
        rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        wsEndpoint: process.env.SOLANA_WS_ENDPOINT || 'wss://api.mainnet-beta.solana.com',
    },
    // We can add more configuration here as needed
};