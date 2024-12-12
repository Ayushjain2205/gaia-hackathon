const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let PredictionMarket,
    predictionMarket,
    MockToken,
    mockToken,
    owner,
    addr1,
    addr2;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6);
  let currentTime;
  let marketId;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock USDC", "mUSDC", 6, owner.address);
    await mockToken.waitForDeployment();

    PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy(
      await mockToken.getAddress(),
      owner.address
    );
    await predictionMarket.waitForDeployment();

    // Mint some tokens to addr1 and addr2
    await mockToken.mint(addr1.address, ethers.parseUnits("10000", 6));
    await mockToken.mint(addr2.address, ethers.parseUnits("10000", 6));

    // Approve PredictionMarket to spend tokens
    await mockToken.approve(
      await predictionMarket.getAddress(),
      INITIAL_SUPPLY
    );
    await mockToken
      .connect(addr1)
      .approve(await predictionMarket.getAddress(), INITIAL_SUPPLY);
    await mockToken
      .connect(addr2)
      .approve(await predictionMarket.getAddress(), INITIAL_SUPPLY);

    // Get current block timestamp
    currentTime = (await ethers.provider.getBlock("latest")).timestamp;

    // Create a market
    const question = "Will ETH reach $5000 by the end of 2023?";
    const endTime = currentTime + 86400; // 24 hours from now
    await predictionMarket.createMarket(question, endTime);
    marketId = 1;

    // Buy shares
    const amount = ethers.parseUnits("100", 6);
    await predictionMarket.connect(addr1).buyShares(marketId, true, amount);
    await predictionMarket.connect(addr2).buyShares(marketId, false, amount);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await predictionMarket.owner()).to.equal(owner.address);
    });

    it("Should set the correct token address", async function () {
      expect(await predictionMarket.token()).to.equal(
        await mockToken.getAddress()
      );
    });
  });

  describe("Market Creation", function () {
    it("Should create a new market", async function () {
      const question = "Will BTC reach $100,000 by the end of 2023?";
      const endTime = currentTime + 86400; // 24 hours from now

      await expect(predictionMarket.createMarket(question, endTime))
        .to.emit(predictionMarket, "MarketCreated")
        .withArgs(2, owner.address, question, endTime);

      const marketDetails = await predictionMarket.getMarketDetails(2);
      expect(marketDetails.creator).to.equal(owner.address);
      expect(marketDetails.question).to.equal(question);
      expect(marketDetails.endTime).to.equal(endTime);
    });

    it("Should not create a market with past end time", async function () {
      const question = "Will it rain yesterday?";
      const endTime = currentTime - 1; // 1 second in the past

      await expect(
        predictionMarket.createMarket(question, endTime)
      ).to.be.revertedWith("End time must be in the future");
    });
  });

  describe("Share Purchase", function () {
    it("Should allow users to buy shares", async function () {
      const amount = ethers.parseUnits("50", 6);

      await expect(
        predictionMarket.connect(addr1).buyShares(marketId, true, amount)
      )
        .to.emit(predictionMarket, "SharesPurchased")
        .withArgs(marketId, addr1.address, true, amount);

      const marketDetails = await predictionMarket.getMarketDetails(marketId);
      expect(marketDetails.yesShares).to.equal(ethers.parseUnits("150", 6));

      const userShares = await predictionMarket.getUserShares(
        marketId,
        addr1.address
      );
      expect(userShares.yesShares).to.equal(ethers.parseUnits("150", 6));
      expect(userShares.noShares).to.equal(0);
    });

    it("Should not allow buying shares after market end time", async function () {
      const amount = ethers.parseUnits("100", 6);

      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.connect(addr1).buyShares(marketId, true, amount)
      ).to.be.revertedWithCustomError(predictionMarket, "MarketEnded");
    });
  });

  describe("Market Resolution", function () {
    it("Should not allow resolving before end time", async function () {
      await expect(
        predictionMarket.resolveMarket(marketId, true)
      ).to.be.revertedWith("Market has not ended yet");
    });

    it("Should resolve market and distribute payouts correctly", async function () {
      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      const initialBalance1 = await mockToken.balanceOf(addr1.address);
      const initialBalance2 = await mockToken.balanceOf(addr2.address);

      console.log("Initial balance addr1:", initialBalance1.toString());
      console.log("Initial balance addr2:", initialBalance2.toString());

      const tx = await predictionMarket
        .connect(addr1)
        .resolveMarket(marketId, true);
      const receipt = await tx.wait();

      // Check for PayoutDistributed events
      const payoutEvents = receipt.logs
        .map((log) => {
          try {
            return predictionMarket.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(
          (parsedLog) => parsedLog && parsedLog.name === "PayoutDistributed"
        )
        .map((parsedLog) => ({
          recipient: parsedLog.args.recipient,
          amount: parsedLog.args.amount,
        }));

      console.log("Payout events:", payoutEvents);

      const finalBalance1 = await mockToken.balanceOf(addr1.address);
      const finalBalance2 = await mockToken.balanceOf(addr2.address);

      console.log("Final balance addr1:", finalBalance1.toString());
      console.log("Final balance addr2:", finalBalance2.toString());

      // Calculate expected payout
      const totalShares = ethers.parseUnits("200", 6); // 100 YES + 100 NO
      const expectedPayout = totalShares;

      console.log("Expected payout:", expectedPayout.toString());
      console.log(
        "Actual payout:",
        (BigInt(finalBalance1) - BigInt(initialBalance1)).toString()
      );

      expect(BigInt(finalBalance1)).to.be.gt(BigInt(initialBalance1));
      expect(finalBalance2).to.equal(initialBalance2);

      // Add assertions for the payout events
      expect(payoutEvents.length).to.equal(1);
      expect(payoutEvents[0].recipient).to.equal(addr1.address);
      expect(payoutEvents[0].amount).to.equal(expectedPayout);

      const marketDetails = await predictionMarket.getMarketDetails(marketId);
      expect(marketDetails.resolved).to.be.true;

      // Check that the MarketResolved event was emitted with the correct resolver
      const marketResolvedEvent = receipt.logs
        .map((log) => {
          try {
            return predictionMarket.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((parsedLog) => parsedLog && parsedLog.name === "MarketResolved");

      expect(marketResolvedEvent).to.not.be.undefined;
      expect(marketResolvedEvent.args.marketId).to.equal(marketId);
      expect(marketResolvedEvent.args.outcome).to.be.true;
      expect(marketResolvedEvent.args.resolver).to.equal(addr1.address);
    });

    it("Should allow anyone to resolve the market after end time", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.connect(addr2).resolveMarket(marketId, false)
      )
        .to.emit(predictionMarket, "MarketResolved")
        .withArgs(marketId, false, addr2.address);

      const marketDetails = await predictionMarket.getMarketDetails(marketId);
      expect(marketDetails.resolved).to.be.true;
    });

    it("Should not allow resolving an already resolved market", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      await predictionMarket.resolveMarket(marketId, true);

      await expect(
        predictionMarket.resolveMarket(marketId, false)
      ).to.be.revertedWithCustomError(
        predictionMarket,
        "MarketAlreadyResolved"
      );
    });
  });
});
