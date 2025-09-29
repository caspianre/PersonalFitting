import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PersonalFitnessTracker", function () {
  it("adds and reads encrypted records", async function () {
    const [user] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PersonalFitnessTracker");
    const contract = await factory.deploy();

    await fhevm.initializeCLIApi();

    const buffer = await fhevm
      .createEncryptedInput(await contract.getAddress(), user.address)
      .add32(180)
      .add32(75)
      .add32(120)
      .add32(80)
      .encrypt();

    await (await contract.connect(user).addRecord(buffer.handles[0], buffer.handles[1], buffer.handles[2], buffer.handles[3], buffer.inputProof)).wait();

    const count = await contract.getRecordCount(user.address);
    expect(count).to.equal(1n);

    const [h, w, s, d, t] = await contract.getRecord(user.address, 0);
    expect(t).to.be.greaterThan(0);

    const clearH = await fhevm.userDecryptEuint(FhevmType.euint32, h, await contract.getAddress(), user);
    const clearW = await fhevm.userDecryptEuint(FhevmType.euint32, w, await contract.getAddress(), user);
    const clearS = await fhevm.userDecryptEuint(FhevmType.euint32, s, await contract.getAddress(), user);
    const clearD = await fhevm.userDecryptEuint(FhevmType.euint32, d, await contract.getAddress(), user);

    expect(clearH).to.equal(180n);
    expect(clearW).to.equal(75n);
    expect(clearS).to.equal(120n);
    expect(clearD).to.equal(80n);
  });
});

