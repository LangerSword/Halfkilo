import { publicClient, createWalletClientForSigning } from "@/config/blockchain.js";
import { formatEther, parseEther, getAddress, isAddress } from "viem";

interface TransactionResult {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  timestamp?: number;
  explorerUrl?: string;
}

/**
 * Wait for transaction confirmation on Fuji testnet
 */
export async function waitForTransactionConfirmation(txHash: string, maxAttempts = 60): Promise<TransactionResult> {
  const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
  
  try {
    console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);
    
    // Get transaction receipt with polling
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60000, // 60 second timeout
    });

    if (receipt.status === "success") {
      console.log(`✓ Transaction confirmed: ${txHash}`);
      return {
        hash: txHash,
        status: "confirmed",
        blockNumber: receipt.blockNumber,
        timestamp: receipt.transactionIndex,
        explorerUrl,
      };
    } else {
      console.error(`✗ Transaction failed: ${txHash}`);
      return {
        hash: txHash,
        status: "failed",
        explorerUrl,
      };
    }
  } catch (error) {
    console.error(`⚠ Error waiting for confirmation:`, error);
    return {
      hash: txHash,
      status: "pending",
      explorerUrl,
    };
  }
}

/**
 * Get transaction details from Fuji testnet
 */
export async function getTransactionDetails(txHash: string) {
  try {
    const tx = await publicClient.getTransaction({ hash: txHash });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    return {
      hash: txHash,
      from: tx.from,
      to: tx.to,
      value: formatEther(tx.value),
      gasPrice: tx.gasPrice ? formatEther(tx.gasPrice) : "0",
      gasUsed: receipt?.gasUsed ? receipt.gasUsed.toString() : "0",
      status: receipt?.status || "unknown",
      blockNumber: receipt?.blockNumber,
      confirmations: receipt ? "confirmed" : "pending",
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
    };
  } catch (error) {
    console.error(`Error fetching transaction details:`, error);
    return null;
  }
}

/**
 * Validate Fuji testnet address
 */
export function validateAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!validateAddress(address)) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert AVAX to wei
 */
export function avaxToWei(avax: number): bigint {
  return parseEther(avax.toString());
}

/**
 * Convert wei to AVAX
 */
export function weiToAvax(wei: bigint | string): number {
  return parseFloat(formatEther(BigInt(wei)));
}

/**
 * Get current gas price on Fuji testnet
 */
export async function getGasPrice() {
  try {
    const gasPrice = await publicClient.getGasPrice();
    return {
      gasPrice: formatEther(gasPrice),
      gasPriceWei: gasPrice.toString(),
    };
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return null;
  }
}

/**
 * Get account balance on Fuji testnet
 */
export async function getBalance(address: string) {
  try {
    if (!validateAddress(address)) {
      throw new Error("Invalid address");
    }
    const balance = await publicClient.getBalance({ account: getAddress(address) });
    return {
      balance: formatEther(balance),
      balanceWei: balance.toString(),
    };
  } catch (error) {
    console.error("Error fetching balance:", error);
    return null;
  }
}

/**
 * Send test AVAX request to faucet (returns faucet URL for manual request)
 */
export function getFaucetUrl(address: string): string {
  if (!validateAddress(address)) {
    throw new Error("Invalid address");
  }
  return `https://faucet.avax-test.network/?pasting_email=&token_type=&chain=C-chain&address=${address}`;
}

export const BlockchainUtils = {
  waitForTransactionConfirmation,
  getTransactionDetails,
  validateAddress,
  formatAddress,
  avaxToWei,
  weiToAvax,
  getGasPrice,
  getBalance,
  getFaucetUrl,
};
