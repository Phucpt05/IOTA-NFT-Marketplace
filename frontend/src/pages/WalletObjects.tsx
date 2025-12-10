import { Container, Heading, Text, Flex, Card } from "@radix-ui/themes";
import { useCurrentAccount } from "@iota/dapp-kit";
import { OwnedObjects } from "../OwnedObjects";
import { WalletStatus } from "../WalletStatus";

export function WalletObjects() {
  const account = useCurrentAccount();

  return (
    <Container size="4" px="4" py="6">
      <Heading size="8" mb="6" align="center">
        Wallet Objects
      </Heading>
      
      {account ? (
        <>
          <Text size="5" color="gray" mb="6" align="center" as="div">
            Managing objects for wallet: {account.address.slice(0, 10)}...{account.address.slice(-10)}
          </Text>
          
          <Card size="3" mb="6">
            <Flex direction="column" gap="4">
              <Heading size="4">Wallet Information</Heading>
              <WalletStatus />
            </Flex>
          </Card>
          
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="4">Owned Objects</Heading>
              <OwnedObjects />
            </Flex>
          </Card>
        </>
      ) : (
        <Card size="3">
          <Flex direction="column" align="center" gap="4">
            <Heading size="4" color="gray">Wallet Not Connected</Heading>
            <Text color="gray" align="center">
              Please connect your wallet to view and manage your objects
            </Text>
          </Flex>
        </Card>
      )}
    </Container>
  );
}