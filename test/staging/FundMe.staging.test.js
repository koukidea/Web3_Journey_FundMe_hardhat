const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

// Staging tests only in Testnet chains!
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe, deployer
          const sendValue = ethers.utils.parseUnits("0.1", "ether")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("Should allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.cheaperWithdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
