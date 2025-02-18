import { Connection, PublicKey } from "@solana/web3.js";

export class TransactionFetcher {
    constructor(private connection: Connection) {}

    async getTransactionsInSlot(slot: number, programIds: string[]) {
        try {
            console.log(`Fetching transactions for slot: ${slot}`);
            const programs = programIds.map(id => new PublicKey(id))

            const block = await this.connection.getBlock(slot, {
                maxSupportedTransactionVersion: 0,
                rewards: false
            })

            if (!block) {
                console.log(`No block data found for slot ${slot}`);
                return [];
            }

            console.log(`Found ${block.transactions.length} transactions in slot`);

            const relevantTransactions = block.transactions.filter(tx => {
                const accountKeys = tx.transaction.message.getAccountKeys()

                return programIds.some(programId => {
                    const programPubKey = new PublicKey(programId)
                    return accountKeys.keySegments().flat().some(key => key.equals(programPubKey))
                })
            })
            console.log(`Found ${relevantTransactions.length} relevant transactions`);
            return relevantTransactions;
        } catch(error) {
            console.error('Error fetching transactions:', error)
            return []
        }
    }
}