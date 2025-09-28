import React, { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { config } from './wagmi'
import { createFHEVMInstance } from './config'
import { FHEVMInstance } from './types'
import AddRecordForm from './components/AddRecordForm'
import RecordsList from './components/RecordsList'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

const AppContent: React.FC = () => {
  const { isConnected } = useAccount()
  const [fhevmInstance, setFhevmInstance] = useState<FHEVMInstance | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const initializeFHEVM = async () => {
    setIsInitializing(true)
    setInitError(null)

    try {
      const instance = await createFHEVMInstance()
      setFhevmInstance(instance)
    } catch (error: any) {
      console.error('Failed to initialize FHEVM:', error)
      setInitError('Failed to initialize FHEVM: ' + error.message)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    if (isConnected && !fhevmInstance && !isInitializing) {
      initializeFHEVM()
    }
  }, [isConnected, fhevmInstance, isInitializing])

  const handleRecordAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (!isConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>Personal Fitness Tracker</h1>
          <p>Securely track your health data with encrypted storage on blockchain</p>
        </div>
        <div className="wallet-connection">
          <h2>Connect your wallet to get started</h2>
          <p>Your health data will be encrypted and stored securely on the Sepolia testnet.</p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="container">
        <div className="header">
          <h1>Personal Fitness Tracker</h1>
          <div style={{ textAlign: 'right' }}>
            <ConnectButton />
          </div>
        </div>
        <div className="loading">
          <p>Initializing FHEVM instance...</p>
          <p>This may take a few moments...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="container">
        <div className="header">
          <h1>Personal Fitness Tracker</h1>
          <div style={{ textAlign: 'right' }}>
            <ConnectButton />
          </div>
        </div>
        <div className="error">
          <p>{initError}</p>
          <button onClick={initializeFHEVM} className="button">
            Retry Initialization
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Personal Fitness Tracker</h1>
        <p>Securely track your health data with FHE encryption</p>
        <div style={{ textAlign: 'right' }}>
          <ConnectButton />
        </div>
      </div>

      <AddRecordForm
        fhevmInstance={fhevmInstance}
        onRecordAdded={handleRecordAdded}
      />

      <RecordsList
        fhevmInstance={fhevmInstance}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App