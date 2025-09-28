export interface FitnessRecord {
  height: number
  weight: number
  systolic: number
  diastolic: number
  timestamp: number
}

export interface EncryptedFitnessRecord {
  height: string
  weight: string
  systolic: string
  diastolic: string
  timestamp: number
}

export interface FHEVMInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any
  userDecrypt: (
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ) => Promise<Record<string, any>>
  generateKeypair: () => { privateKey: string; publicKey: string }
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ) => any
}