import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DEX_PROGRAM_IDS, CONTRACT_CREATION_PROGRAM_IDS, SPL_TOKEN_PROGRAM_ID, SPL_TOKEN_INITIALIZE_MINT } from '../constants';

export type DexType = keyof typeof DEX_PROGRAM_IDS;

export class TransactionDetector {
    static isDex(transaction: ParsedTransactionWithMeta): { dex: DexType, programId: string } | null {
        const instructions = transaction.transaction.message.instructions

        for (const instruction of instructions) {
            const entry = Object.entries(DEX_PROGRAM_IDS).find(([_, programId]) =>
                programId === instruction.programId.toString()
            )

            if (entry) {
                return {
                    dex: entry[0] as DexType,
                    programId: entry[1]
                }
            }
        }
        return null
    }

    static isTokenCreation(transaction: ParsedTransactionWithMeta): boolean {
        const innerInstructions = transaction.meta?.innerInstructions || []

        return innerInstructions.some(inner =>
            inner.instructions.some(instruction =>
                instruction.programId.toString() === SPL_TOKEN_PROGRAM_ID &&
                'parsed' in instruction && SPL_TOKEN_INITIALIZE_MINT.includes(instruction.parsed.type)
            )
        )
    }

    static isContractCreation(transaction: ParsedTransactionWithMeta): boolean {
        return transaction.transaction.message.instructions.some(instruction =>
            CONTRACT_CREATION_PROGRAM_IDS.includes(instruction.programId.toString())
        )
    }

    static isTransfer(transaction: ParsedTransactionWithMeta): boolean {
        return transaction.transaction.message.instructions.some(instruction => {
            'parsed' in instruction && 
            instruction.parsed?.type === 'trasnfer'
        })
    }

    static getDex(transaction: ParsedTransactionWithMeta): DexType | null {
        const result = this.isDex(transaction)
        return result ? result.dex : null
    }
}