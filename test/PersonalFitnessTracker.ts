import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PersonalFitnessTracker } from "../types";
import type { Signer } from "ethers";

describe("PersonalFitnessTracker", function () {
  let contract: PersonalFitnessTracker;
  let contractAddress: string;
  let signers: Signer[];

  before(async function () {
    signers = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("PersonalFitnessTracker");
    contract = await contractFactory.connect(signers[0]).deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should add and retrieve fitness records", async function () {
    const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
    input.add32(175); // height in cm
    input.add32(70000); // weight in grams (70kg)
    input.add32(120); // systolic pressure
    input.add32(80); // diastolic pressure

    const encryptedInput = await input.encrypt();

    await contract.addFitnessRecord(
      encryptedInput.handles[0], // height
      encryptedInput.handles[1], // weight
      encryptedInput.handles[2], // systolic
      encryptedInput.handles[3], // diastolic
      encryptedInput.inputProof
    );

    const recordCount = await contract.getRecordCount(signers[0].address);
    expect(recordCount).to.equal(1);

    const record = await contract.getFitnessRecord(signers[0].address, 0);
    expect(record.timestamp).to.be.greaterThan(0);

    const timestamps = await contract.getRecordTimestamps(signers[0].address);
    expect(timestamps.length).to.equal(1);
  });

  it("should allow multiple records for the same user", async function () {
    const input1 = fhevm.createEncryptedInput(contractAddress, signers[0].address);
    input1.add32(176); // height in cm
    input1.add32(71000); // weight in grams (71kg)
    input1.add32(125); // systolic pressure
    input1.add32(85); // diastolic pressure

    const encryptedInput1 = await input1.encrypt();

    await contract.addFitnessRecord(
      encryptedInput1.handles[0],
      encryptedInput1.handles[1],
      encryptedInput1.handles[2],
      encryptedInput1.handles[3],
      encryptedInput1.inputProof
    );

    const recordCount = await contract.getRecordCount(signers[0].address);
    expect(recordCount).to.equal(2);

    const latestRecord = await contract.getLatestRecord(signers[0].address);
    expect(latestRecord.timestamp).to.be.greaterThan(0);
  });

  it("should handle different users separately", async function () {
    const input = fhevm.createEncryptedInput(contractAddress, signers[1].address);
    input.add32(180); // height in cm
    input.add32(75000); // weight in grams (75kg)
    input.add32(130); // systolic pressure
    input.add32(90); // diastolic pressure

    const encryptedInput = await input.encrypt();

    await contract.connect(signers[1]).addFitnessRecord(
      encryptedInput.handles[0],
      encryptedInput.handles[1],
      encryptedInput.handles[2],
      encryptedInput.handles[3],
      encryptedInput.inputProof
    );

    const user0Count = await contract.getRecordCount(signers[0].address);
    const user1Count = await contract.getRecordCount(signers[1].address);

    expect(user0Count).to.equal(2);
    expect(user1Count).to.equal(1);
  });

  it("should revert when accessing non-existent records", async function () {
    await expect(
      contract.getFitnessRecord(signers[0].address, 999)
    ).to.be.revertedWith("Record index out of bounds");
  });

  it("should revert when getting latest record for user with no records", async function () {
    await expect(
      contract.getLatestRecord(signers[2].address)
    ).to.be.revertedWith("No records found");
  });

  it("should allow user to get their own records", async function () {
    const myRecords = await contract.connect(signers[0]).getMyRecords();
    expect(myRecords.length).to.equal(2);
  });
});