"use strict"

const internalVer = "2023.04.29.16"
let currentFish = "", fishList = new Map(), toolList = new Map(), fishingTimer = 0, money = 0, textTimer = 0, researchTier = 0, researchCentreTier = 0, researchXp = 0, nextResearchReq = 600

class Fish {
    constructor(minXp, xpRange, sellPrice, quantity, tier) {
        this.minXp = minXp
        this.xpRange = xpRange
        this.sellPrice = sellPrice
        this.quantity = quantity
        this.tier = tier
    }
    add(amount) {
        this.quantity += amount
        return this.quantity
    }
    sell() {
        const temp = this.quantity
        this.quantity = 0
        return temp
    }
}

class Tool {
    constructor(name, minRoll, rollRange, minCatch, catchRange, cooldown, cost, unlocked, owned, buyFunc) {
        this.name = name
        this.minRoll = minRoll
        this.rollRange = rollRange
        this.minCatch = minCatch
        this.catchRange = catchRange
        this.cooldown = cooldown
        this.cost = cost
        this.unlocked = unlocked
        this.owned = owned
        this.buyFunc = buyFunc
    }
    buy() {
        if (!this.owned && money >= this.cost) {
            money -= this.cost
            this.owned = true
            updateMoney()
            this.buyFunc()
        }
    }
    unlock() {
        this.unlocked = true
        const div = document.createElement("div")
        div.className = "buyButton"
        div.addEventListener("click", () => { selectTool(findToolName(this.name)) })
        div.innerHTML = `<p>${this.name}</p><p id=${findToolName(this.name)}Price>$${this.cost}</p>`

        if (this.name.includes("Spear")) {
            $("spearContent").appendChild(div)
        } else if (this.name.includes("Rod")) {
            $("rodContent").appendChild(div)
        }
    }
}

class Buyable {
    constructor(name, cost, buyFunc, owned) {
        this.name = name
        this.cost = cost
        this.buyFunc = buyFunc
        this.owned = owned
    }
    buy() {
        if (!this.owned && this.cost <= money) {
            money -= this.cost
            updateMoney()
        }
        this.owned = true
        this.buyFunc()
    }
}

let curTool = "woodenSpear"
const fishNames = ["perch", "shrimp", "catfish", "whitefish", "walleye"]

const buyables = [
    new Buyable("rcTier1", 300, () => {
        researchCentreTier++
        showResearch()
        document.querySelector("#research .buyButton p[name='price']").innerHTML = "Owned" // this is just an excuse to try using queryselector more
    }, false)
]

fishList.set("perch", new Fish(3, 1, 2, 0, 1))
fishList.set("shrimp", new Fish(6, 2, 5, 0, 2))
fishList.set("catfish", new Fish(9, 2, 8, 0, 3))
fishList.set("whitefish", new Fish(14, 4, 12, 0, 4))
fishList.set("walleye", new Fish(16, 5, 13, 0, 5))

toolList.set("woodenSpear", new Tool("Wooden Spear", 0, 30, 1, 1, 8, 0, true, true, () => { $("woodenSpearPrice").innerHTML = "Owned" }))
toolList.set("flintSpear", new Tool("Flint Spear", 5, 80, 2, 1, 7.5, 80, true, false, () => { $("flintSpearPrice").innerHTML = "Owned" }))
toolList.set("copperSpear", new Tool("Copper Spear", 20, 130, 2, 2, 6, 350, false, false, () => { $("copperSpearPrice").innerHTML = "Owned" }))
toolList.set("bronzeSpear", new Tool("Bronze Spear", 50, 300, 4, 1, 5, 1200, false, false, () => { $("bronzeSpearPrice").innerHTML = "Owned" }))
toolList.set("badRod", new Tool("Makeshift Rod", 10, 60, 1, 2, 4, 150, false, false, () => { $("badRodPrice").innerHTML = "Owned" }))
toolList.set("mapleRod", new Tool("Maple Rod", 30, 90, 2, 1, 3.8, 500, false, false, () => { $("mapleRodPrice").innerHTML = "Owned" }))
toolList.set("bambooRod", new Tool("Bamboo Rod", 60, 140, 2, 2, 3.6, 950, false, false, () => { $("bambooRodPrice").innerHTML = "Owned" }))
//toolList.set("devTool", new Tool("???", 0, 300, 11, 11, 0.2, 64, false, true, () => { console.log("i see.") }))

