import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { DexType } from '../blockchain/detector';

// Liquidity operation information
export interface LiquidityInfo {
  signature: string;
  dex: DexType;
  operation: 'add' | 'remove';
  traderAccount: string;
  tokenA: {
    mint: string;
    amount: string;
  };
  tokenB: {
    mint: string;
    amount: string;
  };
  lpToken?: {
    mint: string;
    amount: string;
  };
  poolAddress?: string;
  timestamp?: number;
}

export class LiquidityParser {
  /**
   * Check if a transaction is adding liquidity to Raydium
   */
  static isRaydiumAddLiquidity(transaction: ParsedTransactionWithMeta): boolean {
    try {
      const instructions = transaction.transaction.message.instructions;
      
      for (const ix of instructions) {
        if (!('data' in ix)) continue;
        
        let dataStr = '';
        if (typeof ix.data === 'string') {
          const buffer = Buffer.from(ix.data, 'base64');
          if (buffer.length > 0) {

            if (buffer[0] === 3) { // TODO: check Raydium add liquidity code
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking Raydium add liquidity:", error);
      return false;
    }
  }
  

  static isRaydiumRemoveLiquidity(transaction: ParsedTransactionWithMeta): boolean {
    try {
      const instructions = transaction.transaction.message.instructions;
      
      for (const ix of instructions) {
        if (!('data' in ix)) continue;
        
        let dataStr = '';
        if (typeof ix.data === 'string') {
          const buffer = Buffer.from(ix.data, 'base64');
          if (buffer.length > 0) {

            if (buffer[0] === 4) { // TODO: check Raydium remove liquidity code
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking Raydium remove liquidity:", error);
      return false;
    }
  }
  
  /**
   * Parse a Raydium add liquidity transaction
   */
  static parseRaydiumAddLiquidity(transaction: ParsedTransactionWithMeta): LiquidityInfo | null {
    try {
      console.log("Parsing Raydium add liquidity");
      
      // Get transaction information
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a valid liquidity operation");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      // Look for token transfers in inner instructions to identify the tokens involved
      const transfers: Array<{source: string; destination: string; amount: string; mint?: string}> = [];
      
      // Extract all token transfers
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              const transfer = {
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount,
                mint: ix.parsed.info.mint // might be undefined for regular transfers
              };
              transfers.push(transfer);
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for add liquidity");
        return null;
      }
      
      // Look for token mints in pre/post token balances
      const tokenMints = new Set<string>();
      let lpTokenMint: string | undefined;
      let poolAddress: string | undefined;
      
      // Get token mints from post token balances
      if (meta.postTokenBalances) {
        meta.postTokenBalances.forEach(balance => {
          tokenMints.add(balance.mint);
        });
      }

      
      // Find the tokens with largest negative transfers (tokens sent to pool)
      const sortedTransfers = [...transfers].sort((a, b) => {
        const amountA = BigInt(a.amount);
        const amountB = BigInt(b.amount);
        // Sort in descending order of absolute value
        return Number(amountB < 0n ? -amountB : amountB) - Number(amountA < 0n ? -amountA : amountA);
      });
      
      const tokenATransfer = sortedTransfers[0];
      const tokenBTransfer = sortedTransfers[1];
      
      const lpTokenTransfer = transfers.find(t => 
        BigInt(t.amount) > 0n && t.mint !== tokenATransfer.mint && t.mint !== tokenBTransfer.mint
      );
      
      return {
        signature,
        dex: 'Raydium',
        operation: 'add',
        traderAccount,
        tokenA: {
          mint: tokenATransfer.mint || '', // Fallback if mint is undefined
          amount: tokenATransfer.amount
        },
        tokenB: {
          mint: tokenBTransfer.mint || '', // Fallback if mint is undefined
          amount: tokenBTransfer.amount
        },
        lpToken: lpTokenTransfer ? {
          mint: lpTokenTransfer.mint || '',
          amount: lpTokenTransfer.amount
        } : undefined,
        poolAddress,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Raydium add liquidity:", error);
      return null;
    }
  }
  
  /**
   * Parse a Raydium remove liquidity transaction
   */
  static parseRaydiumRemoveLiquidity(transaction: ParsedTransactionWithMeta): LiquidityInfo | null {
    try {
      console.log("Parsing Raydium remove liquidity");
      
      // Get transaction information
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a valid liquidity operation");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      // Look for token transfers in inner instructions to identify the tokens involved
      const transfers: Array<{source: string; destination: string; amount: string; mint?: string}> = [];
      
      // Extract all token transfers
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              const transfer = {
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount,
                mint: ix.parsed.info.mint // might be undefined for regular transfers
              };
              transfers.push(transfer);
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for remove liquidity");
        return null;
      }
      
      // Find the LP token transfer (usually the largest negative transfer)
      const lpTokenTransfer = transfers.find(t => BigInt(t.amount) < 0n);
      
      if (!lpTokenTransfer) {
        console.log("No LP token transfer found");
        return null;
      }
      
      // Find token mints in post token balances
      const tokenMints = new Set<string>();
      if (meta.postTokenBalances) {
        meta.postTokenBalances.forEach(balance => {
          tokenMints.add(balance.mint);
        });
      }
      
      // Find the tokens with largest positive transfers (tokens received from pool)
      const positiveTransfers = transfers.filter(t => BigInt(t.amount) > 0n);
      const sortedTransfers = [...positiveTransfers].sort((a, b) => {
        const amountA = BigInt(a.amount);
        const amountB = BigInt(b.amount);
        // Sort in descending order
        return Number(amountB) - Number(amountA);
      });
      
      if (sortedTransfers.length < 2) {
        console.log("Not enough token transfers for remove liquidity");
        return null;
      }
      
      // The first two largest positive transfers are likely the tokens being received from the pool
      const tokenATransfer = sortedTransfers[0];
      const tokenBTransfer = sortedTransfers[1];
      
      // Create the liquidity info
      return {
        signature,
        dex: 'Raydium',
        operation: 'remove',
        traderAccount,
        tokenA: {
          mint: tokenATransfer.mint || '', // Fallback if mint is undefined
          amount: tokenATransfer.amount
        },
        tokenB: {
          mint: tokenBTransfer.mint || '', // Fallback if mint is undefined
          amount: tokenBTransfer.amount
        },
        lpToken: {
          mint: lpTokenTransfer.mint || '',
          amount: lpTokenTransfer.amount
        },
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Raydium remove liquidity:", error);
      return null;
    }
  }
}