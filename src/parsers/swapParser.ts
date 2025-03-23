import { ParsedTransactionWithMeta } from '@solana/web3.js';

// Define the swap info interface
export interface SwapInfo {
  dex: string;
  signature: string;
  traderAccount: string;
  tokenIn: string;
  amountIn: string;
  tokenOut: string;
  amountOut: string;
  timestamp?: number;
}

export class SwapParser {
  /**
   * Parse a Raydium swap transaction
   */
  static parseRaydiumSwap(transaction: ParsedTransactionWithMeta): SwapInfo | null {
    try {
      console.log("Parsing Raydium swap");
      
      // Get transaction information
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a swap");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      const transfers: Array<{source: string; destination: string; amount: string}> = [];
      
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount
              });
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for a swap");
        return null;
      }
      
      const firstTransfer = transfers[0];
      const lastTransfer = transfers[transfers.length - 1];
      
      return {
        dex: "Raydium",
        signature,
        traderAccount,
        tokenIn: firstTransfer.destination,
        amountIn: firstTransfer.amount,
        tokenOut: lastTransfer.source,
        amountOut: lastTransfer.amount,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Raydium swap:", error);
      return null;
    }
  }

  /**
   * Parse a Jupiter swap transaction
   */
  static parseJupiterSwap(transaction: ParsedTransactionWithMeta): SwapInfo | null {
    try {
      console.log("Parsing Jupiter swap");
      
      // Get transaction information
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a swap");
        return null;
      }
      
      // Get the trader account (first account is usually the signer)
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      // Find token transfers in the inner instructions
      const transfers: Array<{source: string; destination: string; amount: string}> = [];
      
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount
              });
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for a swap");
        return null;
      }

      const firstTransfer = transfers[0];
      const lastTransfer = transfers[transfers.length - 1];
      
      return {
        dex: "Jupiter",
        signature,
        traderAccount,
        tokenIn: firstTransfer.destination,
        amountIn: firstTransfer.amount,
        tokenOut: lastTransfer.source,
        amountOut: lastTransfer.amount,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Jupiter swap:", error);
      return null;
    }
  }
  
  /**
   * Parse a PumpFun swap transaction
   */
  static parsePumpFunSwap(transaction: ParsedTransactionWithMeta): SwapInfo | null {
    try {
      console.log("Parsing PumpFun swap");
      
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a swap");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      const transfers: Array<{source: string; destination: string; amount: string}> = [];
      
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount
              });
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for a swap");
        return null;
      }
      
      const firstTransfer = transfers[0];
      const lastTransfer = transfers[transfers.length - 1];
      
      return {
        dex: "PumpFun",
        signature,
        traderAccount,
        tokenIn: firstTransfer.destination,
        amountIn: firstTransfer.amount,
        tokenOut: lastTransfer.source,
        amountOut: lastTransfer.amount,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }
  
  /**
   * Parse a Phoenix swap transaction
   */
  static parsePhoenixSwap(transaction: ParsedTransactionWithMeta): SwapInfo | null {
    try {
      console.log("Parsing Phoenix swap");
      
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a swap");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      const transfers: Array<{source: string; destination: string; amount: string}> = [];
      
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount
              });
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for a swap");
        return null;
      }
      
      const firstTransfer = transfers[0];
      const lastTransfer = transfers[transfers.length - 1];
      
      return {
        dex: "Phoenix",
        signature,
        traderAccount,
        tokenIn: firstTransfer.destination,
        amountIn: firstTransfer.amount,
        tokenOut: lastTransfer.source,
        amountOut: lastTransfer.amount,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Phoenix swap:", error);
      return null;
    }
  }
  
  /**
   * Parse a Raydium CAMM transaction
   */
  static parseRaydiumCAMMSwap(transaction: ParsedTransactionWithMeta): SwapInfo | null {
    try {
      console.log("Parsing Raydium CAMM transaction");
      
      // Get transaction information
      const signature = transaction.transaction.signatures[0];
      const message = transaction.transaction.message;
      const meta = transaction.meta;
      
      if (!meta || !meta.innerInstructions || meta.innerInstructions.length === 0) {
        console.log("No inner instructions found, not a swap");
        return null;
      }
      
      const traderAccount = message.accountKeys[0].pubkey.toString();
      
      const transfers: Array<{source: string; destination: string; amount: string}> = [];
      
      meta.innerInstructions.forEach(innerInstructionSet => {
        innerInstructionSet.instructions.forEach((ix: any) => {
          if (ix.programId && ix.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            if (ix.parsed && (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount
              });
            }
          }
        });
      });
      
      if (transfers.length < 2) {
        console.log("Not enough transfers for a swap");
        return null;
      }
      
      const firstTransfer = transfers[0];
      const lastTransfer = transfers[transfers.length - 1];
      
      return {
        dex: "Raydium_CAMM",
        signature,
        traderAccount,
        tokenIn: firstTransfer.destination,
        amountIn: firstTransfer.amount,
        tokenOut: lastTransfer.source,
        amountOut: lastTransfer.amount,
        timestamp: transaction.blockTime || undefined
      };
    } catch (error) {
      console.error("Error parsing Raydium CAMM swap:", error);
      return null;
    }
  }
}