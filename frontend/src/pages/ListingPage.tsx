import { Container, Heading, Text } from "@radix-ui/themes";
import { MintedNFTs } from "../components/MintedNFTs";

export function ListingPage() {
  return (
    <Container size="4" px="4" py="6">
      <Heading size="8" mb="6" align="center">
        My NFT Collection
      </Heading>
      
      <Text size="5" color="gray" mb="6" align="center" as="div">
        Manage and showcase your minted NFTs
      </Text>
      
      <MintedNFTs />
    </Container>
  );
}