"use strict"

const internalVer = "0.2023.06.10.08"
let currentFish = "", fishList = new Map(), toolList = new Map(), fishingTimer = 0, money = 0, textTimer = 0, researchTier = 0, researchCentreTier = 0, researchXp = 0, nextResearchReq = 600, numAccuracy = 1

class Fish {
    constructor(xp, sellPrice, quantity, tier, countable = false) {
        this.xp = xp
        this.sellPrice = sellPrice
        this.quantity = quantity
        this.tier = tier
        this.countable = countable
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

/*class IdleTool {
    constructor(name, minRoll, rollRange, tickChance, capacity, cost, unlocked, owned, buyFunc) {
        this.name = name
        this.minRoll = minRoll
        this.rollRange = rollRange
        this.tickChance = tickChance
        this.curFish = []
        this.capacity = capacity
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

        $("netContent").appendChild(div)
    }
}*/

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
const fishNames = ["perch", "prawn", "catfish", "whitefish", "walleye", "salmon", "eel", "basa"]

const buyables = [
    new Buyable("rcTier1", 300, () => {
        researchCentreTier++
        showResearch()
        document.querySelector("#research .buyButton p[name='price']").innerHTML = "Owned" // this is just an excuse to try using queryselector more
    }, false)
]

fishList.set("perch", new Fish(3, 2, 0, 1))
fishList.set("prawn", new Fish(6, 5, 0, 2, true))
fishList.set("catfish", new Fish(10, 8, 0, 3))
fishList.set("whitefish", new Fish(14, 12, 0, 4))
fishList.set("walleye", new Fish(19, 13, 0, 5))
fishList.set("salmon", new Fish(25, 18, 0, 6))
fishList.set("eel", new Fish(32, 20, 0, 7, true))
fishList.set("basa", new Fish(40, 25, 0, 8))

toolList.set("woodenSpear", new Tool("Wooden Spear", 0, 30, 1, 1, 8, 0, true, true, () => { $("woodenSpearPrice").innerHTML = "Owned" }))
toolList.set("flintSpear", new Tool("Flint Spear", 5, 80, 2, 1, 7.5, 80, true, false, () => { $("flintSpearPrice").innerHTML = "Owned" }))
toolList.set("copperSpear", new Tool("Copper Spear", 20, 130, 2, 2, 6, 350, false, false, () => { $("copperSpearPrice").innerHTML = "Owned" }))
toolList.set("bronzeSpear", new Tool("Bronze Spear", 60, 240, 4, 1, 5, 1200, false, false, () => { $("bronzeSpearPrice").innerHTML = "Owned" }))
toolList.set("steelSpear", new Tool("Steel Spear", 140, 510, 4, 2, 4.5, 8800, false, false, () => { $("steelSpearPrice").innerHTML = "Owned" }))
toolList.set("badRod", new Tool("Makeshift Rod", 10, 60, 1, 2, 4, 150, false, false, () => { $("badRodPrice").innerHTML = "Owned" }))
toolList.set("mapleRod", new Tool("Maple Rod", 25, 95, 2, 1, 3.8, 480, false, false, () => { $("mapleRodPrice").innerHTML = "Owned" }))
toolList.set("bambooRod", new Tool("Bamboo Rod", 60, 130, 2, 2, 3.6, 900, false, false, () => { $("bambooRodPrice").innerHTML = "Owned" }))
toolList.set("graphRod", new Tool("Graphite Rod", 120, 400, 3, 2, 3.4, 3500, false, false, () => { $("graphRodPrice").innerHTML = "Owned" }))
toolList.set("fiberRod", new Tool("Fiberglass Rod", 180, 570, 5, 2, 3.2, 15000, false, false, () => { $("fiberRodPrice").innerHTML = "Owned" }))
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
        fish = "prawn"
    } else if (roll <= 130) {
        fish = "catfish"
    } else if (roll <= 210) {
        fish = "whitefish"
    } else if (roll <= 310) {
        fish = "walleye"
    } else if (roll <= 430) {
        fish = "salmon"
    } else if (roll <= 570) {
        fish = "eel"
    } else {
        fish = "basa"
    }
    return fish
}

