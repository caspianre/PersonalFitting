// PersonalFitnessTracker contract on Sepolia (update after deploy)
// IMPORTANT: Copy the ABI from deployments/sepolia after deploy, and update the address below.
export const CONTRACT_ADDRESS = '0x47432B5d028882727d16c25CFdb12F45180B8d02';

// ABI copied from compiled/deployed artifacts of PersonalFitnessTracker
export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "index", "type": "uint256" },
      { "indexed": false, "internalType": "uint64", "name": "timestamp", "type": "uint64" }
    ],
    "name": "RecordAdded",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "encHeight", "type": "bytes32" },
      { "internalType": "bytes32", "name": "encWeight", "type": "bytes32" },
      { "internalType": "bytes32", "name": "encSystolic", "type": "bytes32" },
      { "internalType": "bytes32", "name": "encDiastolic", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "addRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getRecordCount",
    "outputs": [ { "internalType": "uint256", "name": "count", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "getRecord",
    "outputs": [
      { "internalType": "bytes32", "name": "height", "type": "bytes32" },
      { "internalType": "bytes32", "name": "weight", "type": "bytes32" },
      { "internalType": "bytes32", "name": "systolic", "type": "bytes32" },
      { "internalType": "bytes32", "name": "diastolic", "type": "bytes32" },
      { "internalType": "uint64", "name": "timestamp", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

