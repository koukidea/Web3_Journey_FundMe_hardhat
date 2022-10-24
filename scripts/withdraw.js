const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const transactionResponse = await fundMe.cheaperWithdraw()
    await transactionResponse.wait(1)
    console.log("Withdraw function is called successfully!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
