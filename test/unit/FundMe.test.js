const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

// Unit tests only on development chains!
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          // "1000000000000000000" // 1 ETH
          beforeEach(async function () {
              // wee need to deploy in here.
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("Should sets Aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Shold fail when you send don't enough ETH!", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Should update the amount funded data structe correctly", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAmountFunded(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Should adds the addresses to array when senders are sends enough eth.", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder on cheaperWithdraw func.", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // burada kontrata aktarılan ücreti atıyoruz.
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // burada ise yatırımcının başlangıçta bulunan bakiyesini atıyoruz.

                  const transactionResponse = await fundMe.cheaperWithdraw() // FundMe kontratında bulunan withdraw fonksiyonunu çalıştırıyoruz.
                  const transactionReceipt = await transactionResponse.wait(1) // 1 blok kadar bekliyoruz.
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // Receipt içerisinde birçok bilgiyi barındırdığı gibi gasUsed ve effectiveGasPrice miktarlarını da depoluyor.
                  const totalGasCost = gasUsed.mul(effectiveGasPrice) // Toplam harcanan gas miktarını harcamak için "bigNumber" da bulunan ".mul" çarpım fonksiyonunu kullanıyoruz.

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) // withdraw işlemi gerçekleştikten sonra kontratta bulunan miktarı atıyoruz.
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // withdraw işlemi geçrekleştikten sonra yatırımcıda bulunan bakiyeyi atıyoruz.

                  assert.equal(endingFundMeBalance, 0) // en son kontrattan para çekildikten sonra kontratta bulunan bakiye 0 olmalı. Kontrol ediyoruz.
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  ) // başlangıçta kontratta bulunan ve yatırımcıda bulunan paranın toplamıyla sonda yatırımcıda ve harcanan gas ücretinin aynı olmasını bekliyoruz.
                  // ".toString" kullanılmasının amacı büyük sayılarla uğraşırken daha doğru kontrol sağlamak.
              })
              /* it("allow us to withdraw with multiple accounts", async function () {
            const accounts = await ethers.getSigners()
            for (i = 1; i < 5; i++) {
                const fundMeConnectedAccount = await fundMe.connect(accounts[i])
                await fundMeConnectedAccount.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const totalGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingDeployerBalance.add(startingFundMeBalance).toString(),
                endingDeployerBalance.add(totalGasCost).toString()
            )
            for (i = 1; i < 5; i++) {
                assert.equal(
                    await fundMe.getAmountFunded(accounts[i].address),
                    0
                )
            }
        }) */
              it("Only allow the owner to withdraw on cheaperWithdraw func.", async function () {
                  const attackers = await ethers.getSigners()
                  const attacker = attackers[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("allow us to withdraw with multiple accounts on cheaperWithdraw func.", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 5; i++) {
                      const fundMeConnectedAccount = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedAccount.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const totalGasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(totalGasCost).toString()
                  )
                  for (i = 1; i < 5; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })
          })
      })
