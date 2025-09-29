// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Personal Fitness Tracker using FHE
/// @notice Stores encrypted fitness records on-chain per user
/// @dev Data fields are encrypted euint32. Timestamp is plaintext UNIX seconds.
contract PersonalFitnessTracker is SepoliaConfig {
    struct EncryptedRecord {
        euint32 height; // centimeters
        euint32 weight; // kilograms (multiply by 100 if decimals needed)
        euint32 systolic;
        euint32 diastolic;
        uint64 timestamp; // block timestamp when record added
    }

    mapping(address => EncryptedRecord[]) private _records; // user => records

    event RecordAdded(address indexed user, uint256 indexed index, uint64 timestamp);

    /// @notice Add a new encrypted fitness record for msg.sender
    /// @param encHeight Encrypted height (cm)
    /// @param encWeight Encrypted weight (kg * 100 optional)
    /// @param encSystolic Encrypted systolic blood pressure
    /// @param encDiastolic Encrypted diastolic blood pressure
    /// @param inputProof Input proof from the relayer
    function addRecord(
        externalEuint32 encHeight,
        externalEuint32 encWeight,
        externalEuint32 encSystolic,
        externalEuint32 encDiastolic,
        bytes calldata inputProof
    ) external {
        euint32 h = FHE.fromExternal(encHeight, inputProof);
        euint32 w = FHE.fromExternal(encWeight, inputProof);
        euint32 s = FHE.fromExternal(encSystolic, inputProof);
        euint32 d = FHE.fromExternal(encDiastolic, inputProof);

        // Persist
        _records[msg.sender].push(
            EncryptedRecord({
                height: h,
                weight: w,
                systolic: s,
                diastolic: d,
                timestamp: uint64(block.timestamp)
            })
        );

        // ACL: allow contract + sender to access/decrypt their fields
        EncryptedRecord storage rec = _records[msg.sender][_records[msg.sender].length - 1];
        FHE.allowThis(rec.height);
        FHE.allow(rec.height, msg.sender);
        FHE.allowThis(rec.weight);
        FHE.allow(rec.weight, msg.sender);
        FHE.allowThis(rec.systolic);
        FHE.allow(rec.systolic, msg.sender);
        FHE.allowThis(rec.diastolic);
        FHE.allow(rec.diastolic, msg.sender);

        emit RecordAdded(msg.sender, _records[msg.sender].length - 1, uint64(block.timestamp));
    }

    /// @notice Get how many records a user has
    /// @param user The user address to query
    /// @return count Number of records
    function getRecordCount(address user) external view returns (uint256 count) {
        return _records[user].length;
    }

    /// @notice Get a specific encrypted record for a user
    /// @dev View method does not rely on msg.sender for address selection
    /// @param user The user address
    /// @param index The record index (0..count-1)
    /// @return height Encrypted height (bytes32 handle)
    /// @return weight Encrypted weight (bytes32 handle)
    /// @return systolic Encrypted systolic pressure (bytes32 handle)
    /// @return diastolic Encrypted diastolic pressure (bytes32 handle)
    /// @return timestamp UNIX seconds when record was stored
    function getRecord(
        address user,
        uint256 index
    ) external view returns (euint32 height, euint32 weight, euint32 systolic, euint32 diastolic, uint64 timestamp) {
        EncryptedRecord storage r = _records[user][index];
        return (r.height, r.weight, r.systolic, r.diastolic, r.timestamp);
    }
}