function updateFishList() {
    $("fishList").innerHTML = ""

    fishList.forEach((v, k) => {
        const str = (!v.countable || v.quantity == 1) ? `${v.quantity} ${k}` : `${v.quantity} ${k}s`
        $("fishList").innerHTML += `<li>${str}</li>`
    })
}

function updateToolInfo() {
    const nothingChance = toolList.get(curTool).minRoll > 10 ? 1 : 1 - ((10 - toolList.get(curTool).minRoll) / (toolList.get(curTool).minRoll + toolList.get(curTool).rollRange)) ** (toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch)
    const avgFish = (toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch) * nothingChance

    $("toolName").innerHTML = toolList.get(curTool).name
    $("toolPower").innerHTML = `${toolList.get(curTool).minRoll} - ${toolList.get(curTool).rollRange + toolList.get(curTool).minRoll} fishing power`
    $("toolCooldown").innerHTML = `${toolList.get(curTool).cooldown}s cooldown`
    $("toolAvgCatch").innerHTML = `${+avgFish.toFixed(numAccuracy)} fish caught on average`
    $("toolFishPerSec").innerHTML = `${+(1 / toolList.get(curTool).cooldown * avgFish).toFixed(numAccuracy)} fish/s`
}

function catchFish() {
    let roll = []
    let catchAmount = Math.floor(Math.random() * (toolList.get(curTool).catchRange + 1) + toolList.get(curTool).minCatch)
    let af = $("addFish")
    af.innerHTML = ""
    const rodSpr = document.querySelector("img.rod")

    rodSpr.src = `assets/tools/${curTool}.png`

    rodSpr.style.right = "0px"
    rodSpr.style.bottom = "0px"

    for (let i = 0; i < catchAmount; i++) {
        roll.push(Math.floor(Math.random() * toolList.get(curTool).rollRange + toolList.get(curTool).minRoll + 1))
        roll[i] = pickFish(roll[i])

        if (roll[i] !== "nothing") {
            fishList.get(roll[i]).add(1)
        }
    }
    let newFish = []

    for (let i = 0; i < fishNames.length; i++) {
        newFish[i] = 0
    }

    for (let i = 0; i < roll.length; i++) {
        switch (roll[i]) {
            case "perch":
                newFish[0]++
                break
            case "prawn":
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
            case "salmon":
                newFish[5]++
                break
            case "eel":
                newFish[6]++
                break
            case "basa":
                newFish[7]++
                break
        }
        if (researchCentreTier !== 0 && roll[i] !== "nothing") {
            researchXp += fishList.get(roll[i]).tier ** 2 + 9 * researchCentreTier ** 3

            if (researchXp >= nextResearchReq) {
                researchXp -= nextResearchReq
                increaseResearchTier(true)
            }
            showResearch()
        }
    }

    let addedFishes = 0
    for (let i = 0; i < newFish.length; i++) {
        if (newFish[i] !== 0) {
            addedFishes++
            af.innerHTML += `<li>${newFish[i]} ${fishNames[i]}</li>`
        } else {
            af.innerHTML += "<li style='list-style-type:\" \"'></li>" // this is one of the greatest workarounds to any problem ever
        }
    }
    if (addedFishes === 0) {
        $("moneyGain").innerHTML = "You caught nothing :("
    }
    else {
        $("moneyGain").innerHTML = ""
    }
    updateFishList()

    rodSpr.style.visibility = "visible"
}

