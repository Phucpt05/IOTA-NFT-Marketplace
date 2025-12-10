import { Container, Heading, Text, Grid, Card, Flex } from "@radix-ui/themes";
import { ListedNFTs } from "../components/ListedNFTs";

export function NFTMarketplace() {
  return (
    <Container size="4" px="4" py="6">
      <Heading size="8" mb="6" align="center">
        NFT Marketplace
      </Heading>
      
      <Text size="5" color="gray" mb="6" align="center" as="div">
        Discover, collect, and sell extraordinary NFTs
      </Text>

      <Heading size="6" mb="4">NFTs Available for Purchase</Heading>
      <ListedNFTs />
    </Container>
  );
}