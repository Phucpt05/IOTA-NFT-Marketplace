import { ConnectButton } from "@iota/dapp-kit";
import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { WalletBalance } from "./WalletBalance";
import { NFTMarketplace } from "./pages/NFTMarketplace";
import { WalletObjects } from "./pages/WalletObjects";
import { MintNFTPage } from "./pages/MintNFTPage";
import { ListingPage } from "./pages/ListingPage";
// React Router imports - uncomment after installing react-router-dom
// import { BrowserRouter as Router, Routes, Route, Link as RouterLink, useLocation } from "react-router-dom";

function App() {
  // For now, we'll use simple routing with window.location
  // Once react-router-dom is installed, we can switch to proper routing
  const currentPath = window.location.pathname;
  const showMarketplace = currentPath === "/" || currentPath === "";
  const showWalletObjects = currentPath === "/wallet";
  const showMintNFT = currentPath === "/mint";
  const showListing = currentPath === "/listing";

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Flex align="center" gap="6">
          <Heading
            onClick={() => window.location.href = "/"}
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            IOTA NFT Marketplace
          </Heading>
          <nav>
            <Flex gap="4">
              <Text
                onClick={() => window.location.href = "/"}
                style={{ cursor: 'pointer', color: showMarketplace ? 'blue' : 'gray' }}
              >
                Marketplace
              </Text>
              <Text
                onClick={() => window.location.href = "/wallet"}
                style={{ cursor: 'pointer', color: showWalletObjects ? 'blue' : 'gray' }}
              >
                Wallet Objects
              </Text>
              <Text
                onClick={() => window.location.href = "/listing"}
                style={{ cursor: 'pointer', color: showListing ? 'blue' : 'gray' }}
              >
                My NFTs
              </Text>
              <Text
                onClick={() => window.location.href = "/mint"}
                style={{ cursor: 'pointer', color: showMintNFT ? 'blue' : 'gray' }}
              >
                Mint NFT
              </Text>
            </Flex>
          </nav>
        </Flex>

        <Flex align="center" gap="4">
          <WalletBalance />
          <ConnectButton />
        </Flex>
      </Flex>
      
      {/* Once react-router-dom is installed, replace this with:
      <Routes>
        <Route path="/" element={<NFTMarketplace />} />
        <Route path="/wallet" element={<WalletObjects />} />
        <Route path="/listing" element={<ListingPage />} />
        <Route path="/mint" element={<MintNFTPage />} />
      </Routes>
      */}
      
     {showMarketplace && <NFTMarketplace />}
     {showWalletObjects && <WalletObjects />}
     {showListing && <ListingPage />}
     {showMintNFT && <MintNFTPage />}
    </>
  );
}

export default App;