function findToolName(name) {
    for (const [k, v] of toolList) {
        if (name === v.name) {
            return k
        }
    }
}

function $(m) { return document.getElementById(m) }
function updateMoney() { $("money").innerHTML = `You have $${money}` }
function ls(k, v) { localStorage.setItem(k, v) }
function lg(k) { return localStorage.getItem(k) }

function sumFish() {
    let sum = 0
    fishList.forEach((v) => { sum += v.quantity })
    return sum
}

function sumFishSell() {
    let sum = 0
    fishList.forEach((v) => {
        sum += v.sellPrice * v.quantity
    })
    return sum
}

function pickFish(roll) {
    let fish
    if (roll <= 10) {
        fish = "nothing"
    } else if (roll <= 30) {
        fish = "perch"
    } else if (roll <= 70) {
        fish = "shrimp"
    } else if (roll <= 130) {
        fish = "catfish"
    } else if (roll <= 210) {
        fish = "whitefish"
    } /*else if (roll <= 310) {
        fish = "walleye"
    }*/ else {
        fish = "walleye"
    }
    return fish
}

function updateFishList() {
    $("fishList").innerHTML = ""

    fishList.forEach((v, k) => {
        $("fishList").innerHTML += `<li>${v.quantity} ${k}</li>`
    })
}

function updateToolInfo() {
    $("toolName").innerHTML = toolList.get(curTool).name
    $("toolPower").innerHTML = `${+(toolList.get(curTool).rollRange / 2 + toolList.get(curTool).minRoll).toFixed(2)} fishing power`
    $("toolCooldown").innerHTML = `${toolList.get(curTool).cooldown}s cooldown`
    $("toolAvgCatch").innerHTML = `${+(toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch).toFixed(2)} fish caught on average`
    $("toolFishPerSec").innerHTML = `${+(1 / toolList.get(curTool).cooldown * (toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch)).toFixed(2)} fish/s`
}

function catchFish() {
    let roll = []
    let catchAmount = Math.floor(Math.random() * toolList.get(curTool).catchRange + toolList.get(curTool).minCatch + 1)
    let af = $("addFish")
    af.innerHTML = ""

    document.querySelector("img.rod").src = `assets/tools/${curTool}.png`

    for (let i = 0; i < catchAmount; i++) {
        roll.push(Math.floor(Math.random() * toolList.get(curTool).rollRange + toolList.get(curTool).minRoll + 1))
        roll[i] = pickFish(roll[i])

        if (roll[i] !== "nothing") {
            fishList.get(roll[i]).add(1)
        }
    }
    let newFish = [0, 0, 0, 0, 0]
    for (let i = 0; i < roll.length; i++) {
        switch (roll[i]) {
            case "perch":
                newFish[0]++
                break
            case "shrimp":
                newFish[1]++
                break
            case "catfish":
                newFish[2]++
                break
            case "whitefish":
                newFish[3]++
                break
            case "walleye":
                newFish[4]++
                break
        }
        if (researchCentreTier !== 0 && roll[i] !== "nothing") {
            researchXp += fishList.get(roll[i]).tier ** 2 + 9 * researchCentreTier ** 3

            if (researchXp >= nextResearchReq) {
                researchXp -= nextResearchReq
                increaseResearchTier()
            }
            showResearch()
        }
    }
    for (let i = 0; i < 5; i++) {
        if (newFish[i] !== 0) {
            af.innerHTML += `<li>${newFish[i]} ${fishNames[i]}</li>`
        } else {
            af.innerHTML += "<li style='list-style-type:\" \"'></li>" // this is one of the greatest workarounds to any problem ever
        }
    }
    updateFishList()

    document.querySelector("img.rod").style.visibility = "visible"
}