function timer(time) {
    if (time > 0) {
        $("timer").innerHTML = `Wait ${time.toFixed(numAccuracy)} seconds before casting again.`
        setTimeout(timer, 10, time - 0.01)
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
    fishList.get("prawn").sell()
    fishList.get("catfish").sell()
    fishList.get("whitefish").sell()
    fishList.get("walleye").sell()
    fishList.get("salmon").sell()
    fishList.get("eel").sell()
    fishList.get("basa").sell()
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

function increaseResearchTier(showBox = false) {
    researchTier++
    nextResearchReq = (nextResearchReq * (2 + 1 / (researchTier + 1))).toFixed(0)
    let researchContent
    
    switch (researchTier) {
        case 1:
            toolList.get("copperSpear").unlock()
            researchContent = "<li>Copper Spear</li>"
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
            document.querySelector(".storeTabs").appendChild(div)

            researchContent = "<li>Makeshift Rod</li><li>Maple Rod</li><li>Bamboo Rod</li>"
            break
        case 3:
            toolList.get("bronzeSpear").unlock()
            researchContent = "<li>Bronze Spear</li>"
            break
        case 4:
            toolList.get("graphRod").unlock()
            researchContent = "<li>Graphite Rod</li>"
            break
        case 5:
            toolList.get("steelSpear").unlock()
            researchContent = "<li>Steel Spear</li>"
            break
        case 6:
            toolList.get("fiberRod").unlock()
            researchContent = "<li>Fiberglass Rod</li>"
            break
    }
    if (document.querySelector(".resResult") !== null) {
        document.querySelector(".middle").removeChild(document.querySelector(".resResult"))
    }

    if (showBox) {
        const researchResults = dialogBox("resResult", `<h1>Research Lvl ${researchTier}</h1><p>You unlocked: </p><ul>${researchContent}</ul>`)
        document.querySelector(".middle").appendChild(researchResults)
        setTimeout(() => { document.querySelector(".middle").removeChild(researchResults) }, 10000)
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

function dialogBox(cssClass, content) {
    const div = document.createElement("div")
    div.className = cssClass
    div.innerHTML = content
    return div
}

function wipeSave() {
    localStorage.clear()
    const warning = dialogBox("saveBox", "<h1>Save deleted!</h1><p>If you didn't mean to wipe your progress (for whatever reason),<br>save again to keep it. If you <strong>did</strong> mean to wipe your save file,<br>restart for changes to take effect.</p>")
    document.querySelector("body").appendChild(warning)
    setTimeout(() => { document.querySelector("body").removeChild(warning) }, 10000)
}

function loadSave() {
    const lsAcc = lg("numAcc")
    const lsMoney = lg("money")
    const lsRXP = lg("researchXp")
    const lsRT = lg("researchTier")
    const lsRC = lg("rcOwned")
    const lsFlintSpear = lg("flintSpearOwned")
    const lsCopperSpear = lg("copperSpearOwned")
    const lsBronzeSpear = lg("bronzeSpearOwned")
    const lsSteelSpear = lg("steelSpearOwned")
    const lsBadRod = lg("badRodOwned")
    const lsMapleRod = lg("mapleRodOwned")
    const lsBambooRod = lg("bambooRodOwned")
    const lsGraphRod = lg("graphRodOwned")
    const lsFiberRod = lg("fiberRodOwned")
    const lsTool = lg("curTool")
    const lsCD = lg("cooldown")
    const lsPerch = lg("perch")
    const lsShrimp = lg("shrimp")
    const lsCatfish = lg("catfish")
    const lsWhitefish = lg("whitefish")
    const lsWalleye = lg("walleye")
    const lsSalmon = lg("salmon")
    const lsEel = lg("eel")
    const lsBasa = lg("basa")

    // this is giving isEven() vibes
    if (lsAcc !== null) {
        numAccuracy = Number.parseInt(lsAcc)
    }
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
    if (lsRC === "true") {
        buyables[0].owned = true
        buyables[0].buyFunc()
    }
    if (lsFlintSpear === "true") { // why is localstorage like this
        toolList.get("flintSpear").owned = true
        selectTool("flintSpear")
    }
    if (lsCopperSpear === "true") {
        toolList.get("copperSpear").owned = true
        selectTool("copperSpear")
    }
    if (lsBronzeSpear === "true") {
        toolList.get("bronzeSpear").owned = true
        selectTool("bronzeSpear")
    }
    if (lsSteelSpear === "true") {
        toolList.get("steelSpear").owned = true
        selectTool("steelSpear")
    }
    if (lsBadRod === "true") {
        toolList.get("badRod").owned = true
        selectTool("badRod")
    }
    if (lsMapleRod === "true") {
        toolList.get("mapleRod").owned = true
        selectTool("mapleRod")
    }
    if (lsBambooRod === "true") {
        toolList.get("bambooRod").owned = true
        selectTool("bambooRod")
    }
    if (lsGraphRod === "true") {
        toolList.get("graphRod").owned = true
        selectTool("graphRod")
    }
    if (lsFiberRod === "true") {
        toolList.get("fiberRod").owned = true
        selectTool("fiberRod")
    }
    if (lsTool !== null) {
        $("woodenSpearPrice").innerHTML = "Owned"
        selectTool(lsTool)
    }
    if (lsCD !== null) {
        fishingTimer = lsCD
        timer(+fishingTimer)
    }
    if (lsPerch !== null) {
        fishList.get("perch").quantity = Number.parseInt(lsPerch)
    }
    if (lsShrimp !== null) {
        fishList.get("prawn").quantity = Number.parseInt(lsShrimp)
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
    if (lsSalmon !== null) {
        fishList.get("salmon").quantity = Number.parseInt(lsSalmon)
    }
    if (lsEel !== null) {
        fishList.get("eel").quantity = Number.parseInt(lsEel)
    }
    if (lsBasa !== null) {
        fishList.get("basa").quantity = Number.parseInt(lsBasa)
    }
}

function createSave() {
    ls("numAcc", numAccuracy)
    ls("money", money)
    ls("researchXp", researchXp)
    ls("researchTier", researchTier)
    ls("rcOwned", buyables[0].owned)
    ls("flintSpearOwned", toolList.get("flintSpear").owned)
    ls("copperSpearOwned", toolList.get("copperSpear").owned)
    ls("bronzeSpearOwned", toolList.get("bronzeSpear").owned)
    ls("steelSpearOwned", toolList.get("steelSpear").owned)
    ls("badRodOwned", toolList.get("badRod").owned)
    ls("mapleRodOwned", toolList.get("mapleRod").owned)
    ls("bambooRodOwned", toolList.get("bambooRod").owned)
    ls("graphRodOwned", toolList.get("graphRod").owned)
    ls("fiberRodOwned", toolList.get("fiberRod").owned)
    ls("curTool", curTool)
    ls("cooldown", fishingTimer)
    ls("perch", fishList.get("perch").quantity)
    ls("shrimp", fishList.get("prawn").quantity)
    ls("catfish", fishList.get("catfish").quantity)
    ls("whitefish", fishList.get("whitefish").quantity)
    ls("walleye", fishList.get("walleye").quantity)
    ls("salmon", fishList.get("salmon").quantity)
    ls("eel", fishList.get("eel").quantity)
    ls("basa", fishList.get("basa").quantity)

    const save = dialogBox("saveBox", "<p>Game saved!</p>")
    document.querySelector("body").appendChild(save)
    setTimeout(() => { document.querySelector("body").removeChild(save) }, 2000)
}

document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { // look at me, being considerate of macOS for once
        e.preventDefault()

        createSave()
    } if (e.key === "Tab") {
        e.preventDefault()
    }
})

function closeSettings(e) {
    const settings = document.querySelector(".settingsBox")
    if (settings !== null) {
        if (!settings.contains(e.target) && !document.querySelector(".settings").contains(e.target)) {
            document.querySelector("body").removeChild(document.querySelector(".settingsBox"))
            document.removeEventListener("click", closeSettings)
        }
    }
}
 
function openSettings() {
    if (document.querySelector(".settingsBox") === null) {
        const settings = dialogBox("settingsBox", "<h1>Options</h1><button onclick=createSave()>Save</button><button class='danger' onclick=wipeSave()>Delete save</button><br><input type='checkbox' id='highNumAcc' onclick=updateSettings()><label for='highNumAcc'>Higher decimal accuracy</label>")
        document.querySelector("body").appendChild(settings)
        settings.querySelector("#highNumAcc").checked = (numAccuracy === 2)

        document.addEventListener("click", closeSettings)
    }
}

function updateSettings() {
    numAccuracy = ($("highNumAcc").checked) ? 2 : 1
    updateToolInfo()
}

/*function exampleSave() {
    ls("money", 10004)
    ls("researchXp", 230000)
    ls("researchTier", 5)
    ls("rcOwned", true)
    ls("flintSpearOwned", true)
    ls("copperSpearOwned", true)
    ls("bronzeSpearOwned", true)
    ls("steelSpearOwned", true)
    ls("badRodOwned", false)
    ls("mapleRodOwned", true)
    ls("bambooRodOwned", true)
    ls("graphRodOwned", true)
    ls("fiberRodOwned", false)
    ls("curTool", "steelSpear")
    ls("perch", 0)
    ls("shrimp", 2)
    ls("catfish", 14)
    ls("whitefish", 19)
    ls("walleye", 0)
}*/