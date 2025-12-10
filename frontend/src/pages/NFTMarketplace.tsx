import { Container, Heading, Text, Grid, Card, Flex } from "@radix-ui/themes";

export function NFTMarketplace() {
  return (
    <Container size="4" px="4" py="6">
      <Heading size="8" mb="6" align="center">
        NFT Marketplace
      </Heading>
      
      <Text size="5" color="gray" mb="6" align="center" as="div">
        Discover, collect, and sell extraordinary NFTs
      </Text>

      <Grid columns="3" gap="4" mb="8">
        <Card size="3">
          <Flex direction="column" gap="3" align="center">
            <Heading size="5" align="center">Featured NFTs</Heading>
            <Text align="center" color="gray">
              Explore the most sought after digital assets
            </Text>
          </Flex>
        </Card>
        
        <Card size="3">
          <Flex direction="column" gap="3" align="center">
            <Heading size="5" align="center">New Arrivals</Heading>
            <Text align="center" color="gray">
              Check out the latest NFTs on the marketplace
            </Text>
          </Flex>
        </Card>
        
        <Card size="3">
          <Flex direction="column" gap="3" align="center">
            <Heading size="5" align="center">Top Collections</Heading>
            <Text align="center" color="gray">
              Browse trending collections from top creators
            </Text>
          </Flex>
        </Card>
      </Grid>

      <Heading size="6" mb="4">Trending Collections</Heading>
      <Text color="gray" mb="6">
        NFT marketplace functionality will be implemented here. This page will display:
      </Text>
      
      <ul>
        <li>Featured NFTs with images, prices, and creator information</li>
        <li>Filter and search functionality</li>
        <li>Category navigation</li>
        <li>Collection highlights</li>
        <li>Recent activity and sales</li>
      </ul>
    </Container>
  );
}