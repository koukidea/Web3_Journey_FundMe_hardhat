/* async function deployFunc(hre) {
    console.log("hello")
}

module.exports.default = deployFunc
 */

/* module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
}
 */

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId // hardhat sayesinde zincir numarasına ulaşıyoruz.

    // if chainId X use address Y
    // if chainId T use address K
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

    let ethUsdPriceFeedAddress // ethereum'un kaç dolar olduğunu bildiren adresini let olarak tanımlıyoruz
    // çünkü daha sonrasında değiştireceğiz.

    if (developmentChains.includes(network.name)) {
        // network.name bize local hostta olup olmadığımızı gösterecek.
        // eğer hardhat geri bildirimini verirse de buraya girecek.
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // MockV3Aggregator olarak deploy ettiğimiz
        // kontratı ethUsdAggregator'a eşitliyoruz.
        ethUsdPriceFeedAddress = ethUsdAggregator.address // daha sonrasında yukarıda atadığımız kontartın adresini alıyoruz.
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] // eğer localhost ya da hardhat üzerinde çalışılmıyorsa
        // oluşturmuş olduğumuz yardımcı hardhat config dosyasından chainId'ye denk gelen Price Feed adresini atıyoruz.
    }
    const args = [ethUsdPriceFeedAddress] // her argüman gereken yere ethUsdPriceFeedAddress yazmamak için değişken oluşturuyoruz.
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // kontratta bulunan constructor bizden PriceFeed Adresi girmemizi beklediği için
        // argüman olarak yukarıda atadığımz price feed adresini döndürüyoruz.
        waitConfirmations: network.config.blockConfirmations || 1, // || 1'in anlamı eğer blockConfirmation değeri yok ise en azından bir blok bekle anlamına gelir
        // Onaylama için beklememizin sebebi EtherScan'a işlemi indexleme şansı vermek istiyoruz.
        log: true, // burası ise FundMe'yi deploy ederken gerekli bilgileri konsola yazdırıyor.
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // if statement'ının içinde öncelikle "localhost"ta mıyız yoksa "hardhat" network'te miyiz onu kontrol ediyoruz
        // daha sonrasında EtherScan api key tanımlanmış mı onu kontrol edip sonrasında kontratı verify ediyoruz.
        await verify(fundMe.address, args) // oluşturmuş olduğumuz utilities dosyasında bulunan verify scripti araclığı ile kontratımızı verify ediyoruz.
    }
    log("----------------------------------------------------------") // böyle bir bitiriş yapıyoruz ki deploy'un bittiğini anlayalım.
}

module.exports.tags = ["all", "fundme"]
