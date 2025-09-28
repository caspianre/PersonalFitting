// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Personal Fitness Tracker with FHE
/// @notice Allows users to securely store encrypted fitness data including height, weight, and blood pressure
contract PersonalFitnessTracker is SepoliaConfig {
    struct FitnessRecord {
        euint32 height;       // Height in cm
        euint32 weight;       // Weight in grams
        euint32 systolic;     // Systolic blood pressure
        euint32 diastolic;    // Diastolic blood pressure
        uint256 timestamp;    // Record timestamp
    }

    mapping(address => FitnessRecord[]) private userRecords;
    mapping(address => uint256) private userRecordCount;

    event FitnessDataAdded(address indexed user, uint256 indexed recordIndex, uint256 timestamp);

    /// @notice Add a new fitness record for the user
    /// @param heightInput Encrypted height in cm
    /// @param weightInput Encrypted weight in grams
    /// @param systolicInput Encrypted systolic blood pressure
    /// @param diastolicInput Encrypted diastolic blood pressure
    /// @param inputProof Proof for the encrypted inputs
    function addFitnessRecord(
        externalEuint32 heightInput,
        externalEuint32 weightInput,
        externalEuint32 systolicInput,
        externalEuint32 diastolicInput,
        bytes calldata inputProof
    ) external {
        euint32 height = FHE.fromExternal(heightInput, inputProof);
        euint32 weight = FHE.fromExternal(weightInput, inputProof);
        euint32 systolic = FHE.fromExternal(systolicInput, inputProof);
        euint32 diastolic = FHE.fromExternal(diastolicInput, inputProof);

        FitnessRecord memory newRecord = FitnessRecord({
            height: height,
            weight: weight,
            systolic: systolic,
            diastolic: diastolic,
            timestamp: block.timestamp
        });

        userRecords[msg.sender].push(newRecord);
        uint256 recordIndex = userRecordCount[msg.sender];
        userRecordCount[msg.sender]++;

        // Grant access permissions
        FHE.allowThis(height);
        FHE.allow(height, msg.sender);
        FHE.allowThis(weight);
        FHE.allow(weight, msg.sender);
        FHE.allowThis(systolic);
        FHE.allow(systolic, msg.sender);
        FHE.allowThis(diastolic);
        FHE.allow(diastolic, msg.sender);

        emit FitnessDataAdded(msg.sender, recordIndex, block.timestamp);
    }

    /// @notice Get the number of records for a user
    /// @param user The user address
    /// @return The number of records
    function getRecordCount(address user) external view returns (uint256) {
        return userRecordCount[user];
    }

    /// @notice Get encrypted fitness record by index
    /// @param user The user address
    /// @param index The record index
    /// @return height Encrypted height
    /// @return weight Encrypted weight
    /// @return systolic Encrypted systolic pressure
    /// @return diastolic Encrypted diastolic pressure
    /// @return timestamp Record timestamp
    function getFitnessRecord(address user, uint256 index)
        external
        view
        returns (
            euint32 height,
            euint32 weight,
            euint32 systolic,
            euint32 diastolic,
            uint256 timestamp
        )
    {
        require(index < userRecords[user].length, "Record index out of bounds");

        FitnessRecord storage record = userRecords[user][index];
        return (
            record.height,
            record.weight,
            record.systolic,
            record.diastolic,
            record.timestamp
        );
    }

    /// @notice Get all encrypted fitness records for the caller
    /// @return records Array of fitness records
    function getMyRecords() external view returns (FitnessRecord[] memory) {
        return userRecords[msg.sender];
    }

    /// @notice Get latest encrypted fitness record for a user
    /// @param user The user address
    /// @return height Encrypted height
    /// @return weight Encrypted weight
    /// @return systolic Encrypted systolic pressure
    /// @return diastolic Encrypted diastolic pressure
    /// @return timestamp Record timestamp
    function getLatestRecord(address user)
        external
        view
        returns (
            euint32 height,
            euint32 weight,
            euint32 systolic,
            euint32 diastolic,
            uint256 timestamp
        )
    {
        require(userRecords[user].length > 0, "No records found");

        uint256 latestIndex = userRecords[user].length - 1;
        FitnessRecord storage record = userRecords[user][latestIndex];

        return (
            record.height,
            record.weight,
            record.systolic,
            record.diastolic,
            record.timestamp
        );
    }

    /// @notice Get timestamps of all records for a user (public information)
    /// @param user The user address
    /// @return timestamps Array of record timestamps
    function getRecordTimestamps(address user) external view returns (uint256[] memory) {
        uint256[] memory timestamps = new uint256[](userRecords[user].length);
        for (uint256 i = 0; i < userRecords[user].length; i++) {
            timestamps[i] = userRecords[user][i].timestamp;
        }
        return timestamps;
    }
}