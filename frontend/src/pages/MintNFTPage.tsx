import { Container, Heading, Text } from "@radix-ui/themes";
import { MintNFT } from "../components/MintNFT";

export function MintNFTPage() {
  return (
    <Container size="4" px="4" py="6">
      <Heading size="8" mb="6" align="center">
        Mint New NFT
      </Heading>
      
      <Text size="5" color="gray" mb="6" align="center" as="div">
        Create your unique digital asset on the IOTA blockchain
      </Text>
      
      <MintNFT />
    </Container>
  );
}