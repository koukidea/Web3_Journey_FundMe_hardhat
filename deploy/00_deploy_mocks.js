const { network } = require("hardhat")
const {
    developmentChains,
    DECIMAL,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        // Üzerine çalıştığımız zincirin hangi zincir olduğu sorgulanıyor
        // Eğer çalışılan zincir "hardhat" ya da "localhost" ise if statement'ının içine giriyor ve
        // Mock kontratı deploy ediliyor.
        // Mock Kontratı: Fake PriceFeed oluşturmamız için gerekli olan kontrattır. Bu sebepten ötürü çalışılan zincir
        // kontrol ediliyor.
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            // Burada deploy ettiğimiz kontrata tag atıyoruz.
            contract: "MockV3Aggregator", // "MockV3Aggregator" kontratın ismi olarak giriyoruz.
            from: deployer, // Kimden olduğunun bilgisini alıyoruz.
            log: true, // Deploy fonksiyonuna ait çıktıları görmek adına log: true yapılıyor.
            args: [DECIMAL, INITIAL_ANSWER], // MockV3Aggregator kontratı bizden iki değer bekliyor ve bunları atıyoruz.
        })
        log("Mocks deployed!")
        log("-------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
// Burada ise "yarn hardhat deploy" komutunda spesifik olarak bu scripti çalıştırmak için tag atıyoruz.
