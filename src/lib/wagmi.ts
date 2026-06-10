import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
const isMainnet = network === "mainnet";

export const ESCROW_ADDRESS = isMainnet
  ? process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS_MAINNET || ""
  : process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS_TESTNET || "";

export const USDM_ADDRESS = isMainnet
  ? process.env.NEXT_PUBLIC_USDM_ADDRESS_MAINNET || ""
  : process.env.NEXT_PUBLIC_USDM_ADDRESS_TESTNET || "";

export const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL_MAINNET || "https://forno.celo.org"),
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL_TESTNET || "https://alfajores-forno.celo-testnet.org"),
  },
});