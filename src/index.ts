import { SolanaWebSocketClient } from "./blockchain/websocket";
import { config } from "./config/config";

async function main() {
    console.log('Starting Solana WebSocket Client for testing...');
    console.log('Connecting to:', config.solana.wsEndpoint);

    const client = new SolanaWebSocketClient(config.solana);
    
    // Let it run for 60 seconds to catch some real-time blocks
    console.log('Listening for slots for 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('Test finished. Closing connection...');
    client.close();
}

main().catch(error => {
    console.error('Test failed:', error);
});
