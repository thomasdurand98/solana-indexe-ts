import { SolanaWebSocketClient } from "./blockchain/websocket";
import { config } from "./config/config";

async function main() {
    console.log('Starting Solana WebSocket Client...');
    console.log('Connecting to:', config.solana.wsEndpoint);

    const client = new SolanaWebSocketClient(config.solana)
    
    process.on('SIGINT', () => {
        console.log('Closing WebSocket connection...');
        client.close();
        process.exit();
    });
}

main().catch(console.error);