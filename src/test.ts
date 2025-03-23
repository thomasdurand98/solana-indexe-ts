// src/test.ts
import { Connection } from '@solana/web3.js';
import { BlockFetcher } from './blockchain/blockFetcher';
import { config } from './config/config';

async function testWithKnownBlock() {
    console.log('Starting test with a known block...');
    
    // Create connection and block fetcher
    const connection = new Connection(config.solana.rpcEndpoint);
    const blockFetcher = new BlockFetcher(connection);
    
    // Recent mainnet block that likely contains transfers
    // You can replace this with any recent slot number
    const testSlot = 324383470; // Example slot number
    
    console.log(`Fetching and analyzing block at slot ${testSlot}`);
    await blockFetcher.fetchBlock(testSlot);
    
    console.log('Test completed');
}

async function main() {
    // Test with a known block
    await testWithKnownBlock();
    
    // Uncomment to test with a specific transaction
    // await testWithSignature();
}

main().catch(error => {
    console.error('Test failed:', error);
});