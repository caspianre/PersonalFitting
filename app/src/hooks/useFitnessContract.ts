import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { Contract, ethers } from 'ethers'
import { CONTRACT_ADDRESS } from '../config'
import { FitnessRecord, EncryptedFitnessRecord, FHEVMInstance } from '../types'

const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "externalEuint32", "name": "heightInput", "type": "bytes32" },
      { "internalType": "externalEuint32", "name": "weightInput", "type": "bytes32" },
      { "internalType": "externalEuint32", "name": "systolicInput", "type": "bytes32" },
      { "internalType": "externalEuint32", "name": "diastolicInput", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "addFitnessRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "getFitnessRecord",
    "outputs": [
      { "internalType": "euint32", "name": "height", "type": "bytes32" },
      { "internalType": "euint32", "name": "weight", "type": "bytes32" },
      { "internalType": "euint32", "name": "systolic", "type": "bytes32" },
      { "internalType": "euint32", "name": "diastolic", "type": "bytes32" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyRecords",
    "outputs": [
      {
        "components": [
          { "internalType": "euint32", "name": "height", "type": "bytes32" },
          { "internalType": "euint32", "name": "weight", "type": "bytes32" },
          { "internalType": "euint32", "name": "systolic", "type": "bytes32" },
          { "internalType": "euint32", "name": "diastolic", "type": "bytes32" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct PersonalFitnessTracker.FitnessRecord[]",
        "name": "records",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getRecordCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getRecordTimestamps",
    "outputs": [
      { "internalType": "uint256[]", "name": "timestamps", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export const useFitnessContract = (fhevmInstance: FHEVMInstance | null) => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (window.ethereum && address) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = provider.getSigner()
      signer.then((s) => {
        const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s)
        setContract(contractInstance)
      })
    }
  }, [address])

  const addFitnessRecord = async (data: {
    height: number
    weight: number
    systolic: number
    diastolic: number
  }) => {
    if (!contract || !fhevmInstance || !address) {
      throw new Error('Contract or FHEVM instance not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address)
      input.add32(data.height)
      input.add32(data.weight)
      input.add32(data.systolic)
      input.add32(data.diastolic)

      const encryptedInput = await input.encrypt()

      const tx = await contract.addFitnessRecord(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.inputProof
      )

      await tx.wait()
      return tx
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add fitness record'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getRecordCount = async (): Promise<number> => {
    if (!contract || !address) return 0

    try {
      const count = await contract.getRecordCount(address)
      return Number(count)
    } catch (err: any) {
      console.error('Error getting record count:', err)
      return 0
    }
  }

  const getEncryptedRecords = async (): Promise<EncryptedFitnessRecord[]> => {
    if (!contract || !address) return []

    try {
      const records = await contract.getMyRecords()
      return records.map((record: any) => ({
        height: record.height,
        weight: record.weight,
        systolic: record.systolic,
        diastolic: record.diastolic,
        timestamp: Number(record.timestamp)
      }))
    } catch (err: any) {
      console.error('Error getting encrypted records:', err)
      return []
    }
  }

  const decryptRecords = async (encryptedRecords: EncryptedFitnessRecord[]): Promise<FitnessRecord[]> => {
    if (!fhevmInstance || !address) return []

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const keypair = fhevmInstance.generateKeypair()
      const startTimeStamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = "10"
      const contractAddresses = [CONTRACT_ADDRESS]

      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      )

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      )

      const decryptedResults: FitnessRecord[] = []

      for (const record of encryptedRecords) {
        const handleContractPairs = [
          { handle: record.height, contractAddress: CONTRACT_ADDRESS },
          { handle: record.weight, contractAddress: CONTRACT_ADDRESS },
          { handle: record.systolic, contractAddress: CONTRACT_ADDRESS },
          { handle: record.diastolic, contractAddress: CONTRACT_ADDRESS },
        ]

        const result = await fhevmInstance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace("0x", ""),
          contractAddresses,
          address,
          startTimeStamp,
          durationDays
        )

        decryptedResults.push({
          height: result[record.height],
          weight: result[record.weight],
          systolic: result[record.systolic],
          diastolic: result[record.diastolic],
          timestamp: record.timestamp
        })
      }

      return decryptedResults
    } catch (err: any) {
      console.error('Error decrypting records:', err)
      return []
    }
  }

  return {
    contract,
    addFitnessRecord,
    getRecordCount,
    getEncryptedRecords,
    decryptRecords,
    isLoading,
    error
  }
}