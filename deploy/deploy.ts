import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPersonalFitnessTracker = await deploy("PersonalFitnessTracker", {
    from: deployer,
    log: true,
  });

  console.log(`PersonalFitnessTracker contract: `, deployedPersonalFitnessTracker.address);
};
export default func;
func.id = "deploy_personalFitnessTracker"; // id required to prevent reexecution
func.tags = ["PersonalFitnessTracker"];
