import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PersonalFitnessTracker } from "../types";
import type { Signer } from "ethers";

describe("PersonalFitnessTracker (Sepolia)", function () {
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

  it("should add fitness record on Sepolia", async function () {
    this.timeout(120000);

    const input = fhevm.createEncryptedInput(contractAddress, signers[0].address);
    input.add32(175); // height in cm
    input.add32(70000); // weight in grams (70kg)
    input.add32(120); // systolic pressure
    input.add32(80); // diastolic pressure

    const encryptedInput = await input.encrypt();

    const tx = await contract.addFitnessRecord(
      encryptedInput.handles[0],
      encryptedInput.handles[1],
      encryptedInput.handles[2],
      encryptedInput.handles[3],
      encryptedInput.inputProof
    );

    await tx.wait();

    const recordCount = await contract.getRecordCount(signers[0].address);
    expect(recordCount).to.equal(1);
  });

  it("should decrypt fitness data on Sepolia", async function () {
    this.timeout(120000);

    const record = await contract.getFitnessRecord(signers[0].address, 0);

    // Decrypt the values
    const decryptedHeight = await fhevm.userDecryptEuint32(
      record.height,
      contractAddress,
      signers[0]
    );
    const decryptedWeight = await fhevm.userDecryptEuint32(
      record.weight,
      contractAddress,
      signers[0]
    );
    const decryptedSystolic = await fhevm.userDecryptEuint32(
      record.systolic,
      contractAddress,
      signers[0]
    );
    const decryptedDiastolic = await fhevm.userDecryptEuint32(
      record.diastolic,
      contractAddress,
      signers[0]
    );

    expect(decryptedHeight).to.equal(175);
    expect(decryptedWeight).to.equal(70000);
    expect(decryptedSystolic).to.equal(120);
    expect(decryptedDiastolic).to.equal(80);
  });
});