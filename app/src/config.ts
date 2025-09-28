import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk'

export const CONTRACT_ADDRESS = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50'

export const SEPOLIA_CHAIN_ID = 11155111

export const createFHEVMInstance = async () => {
  const instance = await createInstance({
    ...SepoliaConfig,
    network: window.ethereum,
  })
  return instance
}