// src/blockchain/blockFetcher.ts
import { Connection, ParsedTransactionMeta, ParsedTransactionWithMeta, TransactionResponse } from '@solana/web3.js';
import { TransactionDetector } from './detector';
import { SwapParser } from '../parsers/swapParser';
import { TransferParser } from '../parsers/transferParser';
import { LiquidityParser } from '../parsers/liquidityParser';

export class BlockFetcher {
    private readonly MAX_RETRIES = 5;
    private readonly MAX_CONCURRENT_TRANSACTIONS = 20;
    private isProcessing = false // only for rate limits of free nodes
    private blockQueue: number[] = []

    constructor(private connection: Connection) {}

    async fetchBlock(slot: number, attempt: number = 1): Promise<void> {
        if (this.isProcessing) {
            this.blockQueue.push(slot);
            return;
        }

        this.isProcessing = true;
        try {
            console.log(`Fetching slot: ${slot}`);

            const block = await this.connection.getParsedBlock(slot, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed',
            });

            if (!block) {
                console.log(`No block data found for slot ${slot}`);
                return;
            }

            if (block.transactions.length > 0) {
                /*console.log('First transaction structure:', 
                    JSON.stringify(block.transactions[0], null, 2)
                );*/
            }

            const validTransactions = block.transactions
            console.log(`Processing ${validTransactions.length} valid transactions`);

            // Process transactions in parallel with chunking
            const chunkSize = this.MAX_CONCURRENT_TRANSACTIONS;
            for (let i = 0; i < validTransactions.length; i += chunkSize) {
                const chunk = validTransactions.slice(i, i + chunkSize);
                await Promise.all(
                    chunk.map(tx => this.parseTransaction(tx))
                );
            }

            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`Error fetching block ${slot}:`, error);
            await this.retryFetchBlock(slot, attempt);
        } finally {
            this.isProcessing = false;
            if (this.blockQueue.length > 0) {
                const nextSlot = this.blockQueue.shift();
                if (nextSlot) {
                    await this.fetchBlock(nextSlot);
                }
            }
        }
    }

    private async retryFetchBlock(slot: number, attempt: number): Promise<void> {
        if (attempt <= this.MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying block ${slot} in ${delay}ms (attempt ${attempt})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.fetchBlock(slot, attempt + 1);
        } else {
            console.error(`Exceeded max retries for block ${slot}`);
        }
    }

    private async parseTransaction(transaction: any) {
        try {
            const signature = transaction.transaction.signatures[0];
            //console.log(`\nAnalyzing transaction: ${signature}`);
            
            const dexResult = TransactionDetector.isDex(transaction)
            
            if (dexResult) {
                const dexType = dexResult.dex
                let swapInfo = null

                //console.log("Dex detected: ", dexType)
                switch(dexType) {
                    case 'Raydium':
                        swapInfo = SwapParser.parseRaydiumSwap(transaction)
                        break;
                    case 'Jupiter':
                        //swapInfo = SwapParser.parseJupiterSwap(transaction)
                        break;
                    case 'PumpFun':
                        //swapInfo = SwapParser.parsePumpFunSwap(transaction)
                        break;
                    case 'Phoenix':
                        //swapInfo = SwapParser.parsePhoenixSwap(transaction)
                        break;
                    case 'Raydium_CAMM':
                        //swapInfo = SwapParser.parseRaydiumCAMMSwap(transaction)
                        break;
                }

                if (swapInfo) {
                    //console.log('Swap Parsed Successfully:', swapInfo);
                }

                if (dexType === 'Raydium') {
                    // Check for add liquidity
                    if (LiquidityParser.isRaydiumAddLiquidity(transaction)) {
                        const liquidityInfo = LiquidityParser.parseRaydiumAddLiquidity(transaction);
                        if (liquidityInfo) {
                            console.log('Add Liquidity Parsed Successfully:', liquidityInfo);
                            return;
                        }
                    }
                    
                    // Check for remove liquidity
                    if (LiquidityParser.isRaydiumRemoveLiquidity(transaction)) {
                        const liquidityInfo = LiquidityParser.parseRaydiumRemoveLiquidity(transaction);
                        if (liquidityInfo) {
                            console.log('Remove Liquidity Parsed Successfully:', liquidityInfo);
                            return;
                        }
                    }
                }
            }

            if (TransactionDetector.isTransfer(transaction)) {
                //console.log('Transfer Detected');
                const transferInfo = TransferParser.parseTransfer(transaction)
                if (transferInfo) {
                    //console.log("Transfer parsed successfully:", transferInfo)
                }
            }
        
            if (TransactionDetector.isTokenCreation(transaction)) {
                //console.log('Token Creation Detected');
                // Add parser.parseTokenCreation(transaction) here
            }
        
            if (TransactionDetector.isContractCreation(transaction)) {
                //console.log('Contract Creation Detected');
                // Add parser.parseContractCreation(transaction) here
            }

    
        } catch (error) {
            console.error('Error processing transaction:', error);
            console.error('Transaction signature:', transaction.transaction.signatures[0]);
        }
    }
}