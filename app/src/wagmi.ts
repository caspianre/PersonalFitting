import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Personal Fitness Tracker',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: false,
})