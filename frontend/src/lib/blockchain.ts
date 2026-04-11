"use client";

/**
 * Frontend utilities for Avalanche Fuji testnet blockchain integration
 */

export const FUJI_TESTNET_CONFIG = {
  name: "Avalanche Fuji Testnet",
  chainId: 43113,
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
  explorer: "https://testnet.snowtrace.io",
  faucetUrl: "https://faucet.avax-test.network",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
};

/**
 * Get Snowtrace explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  return `${FUJI_TESTNET_CONFIG.explorer}/tx/${txHash}`;
}

/**
 * Get Snowtrace explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return `${FUJI_TESTNET_CONFIG.explorer}/address/${address}`;
}

/**
 * Check if transaction is confirmed
 */
export async function checkTxStatus(txHash: string): Promise<"confirmed" | "pending" | "failed"> {
  try {
    const response = await fetch(`/api/blockchain/tx/${txHash}`);
    if (!response.ok) return "pending";
    
    const data = await response.json();
    return data.transaction?.status || "pending";
  } catch (error) {
    console.error("Error checking tx status:", error);
    return "pending";
  }
}

/**
 * Get account balance on Fuji testnet
 */
export async function getAccountBalance(address: string): Promise<{
  balance: string;
  balanceWei: string;
} | null> {
  try {
    const response = await fetch(`/api/blockchain/balance/${address}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      balance: data.balance,
      balanceWei: data.balanceWei,
    };
  } catch (error) {
    console.error("Error fetching balance:", error);
    return null;
  }
}

/**
 * Get current gas price on Fuji testnet
 */
export async function getGasPrice(): Promise<string | null> {
  try {
    const response = await fetch(`/api/blockchain/gas-price`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.gasPrice;
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return null;
  }
}

/**
 * Get faucet URL for requesting test AVAX
 */
export function getFaucetUrl(address: string): string {
  return `${FUJI_TESTNET_CONFIG.faucetUrl}/?pasting_email=&token_type=&chain=C-chain&address=${address}`;
}

/**
 * Confirm a trade with blockchain verification
 */
export async function confirmTradeWithBlockchain(
  tradeId: string,
  txHash: string
): Promise<{
  success: boolean;
  explorerUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/blockchain/confirm-trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId, txHash }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to confirm trade",
      };
    }

    const data = await response.json();
    return {
      success: true,
      explorerUrl: data.explorerUrl,
    };
  } catch (error) {
    console.error("Error confirming trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Open explorer in new tab
 */
export function openExplorer(url: string): void {
  window.open(url, "_blank");
}

export const BlockchainUtils = {
  getTxExplorerUrl,
  getAddressExplorerUrl,
  checkTxStatus,
  getAccountBalance,
  getGasPrice,
  getFaucetUrl,
  confirmTradeWithBlockchain,
  formatAddress,
  openExplorer,
};
