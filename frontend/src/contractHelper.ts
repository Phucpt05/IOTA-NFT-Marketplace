import { PACKAGE_ID, NFT_MARKETPLACE_MODULE, MARKETPLACE_TYPE, NFT_TYPE } from "../constant";
import { Transaction } from "@iota/iota-sdk/transactions";

// Get the type string for NFT
export function getNFTType(): string {
  return `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::${NFT_TYPE}`;
}

// Get the type string for Marketplace
export function getMarketplaceType(): string {
  return `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::${MARKETPLACE_TYPE}`;
}

// Create a transaction to mint an NFT
export function createMintNftTransaction(
  name: string,
  description: string,
  imageUrl: string
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::mint_nft`,
    arguments: [
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(imageUrl)
    ]
  });
  
  return tx;
}

// Create a transaction to list an NFT for sale
export function createListNftTransaction(
  marketplaceId: string,
  nftId: string,
  price: number
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::list_nft`,
    arguments: [
      tx.object(marketplaceId),
      tx.object(nftId),
      tx.pure.u64(price)
    ]
  });
  
  return tx;
}

// Create a transaction to buy an NFT
export function createBuyNftTransaction(
  marketplaceId: string,
  nftId: string,
  price: number
): Transaction {
  const tx = new Transaction();
  
  const coin = tx.splitCoins(tx.gas, [tx.pure.u64(price)]);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::buy_nft`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(nftId),
      coin
    ]
  });
  
  return tx;
}

// Create a transaction to cancel a listing
export function createCancelListingTransaction(
  marketplaceId: string,
  nftId: string
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::cancel_listing`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(nftId)
    ]
  });
  
  return tx;
}

// Create a transaction to update the price of a listed NFT
export function createUpdatePriceTransaction(
  marketplaceId: string,
  nftId: string,
  newPrice: number
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::update_price`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(nftId),
      tx.pure.u64(newPrice)
    ]
  });
  
  return tx;
}

// Initialize the marketplace
export function createInitMarketplaceTransaction(): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::${NFT_MARKETPLACE_MODULE}::init`,
    arguments: []
  });
  
  return tx;
}