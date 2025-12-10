
import { useState } from "react";
import { Button, Card, Container, Flex, Heading, TextField, Text } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@iota/dapp-kit";
import { createMintNftTransaction } from "../contractHelper";

export function MintNFT() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const handleMint = async () => {
    if (!name || !description || !imageUrl) {
      alert("Please fill in all fields");
      return;
    }

    if (!currentAccount) {
      alert("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      const tx = createMintNftTransaction(name, description, imageUrl);
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      if (result.digest) {
        alert("NFT minted successfully!");
        console.log("Transaction Result:", result.digest);
        // Reset form
        setName("");
        setDescription("");
        setImageUrl("");
      } else {
        alert("Failed to mint NFT");
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      // Provide more detailed error message
      const errorMessage = error.message || JSON.stringify(error);
      alert(`Error minting NFT: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="4" px="4" py="6">
      <Card size="3">
        <Heading size="6" mb="4">Mint New NFT</Heading>
        
        <Flex direction="column" gap="3">
          <Text as="label" weight="bold">
            Name
          </Text>
          <TextField.Root
            placeholder="Enter NFT name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <Text as="label" weight="bold">
            Description
          </Text>
          <TextField.Root
            placeholder="Enter NFT description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          <Text as="label" weight="bold">
            Image URL
          </Text>
          <TextField.Root
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          
          <Button
            onClick={handleMint}
            disabled={isLoading || !currentAccount}
            size="3"
          >
            {isLoading ? "Minting..." : "Mint NFT"}
          </Button>
        </Flex>
      </Card>
    </Container>
  );
}