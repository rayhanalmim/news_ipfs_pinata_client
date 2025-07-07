// client/src/utils/getContract.js
import { Contract, BrowserProvider } from "ethers";
import DeNews from "../abi/DeNews.json";
import { CONTRACT_ADDRESS } from "./config";

// Sepolia testnet chainId (in decimal and hex)
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

// Function to ensure we're on Sepolia network
export const ensureSepoliaNetwork = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  // Get the current chain ID
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });

  // Check if we're already on Sepolia
  if (chainId === SEPOLIA_CHAIN_ID_HEX) {
    console.log("Already on Sepolia network");
    return true;
  }

  console.log(`Current network: ${chainId}, switching to Sepolia: ${SEPOLIA_CHAIN_ID_HEX}`);

  try {
    // Request network switch
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }
          ],
        });
        // Try switching again
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add Sepolia network", addError);
        throw new Error("Could not add Sepolia network to MetaMask");
      }
    } else {
      console.error("Failed to switch to Sepolia network", switchError);
      throw new Error("Please manually switch to Sepolia network in MetaMask");
    }
  }
};

export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  // First, ensure we're on Sepolia
  await ensureSepoliaNetwork();

  // Now connect to the contract
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, DeNews.abi, signer);
};
