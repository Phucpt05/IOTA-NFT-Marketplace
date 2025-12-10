import { useCurrentAccount, useIotaClientQuery } from "@iota/dapp-kit";
import { Text } from "@radix-ui/themes";

const formatBalance = (balance?: string) => {
    if (!balance) return "0";
    const val = parseInt(balance) / 1_000_000_000;
    return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

export function WalletBalance() {
  const account = useCurrentAccount();
  
  const { data: balance, isPending, error } = useIotaClientQuery(
    "getBalance",
    {
      owner: account?.address || "",
    },
    {
      enabled: !!account,
      refetchInterval: 5000, 
    }
  );

  if (!account) {
    return null;
  }

  if (error) {
    return <Text color="red">Error fetching balance</Text>;
  }

  if (isPending) {
    return <Text>Loading balance...</Text>;
  }
  const formattedBalance = formatBalance(balance?.totalBalance);

  return (
    <Text weight="bold">
      Balance: {formattedBalance} IOTA
    </Text>
  );
}