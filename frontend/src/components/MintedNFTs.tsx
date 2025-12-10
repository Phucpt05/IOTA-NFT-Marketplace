import { useCurrentAccount, useIotaClientQuery, useSignAndExecuteTransaction } from "@iota/dapp-kit";
import { Flex, Heading, Text, Card, Grid, Button, Badge, TextField } from "@radix-ui/themes";
import { getNFTType, createListNftTransaction } from "../contractHelper";
import { useState } from "react";
import { MARKETPLACE_ID } from "../../constant";

interface NFTData {
  objectId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isListed?: boolean;
  price?: number;
}

export function MintedNFTs() {
  const account = useCurrentAccount();
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [listingPrices, setListingPrices] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const nftType = getNFTType();
  
  const { data, isPending, error } = useIotaClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      options: {
        showType: true,
        showContent: true,
        showDisplay: true,
      },
      filter: {
        StructType: nftType,
      },
    },
    {
      enabled: !!account,
    },
  );

  if (!account) {
    return (
      <Card size="3">
        <Flex direction="column" align="center" gap="4">
          <Heading size="4" color="gray">Wallet Not Connected</Heading>
          <Text color="gray" align="center">
            Please connect your wallet to view your minted NFTs
          </Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return <Flex>Error: {error.message}</Flex>;
  }

  if (isPending) {
    return <Flex>Loading your NFTs...</Flex>;
  }

  // Parse NFT data from the response
  const nfts: NFTData[] = data?.data.map((obj) => {
    const content = obj.data?.content as any;
    console.log("NFT Object Data:", obj);
    return {
      objectId: obj.data?.objectId || "",
      name: content?.fields?.name || "Unnamed NFT",
      description: content?.fields?.description || "No description",
      imageUrl: content?.fields?.url || "",
      isListed: false, 
      price: undefined,
    };
  }) || [];
  return (
    <Flex direction="column" gap="4">
      <Heading size="4">Your Minted NFTs</Heading>
      
      {nfts.length === 0 ? (
        <Card size="3">
          <Flex direction="column" align="center" gap="4">
            <Heading size="4" color="gray">No NFTs Found</Heading>
            <Text color="gray" align="center">
              You haven't minted any NFTs yet. Go to the Mint page to create your first NFT!
            </Text>
            <Button onClick={() => window.location.href = "/mint"}>
              Mint Your First NFT
            </Button>
          </Flex>
        </Card>
      ) : (
        <Grid columns="3" gap="4">
          {nfts.map((nft) => (
            <Card key={nft.objectId} size="3">
              <Flex direction="column" gap="3">
                <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: "var(--radius-3)" }}>
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
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
                      No Image
                    </div>
                  )}
                </div>
                
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Heading size="4" truncate>
                      {nft.name}
                    </Heading>
                    {nft.isListed && (
                      <Badge color="green">Listed</Badge>
                    )}
                  </Flex>
                  
                  <Text color="gray" size="2" truncate>
                    {nft.description}
                  </Text>
                  
                  <Text color="gray" size="1">
                    ID: {nft.objectId.slice(0, 10)}...{nft.objectId.slice(-10)}
                  </Text>
                  
                  {nft.price && (
                    <Text weight="bold" color="blue">
                      Price: {nft.price} IOTA
                    </Text>
                  )}
                  
                  <Flex gap="2" mt="2">
                    <Button
                      size="2"
                      variant="outline"
                      onClick={() => setSelectedNFT(nft.objectId)}
                    >
                      Details
                    </Button>
                    
                    {!nft.isListed && (
                      <Flex gap="2" align="center">
                        <TextField.Root
                          size="2"
                          placeholder="Price (IOTA)"
                          value={listingPrices[nft.objectId] || ""}
                          onChange={(e) => setListingPrices(prev => ({
                            ...prev,
                            [nft.objectId]: e.target.value
                          }))}
                          style={{ width: "120px" }}
                        />
                        <Button
                          size="2"
                          disabled={!listingPrices[nft.objectId] || isLoading[nft.objectId]}
                          onClick={() => handleListNFT(nft.objectId, nft.name||"")}
                        >
                          {isLoading[nft.objectId] ? "Listing..." : "List for sale"}
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      )}
      
      {selectedNFT && (
        <Card size="3">
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="4">NFT Details</Heading>
              <Button
                size="1"
                variant="ghost"
                onClick={() => setSelectedNFT(null)}
              >
                Close
              </Button>
            </Flex>
            <Text>
              Object ID: {selectedNFT}
            </Text>
            <Text color="gray">
              This is where detailed NFT information would be displayed, including transaction history, ownership records, and more.
            </Text>
          </Flex>
        </Card>
      )}
    </Flex>
  );

  async function handleListNFT(nftId: string, nftName: string) {
    const price = listingPrices[nftId];
    
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    setIsLoading(prev => ({ ...prev, [nftId]: true }));
    
    try {
      const tx = createListNftTransaction(
        MARKETPLACE_ID,
        nftId,
        parseFloat(price) * 1000000 // Convert IOTA to smallest unit (assuming 6 decimals)
      );
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      if (result.digest) {
        alert(`NFT "${nftName}" listed successfully for ${price} IOTA!`);
        console.log("Transaction Result:", result.digest);
        // Clear the price input
        setListingPrices(prev => ({ ...prev, [nftId]: "" }));
        // Refresh the page to show updated NFT status
        window.location.reload();
      } else {
        alert("Failed to list NFT");
      }
    } catch (error) {
      console.error("Error listing NFT:", error);
      alert("Error listing NFT");
    } finally {
      setIsLoading(prev => ({ ...prev, [nftId]: false }));
    }
  }
}