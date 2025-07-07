import { BrowserProvider, Contract } from "ethers";
import DeNews from "../abi/DeNews.json";
import { CONTRACT_ADDRESS } from "./config";

export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new BrowserProvider(window.ethereum); // ✅ correct for ethers v6
  const signer = await provider.getSigner();             // ✅ now async
  return new Contract(CONTRACT_ADDRESS, DeNews.abi, signer);
};
