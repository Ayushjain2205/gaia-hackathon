const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockToken
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy(
    "Mock USDC",
    "mUSDC",
    6,
    deployer.address
  );
  await mockToken.waitForDeployment();

  console.log("MockToken address:", await mockToken.getAddress());

  // Mint some initial tokens to the deployer
  const initialMint = hre.ethers.parseUnits("1000000", 6); // 1 million USDC
  await mockToken.mint(deployer.address, initialMint);
  console.log("Minted 1,000,000 mUSDC to deployer");

  // Deploy PredictionMarket
  const PredictionMarket = await hre.ethers.getContractFactory(
    "PredictionMarket"
  );
  const predictionMarket = await PredictionMarket.deploy(
    await mockToken.getAddress(),
    deployer.address
  );
  await predictionMarket.waitForDeployment();

  console.log("PredictionMarket address:", await predictionMarket.getAddress());

  // Print summary
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("MockToken (mUSDC):", await mockToken.getAddress());
  console.log("PredictionMarket:", await predictionMarket.getAddress());
  console.log("\nNext steps:");
  console.log(
    "1. Copy these addresses to your src/helpers/contractHelpers.ts file."
  );
  console.log(
    "2. Run your frontend application and interact with the contracts."
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
