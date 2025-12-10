import { useIotaClientQuery, useSignAndExecuteTransaction, useCurrentAccount, useIotaClient } from "@iota/dapp-kit";
import { Flex, Heading, Text, Card, Grid, Button, Badge } from "@radix-ui/themes";
import { createBuyNftTransaction, getNFTType } from "../contractHelper";
import { useState, useEffect } from "react";
import { MARKETPLACE_ID, PACKAGE_ID } from "../../constant";

interface ListedNFTData {
  nftId: string;
  name: string;
  description: string;
  url: string;
  creator: string;
  price: number;
  seller: string;
}

export function ListedNFTs() {
  const account = useCurrentAccount();
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [nftDetails, setNftDetails] = useState<{ [key: string]: any }>({});
  const [listedNFTs, setListedNFTs] = useState<ListedNFTData[]>([]);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const client = useIotaClient();

  // Get the marketplace object
  const { data: marketplaceData, isPending: marketplacePending, error: marketplaceError } = useIotaClientQuery(
    "getObject",
    {
      id: MARKETPLACE_ID,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!MARKETPLACE_ID,
    }
  );

  // Extract marketplace fields
  const marketplaceFields = marketplaceData?.data?.content as any;

  // Get the listings table dynamic fields
  const { data: listingsData, isPending: listingsPending, error: listingsError, refetch: refetchListings } = useIotaClientQuery(
    "getDynamicFields",
    {
      parentId: marketplaceFields?.fields?.listings?.fields?.id?.id,
    },
    {
      enabled: !!marketplaceFields?.fields?.listings?.fields?.id?.id,
    }
  );
  
  // Get NFT objects from marketplace dynamic fields
  const { data: nftObjectsData, isPending: nftObjectsPending, refetch: refetchNFTObjects } = useIotaClientQuery(
    "getDynamicFields",
    {
      parentId: MARKETPLACE_ID,
    },
    {
      enabled: !!MARKETPLACE_ID,
    }
  );

  // Function to refresh marketplace data after transactions
  const refreshMarketplaceData = async () => {
    try {
      await Promise.all([
        refetchListings(),
        refetchNFTObjects()
      ]);
    } catch (error) {
      console.error("Error refreshing marketplace data:", error);
    }
  };

  // Process the data when it changes
  useEffect(() => {
    if (!listingsData || !nftObjectsData || !client) return;

    const processListings = async () => {
      try {
        // Get listing IDs from the listings table
        const listingIds = listingsData.data?.map((field: any) => {
          const fieldName = field.name as any;
          return fieldName?.value;
        }).filter(Boolean) || [];

        if (listingIds.length === 0) {
          setListedNFTs([]);
          return;
        }

        // Create a map of NFT details
        const detailsMap: { [key: string]: any } = {};
        console.log("nft objects:", nftObjectsData.data);
        // Process NFT objects from dynamic fields
        for (const field of nftObjectsData.data) {
          const fieldName = field.name as any;
          if (fieldName?.type === "0x2::object::ID" && listingIds.includes(fieldName.value)) {
            const nftId = fieldName.value as string;
            
            // Get the actual NFT object
            try {
              const nftObject = await client.getObject({
                id: field.objectId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });
              
              if (nftObject.data) {
                detailsMap[nftId] = nftObject.data;
              }
              console.log(`Fetched NFT ${nftId}:`, nftObject.data);
            } catch (error) {
              console.error(`Error fetching NFT ${nftId}:`, error);
            }
          }
        }

        // Fetch listing details (price and seller) for each NFT
        const nfts: ListedNFTData[] = [];
        
        for (const field of listingsData.data) {
          const fieldName = field.name as any;
          const nftId = fieldName?.value;
          
          if (nftId) {
            try {
              // Get the listing object
              const listingObject = await client.getObject({
                id: field.objectId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });
              
              if (listingObject.data?.content && (listingObject.data.content as any).fields) {
                const listingFields = (listingObject.data.content as any).fields;
                
                // Get NFT details if available
                const nftDetail = detailsMap[nftId];
                let name = "NFT";
                let description = "Listed NFT";
                let url = "";
                let creator = "";
                
                if (nftDetail?.content && (nftDetail.content as any).fields) {
                  const nftFields = (nftDetail.content as any).fields;
                  name = nftFields.name || name;
                  description = nftFields.description || description;
                  url = nftFields.url || url;
                  creator = nftFields.creator || creator;
                }
                
                // Extract price with proper type handling
                let price = 9;
                let seller = "";
                
                // Try different ways to extract the price
                if (listingFields.price !== undefined) {
                  price = typeof listingFields.price === 'string'
                    ? parseFloat(listingFields.price)
                    : Number(listingFields.price) || 0;
                }
                
                // Try different ways to extract the seller
                if (listingFields.seller !== undefined) {
                  seller = typeof listingFields.seller === 'string'
                    ? listingFields.seller
                    : String(listingFields.seller || "");
                }
                nfts.push({
                  nftId: nftId,
                  name: name,
                  description: description,
                  url: url,
                  creator: creator,
                  price: price, // Convert from smallest unit to IOTA
                  seller: seller,
                });
              }
            } catch (error) {
              console.error(`Error fetching listing for NFT ${nftId}:`, error);
            }
          }
        }
        
        setNftDetails(detailsMap);
        setListedNFTs(nfts);
        console.log("Final NFTs array:", nfts);
      } catch (error) {
        console.error("Error processing marketplace listings:", error);
      }
    };
    console.log("nftListings: ", listingsData.data);
    processListings();
  }, [listingsData, nftObjectsData, client]);

  const isPending = marketplacePending || listingsPending || nftObjectsPending;
  const error = marketplaceError || listingsError;
  if (error) {
    console.error("Marketplace listings error:", error);
    return (
      <Card size="3">
        <Flex direction="column" align="center" gap="4">
          <Heading size="4" color="red">Error Loading Marketplace</Heading>
          <Text color="gray" align="center">
            Failed to load marketplace data. Please try again later.
          </Text>
        </Flex>
      </Card>
    );
  }

  if (isPending) {
    return <Flex>Loading listed NFTs...</Flex>;
  }

  return (
    <Flex direction="column" gap="4">
      <Heading size="4">Listed NFTs for Sale</Heading>
      
      {listedNFTs.length === 0 ? (
        <Card size="3">
          <Flex direction="column" align="center" gap="4">
            <Heading size="4" color="gray">No NFTs Listed</Heading>
            <Text color="gray" align="center">
              There are currently no NFTs listed for sale on the marketplace.
            </Text>
          </Flex>
        </Card>
      ) : (
        <Grid columns="3" gap="4">
          {listedNFTs.map((nft) => (
            <Card key={nft.nftId} size="3">
              <Flex direction="column" gap="3">
                <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: "var(--radius-3)" }}>
                  {nft.url ? (
                    <img
                      src={nft.url}
                      alt={nft.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=No+Image";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "var(--gray-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gray-8)",
                      }}
                    >
                      NFT Image
                    </div>
                  )}
                </div>
                
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Heading size="4" truncate>
                      {nft.name}
                    </Heading>
                    <Badge color="green">For Sale</Badge>
                  </Flex>
                  
                  <Text color="gray" size="2" truncate>
                    {nft.description}
                  </Text>
                  
                  <Text color="gray" size="1">
                    ID: {nft.nftId.slice(0, 10)}...{nft.nftId.slice(-10)}
                  </Text>
                  
                  {nft.creator && (
                    <Text color="gray" size="1">
                      Creator: {nft.creator.slice(0, 10)}...{nft.creator.slice(-10)}
                    </Text>
                  )}
                  
                  <Text color="gray" size="1">
                    Seller: {nft.seller.slice(0, 10)}...{nft.seller.slice(-10)}
                  </Text>
                  
                  <Text weight="bold" color="blue" size="4">
                    Price: {nft.price ? `${nft.price} IOTA` : 'Price not available'}
                  </Text>
                  
                  <Flex gap="2" mt="2">
                    <Button
                      size="2"
                      variant="outline"
                      onClick={() => window.open(`https://explorer.iota.org/testnet/object/${nft.nftId}`, '_blank')}
                    >
                      View on Explorer
                    </Button>
                    
                    {account && account.address !== nft.seller && (
                      <Button
                        size="2"
                        disabled={isLoading[nft.nftId]}
                        onClick={() => handleBuyNFT(nft.nftId, nft.price, nft.name)}
                      >
                        {isLoading[nft.nftId] ? "Buying..." : "Buy Now"}
                      </Button>
                    )}
                    
                    {account && account.address === nft.seller && (
                      <Badge color="orange">Your Listing</Badge>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      )}
    </Flex>
  );

  async function handleBuyNFT(nftId: string, price: number, nftName: string) {
    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    setIsLoading(prev => ({ ...prev, [nftId]: true }));
    
    try {
      // Check wallet balance before proceeding
      const balance = await client.getBalance({
        owner: account.address,
      });
      
      const totalCost = price * 1000000 + 10000000; // Price + gas budget
      
      if (Number(balance.totalBalance) < totalCost) {
        alert(`Insufficient balance. You need at least ${(totalCost / 1000000).toFixed(6)} IOTA (including gas fees).`);
        return;
      }
      
      const tx = createBuyNftTransaction(
        MARKETPLACE_ID,
        nftId,
        price * 1000000 // Convert IOTA to smallest unit (1 IOTA = 1,000,000 MIST)
      );
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      if (result.digest) {
        alert(`Successfully purchased "${nftName}" for ${price} IOTA!`);
        console.log("Transaction Result:", result.digest);
        
        // Immediately remove the purchased NFT from the UI
        setListedNFTs(prev => prev.filter(nft => nft.nftId !== nftId));
        
        // Then refresh marketplace data to ensure consistency
        setTimeout(async () => {
          // Refresh marketplace data to update the UI
          await refreshMarketplaceData();
        }, 2000);
      } else {
        alert("Failed to purchase NFT");
      }
    } catch (error: any) {
      console.error("Error purchasing NFT:", error);
      // Provide more detailed error message
      const errorMessage = error.message || JSON.stringify(error);
      alert(`Error purchasing NFT: ${errorMessage}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [nftId]: false }));
    }
  }
}