import { ParsedTransactionWithMeta, ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';

export interface TransferInfo {
  signature: string;
  source: string;
  destination: string;
  amount: string;
  tokenMint?: string;
  isNativeTransfer: boolean;
  timestamp?: number;
}

export class TransferParser {
  /**
   * Parse a transfer transaction (SOL or SPL Token)
   */
  static parseTransfer(transaction: ParsedTransactionWithMeta): TransferInfo | null {
    try {
      if (!transaction.transaction.message.instructions || 
          transaction.transaction.message.instructions.length === 0) {
        return null;
      }
      
      // Check for SOL transfers (system program)
      const solTransfer = this.parseSolTransfer(transaction);
      if (solTransfer) {
        return solTransfer;
      }
      
      // Check for SPL token transfers
      const tokenTransfer = this.parseSplTokenTransfer(transaction);
      if (tokenTransfer) {
        return tokenTransfer;
      }
      
      return null;
    } catch (error) {
      console.error("Error parsing transfer:", error);
      return null;
    }
  }
  
  /**
   * Parse a native SOL transfer
   */
  private static parseSolTransfer(transaction: ParsedTransactionWithMeta): TransferInfo | null {
    try {
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const instructions = message.instructions;
      
      // Find a system program transfer instruction
      const transferIx = instructions.find((ix) => {
        if ('program' in ix && ix.program === 'system' && 'parsed' in ix) {
          return ix.parsed?.type === 'transfer';
        }
        return false;
      }) as ParsedInstruction | undefined;
      
      if (!transferIx || !('parsed' in transferIx) || !transferIx.parsed || !transferIx.parsed.info) {
        return null;
      }
      
      const info = transferIx.parsed.info;
      
      return {
        signature,
        source: info.source,
        destination: info.destination,
        amount: info.lamports,
        isNativeTransfer: true,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing SOL transfer:", error);
      return null;
    }
  }
  
  /**
   * Parse an SPL token transfer
   */
  private static parseSplTokenTransfer(transaction: ParsedTransactionWithMeta): TransferInfo | null {
    try {
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const instructions = message.instructions;
      
      // Find a token program transfer instruction
      const transferIx = instructions.find((ix) => {
        // Check if it's a parsed instruction for SPL token
        if ('program' in ix && ix.program === 'spl-token' && 'parsed' in ix) {
          return ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked';
        }
        return false;
      }) as ParsedInstruction | undefined;
      
      if (!transferIx || !('parsed' in transferIx) || !transferIx.parsed || !transferIx.parsed.info) {
        return null;
      }
      
      const info = transferIx.parsed.info;
      let tokenMint = undefined;
      
      // If it's a transferChecked instruction, we can get the mint directly
      if (transferIx.parsed.type === 'transferChecked') {
        tokenMint = info.mint;
      } 
      else if (transaction.meta && transaction.meta.postTokenBalances) {
        const destinationIndex = message.accountKeys.findIndex(
          key => key.pubkey.toString() === info.destination
        );
        
        if (destinationIndex >= 0) {
          const tokenBalance = transaction.meta.postTokenBalances.find(
            balance => balance.accountIndex === destinationIndex
          );
          
          if (tokenBalance) {
            tokenMint = tokenBalance.mint;
          }
        }
      }
      
      return {
        signature,
        source: info.source || info.authority,
        destination: info.destination,
        amount: info.amount,
        tokenMint,
        isNativeTransfer: false,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing SPL token transfer:", error);
      return null;
    }
  }
}