function timer(time) {
    if (time > 0) {
        $("timer").innerHTML = `Wait ${time.toFixed(1)} seconds before casting again.`
        setTimeout(timer, 100, time - 0.1)
    } else {
        $("timer").innerHTML = `Ready to cast!`
        document.querySelector("img.rod").style.visibility = "hidden"
    }
    fishingTimer = time
}

function fish() {
    if (fishingTimer <= 0) {
        catchFish()
        timer(toolList.get(curTool).cooldown)
    }
}

function sell() {
    const moneyBefore = money
    money += sumFishSell()
    if (money === moneyBefore) {
        $("moneyGain").innerHTML = "You don't have any fish to sell."
        return
    }
    $("moneyGain").innerHTML = `You sold ${sumFish()} fish to earn $${sumFishSell()}!`
    $("money").innerHTML = `You have $${money}`
    $("addFish").innerHTML = ""

    fishList.get("perch").sell()
    fishList.get("shrimp").sell()
    fishList.get("catfish").sell()
    fishList.get("whitefish").sell()
    fishList.get("walleye").sell()
    updateFishList()
}

function buy(item) {
    for (let i = 0; i < buyables.length; i++) {
        if (buyables[i].name === item) {
            buyables[i].buy()
        }
    }
}

function changeShop(tab) {
    const t = document.getElementsByClassName("storeTab")

    for (let i = 0; i < t.length; i++) {
        t[i].style.display = "none"
    }
    $(tab).style.display = "block"
}

function increaseResearchTier() {
    researchTier++
    nextResearchReq *= ((researchTier + 1) * 3 + 1) / (researchTier + 1)
    
    switch (researchTier) {
        case 1:
            toolList.get("copperSpear").unlock()
            break
        case 2:
            toolList.get("badRod").unlock()
            toolList.get("mapleRod").unlock()
            toolList.get("bambooRod").unlock()

            const div = document.createElement("div")
            div.innerHTML = "Rods"
            div.id = "rods"
            div.addEventListener("click", () => (changeShop("rodContent")))
            $("rodContent").style.display = "none"
            document.getElementsByClassName("storeTabs")[0].appendChild(div)
            break
        case 3:
            toolList.get("bronzeSpear").unlock()
            break
    }
}

function showResearch() {
    let p = $("researchDisp")
    let tier = $("researchTierDisp")
    if (p === null) {
        p = document.createElement("p")
        p.id = "researchDisp"
        $("research").appendChild(p)
    }
    if (tier === null) {
        tier = document.createElement("p")
        tier.id = "researchTierDisp"
        $("research").appendChild(tier)
    }
    
    p.innerHTML = `${researchXp} / ${nextResearchReq} to next level`
    tier.innerHTML = `Level ${researchTier}`
}

function selectTool(item) {
    if (!toolList.get(item).owned) {
        toolList.get(item).buy()
    } else {
        $(`${curTool}Price`).innerHTML = "Owned"
        curTool = item
        $(`${curTool}Price`).innerHTML = "Selected!"
        updateToolInfo()
    }
}

function init() {
    loadSave()

    updateToolInfo()
    updateFishList()
    updateMoney()
}

function wipeSave() { localStorage.clear() }

