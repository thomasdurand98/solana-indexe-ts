// src/blockchain/blockFetcher.ts
import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { TransactionDetector } from './detector';

export class BlockFetcher {
    private readonly MAX_RETRIES = 5;
    private readonly MAX_CONCURRENT_TRANSACTIONS = 20;

    constructor(private connection: Connection) {}

    async fetchBlock(slot: number, attempt: number = 1): Promise<void> {
        try {
            console.log(`Fetching slot: ${slot}`);

            const block = await this.connection.getBlock(slot, {
                maxSupportedTransactionVersion: 0,
                rewards: false,
                commitment: 'confirmed',
                transactionDetails: 'full'
            });

            if (!block) {
                console.log(`No block data found for slot ${slot}`);
                return;
            }

            // Filter out failed transactions
            const validTransactions = block.transactions.filter(tx => 
                !tx.meta?.err
            );

            console.log(`Processing ${validTransactions.length} valid transactions`);

            // Process transactions in parallel with chunking
            const chunkSize = this.MAX_CONCURRENT_TRANSACTIONS;
            for (let i = 0; i < validTransactions.length; i += chunkSize) {
                const chunk = validTransactions.slice(i, i + chunkSize);
                await Promise.all(
                    chunk.map(tx => this.parseTransaction(tx))
                );
            }

        } catch (error) {
            console.error(`Error fetching block ${slot}:`, error);
            await this.retryFetchBlock(slot, attempt);
        }
    }

    private async retryFetchBlock(slot: number, attempt: number): Promise<void> {
        if (attempt <= this.MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Retrying block ${slot} in ${delay}ms (attempt ${attempt})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.fetchBlock(slot, attempt + 1);
        } else {
            console.error(`Exceeded max retries for block ${slot}`);
        }
    }

    private async parseTransaction(transaction: ParsedTransactionWithMeta) {
        try {
            const signature = transaction.transaction.signatures[0];
            
            // Use our detector to identify transaction type
            const dexInfo = TransactionDetector.isDex(transaction);
            if (dexInfo) {
                console.log(`DEX Transaction detected: ${dexInfo.dex}`);
                // Add DEX parsing logic
                return;
            }

            if (TransactionDetector.isTokenCreation(transaction)) {
                console.log('Token Creation detected');
                // Add token creation parsing logic
                return;
            }

            if (TransactionDetector.isContractCreation(transaction)) {
                console.log('Contract Creation detected');
                // Add contract creation parsing logic
                return;
            }

            if (TransactionDetector.isTransfer(transaction)) {
                console.log('Transfer detected');
                // Add transfer parsing logic
                return;
            }

            console.log(`No specific parser for transaction: ${signature}`);

        } catch (error) {
            console.error('Error processing transaction:', error);
        }
    }
}