function loadSave() {
    const lsMoney = lg("money")
    const lsRXP = lg("researchXp")
    const lsRT = lg("researchTier")
    const lsRC = lg("rcOwned")
    const lsFlintSpear = lg("flintSpearOwned")
    const lsCopperSpear = lg("copperSpearOwned")
    const lsBronzeSpear = lg("bronzeSpearOwned")
    const lsBadRod = lg("badRodOwned")
    const lsMapleRod = lg("mapleRodOwned")
    const lsBambooRod = lg("bambooRodOwned")
    const lsTool = lg("curTool")
    const lsPerch = lg("perch")
    const lsShrimp = lg("shrimp")
    const lsCatfish = lg("catfish")
    const lsWhitefish = lg("whitefish")
    const lsWalleye = lg("walleye")

    if (lsMoney !== null) {
        money = Number.parseInt(lsMoney)
    }
    if (lsRXP !== null) {
        researchXp = Number.parseInt(lsRXP)
    }
    if (lsRT !== null) {
        for (let i = 0; i < Number.parseInt(lsRT); i++) {
            increaseResearchTier()
        }
    }
    if (lsRC !== null) {
        buyables[0].owned = (lsRC === "true")
        if (lsRC === "true") { buyables[0].buyFunc() }
    }
    if (lsFlintSpear !== null) {
        toolList.get("flintSpear").owned = (lsFlintSpear === "true")
        if (lsFlintSpear === "true") { selectTool("flintSpear") }
    }
    if (lsCopperSpear !== null) {
        toolList.get("copperSpear").owned = (lsCopperSpear === "true")
        if (lsCopperSpear === "true") { selectTool("copperSpear") }
    }
    if (lsBronzeSpear !== null) {
        toolList.get("bronzeSpear").owned = (lsBronzeSpear === "true")
        if (lsBronzeSpear === "true") { selectTool("bronzeSpear") }
    }
    if (lsBadRod !== null) {
        toolList.get("badRod").owned = (lsBadRod === "true")
        if (lsBadRod === "true") { selectTool("badRod") }
    }
    if (lsMapleRod !== null) {
        toolList.get("mapleRod").owned = (lsMapleRod === "true")
        if (lsMapleRod === "true") { selectTool("mapleRod") }
    }
    if (lsBambooRod !== null) {
        toolList.get("bambooRod").owned = (lsBambooRod === "true")
        if (lsBambooRod === "true") { selectTool("bambooRod") }
    }
    if (lsTool !== null) {
        $("woodenSpearPrice").innerHTML = "Owned"
        curTool = lsTool
        selectTool(curTool)
    }
    if (lsPerch !== null) {
        fishList.get("perch").quantity = Number.parseInt(lsPerch)
    }
    if (lsShrimp !== null) {
        fishList.get("shrimp").quantity = Number.parseInt(lsShrimp)
    }
    if (lsCatfish !== null) {
        fishList.get("catfish").quantity = Number.parseInt(lsCatfish)
    }
    if (lsWhitefish !== null) {
        fishList.get("whitefish").quantity = Number.parseInt(lsWhitefish)
    }
    if (lsWalleye !== null) {
        fishList.get("walleye").quantity = Number.parseInt(lsWalleye)
    }
}

// basically a save function lmao
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { // look at me, being considerate of macOS for once
        e.preventDefault()

        ls("money", money)
        ls("researchXp", researchXp)
        ls("researchTier", researchTier)
        ls("rcOwned", buyables[0].owned)
        ls("flintSpearOwned", toolList.get("flintSpear").owned)
        ls("copperSpearOwned", toolList.get("copperSpear").owned)
        ls("bronzeSpearOwned", toolList.get("bronzeSpear").owned)
        ls("badRodOwned", toolList.get("badRod").owned)
        ls("mapleRodOwned", toolList.get("mapleRod").owned)
        ls("bambooRodOwned", toolList.get("bambooRod").owned)
        ls("curTool", curTool)
        ls("perch", fishList.get("perch").quantity)
        ls("shrimp", fishList.get("shrimp").quantity)
        ls("catfish", fishList.get("catfish").quantity)
        ls("whitefish", fishList.get("whitefish").quantity)
        ls("walleye", fishList.get("walleye").quantity)

        const div = document.createElement("div")
        div.className = "saveBox"
        div.innerHTML = "<p>Game saved!<p>"
        document.querySelector("body").appendChild(div)
        setTimeout(() => { document.querySelector("body").removeChild(div) }, 2000)
    }
})

/*function exampleSave() {
    ls("money", 10004)
    ls("researchXp", 156)
    ls("researchTier", 3)
    ls("rcOwned", true)
    ls("flintSpearOwned", true)
    ls("copperSpearOwned", true)
    ls("bronzeSpearOwned", true)
    ls("badRodOwned", false)
    ls("mapleRodOwned", true)
    ls("bambooRodOwned", true)
    ls("curTool", "bambooRod")
    ls("perch", 0)
    ls("shrimp", 2)
    ls("catfish", 14)
    ls("whitefish", 19)
    ls("walleye", 0)
}*/