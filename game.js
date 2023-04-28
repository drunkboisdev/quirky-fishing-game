"use strict"

const internalVer = "2023.04.28.10"
let currentFish = ""
let fishList = new Map()
let toolList = new Map()
let fishingTimer = 0, money = 0, textTimer = 0, researchTier = 0, researchCentreTier = 0, researchXp = 0

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
            this.owned = true
            updateMoney()
            this.buyFunc()
        }
    }
}

let curTool = "devTool"
const fishNames = ["perch", "shrimp", "catfish", "whitefish", "walleye"]

const buyables = [
    new Buyable("rcTier1", 400, () => {
        researchCentreTier++
        showResearch()
        document.querySelector("#research .buyButton p[name='price']").innerHTML = "Owned" // this is just an excuse to try using queryselector more
    })
]

fishList.set("perch", new Fish(3, 1, 2, 0, 1))
fishList.set("shrimp", new Fish(6, 2, 5, 0, 2))
fishList.set("catfish", new Fish(9, 2, 8, 0, 3))
fishList.set("whitefish", new Fish(14, 4, 12, 0, 4))
fishList.set("walleye", new Fish(16, 5, 13, 0, 5))

toolList.set("woodenSpear", new Tool("Wooden Spear", 0, 30, 1, 1, 8, 0, true, true, () => { $("woodenSpearPrice").innerHTML = "Owned" }))
toolList.set("flintSpear", new Tool("Flint Spear", 5, 80, 2, 1, 7.5, 120, true, false, () => { $("flintSpearPrice").innerHTML = "Owned" }))
toolList.set("copperSpear", new Tool("Copper Spear", 20, 130, 2, 2, 6, 500, false, false, () => { $("copperSpearPrice").innerHTML = "Owned" }))
toolList.set("badRod", new Tool("Makeshift Rod", 10, 60, 1, 2, 4, 220, false, false, () => { $("badRodPrice").innerHTML = "Owned" }))
toolList.set("mapleRod", new Tool("Maple Rod", 30, 90, 2, 1, 3.8, 750, false, false, () => { $("mapleRodPrice").innerHTML = "Owned" }))
toolList.set("bambooRod", new Tool("Bamboo Rod", 60, 140, 2, 2, 3.6, 1400, false, false, () => { $("bambooRodPrice").innerHTML = "Owned" }))
toolList.set("devTool", new Tool("???", 0, 300, 11, 11, 0.2, 64, false, true, () => { console.log("i see.") }))

function findToolName(name) {
    for (const [k, v] of toolList) {
        if (name === v.name) {
            return k
        }
    }
}

function $(m) { return document.getElementById(m) }
function updateMoney() { $("money").innerHTML = `You have $${money}` }

// doesn't work for whatever reason
function wipeSave() { document.cookies = "money=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; perch=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; shrimp=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; catfish=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; whitefish=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; walleye=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" }

function setCookie(name, value) {
    const d = new Date()
    d.setTime(d.getTime() + 31536000000) // saving this for a year
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`
}

function getCookie(name) {
    const cookie = decodeURIComponent(document.cookie)
    const ca = cookie.split(";")

    for (let i = 0; i < ca.length; i++) {
        while (ca[i].charAt(0) === " ") {
            ca[i] = ca[i].substring(1)
        }
        if (ca[i].indexOf(`${name}=`) === 0) {
            return ca[i].substring(`${name}=`.length, ca[i].length)
        }
    }
    return ""
}

function loadSave() { // i don't think this is the best way to do this but i'm tired so whatever
    const lastSavedMoney = getCookie("money")
    const lastSavedPerch = getCookie("perch")
    const lastSavedShrimp = getCookie("shrimp")
    const lastSavedCatfish = getCookie("catfish")
    const lastSavedWhitefish = getCookie("whitefish")
    const lastSavedWalleye = getCookie("walleye")
    if (lastSavedMoney !== "") {
        money = Number.parseInt(lastSavedMoney)
    }
    if (lastSavedPerch !== "") {
        fishList.get("perch").quantity = Number.parseInt(lastSavedPerch)
    }
    if (lastSavedShrimp !== "") {
        fishList.get("shrimp").quantity = Number.parseInt(lastSavedShrimp)
    }
    if (lastSavedCatfish !== "") {
        fishList.get("catfish").quantity = Number.parseInt(lastSavedCatfish)
    }
    if (lastSavedWhitefish !== "") {
        fishList.get("whitefish").quantity = Number.parseInt(lastSavedWhitefish)
    }
    if (lastSavedWalleye !== "") {
        fishList.get("walleye").quantity = Number.parseInt(lastSavedWalleye)
    }
}

// SAVING
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { // look at me, being considerate of macOS for once
        e.preventDefault()
        setCookie("money", money)
        setCookie("perch", fishList.get("perch").quantity)
        setCookie("shrimp", fishList.get("shrimp").quantity)
        setCookie("catfish", fishList.get("catfish").quantity)
        setCookie("whitefish", fishList.get("whitefish").quantity)
        setCookie("walleye", fishList.get("walleye").quantity)

        const div = document.createElement("div")
        div.className = "saveBox"
        div.innerHTML = "<p>Game saved!<p>"
        document.querySelector("body").appendChild(div)
        setTimeout(() => { document.querySelector("body").removeChild(div) }, 2000)
    }
})

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
    if (roll < 10) {
        fish = "nothing"
    } else if (roll < 30) {
        fish = "perch"
    } else if (roll < 70) {
        fish = "shrimp"
    } else if (roll < 130) {
        fish = "catfish"
    } else if (roll < 210) {
        fish = "whitefish"
    } else if (roll < 310) {
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

            if (researchXp >= 4 ** researchTier * 500) {
                researchXp -= 4 ** researchTier * 500
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
    console.log("shup")
    for (let i = 0; i < t.length; i++) {
        t[i].style.display = "none"
    }
    $(tab).style.display = "block"
}

function increaseResearchTier() {
    researchTier++
    
    switch (researchTier) {
        case 1:
            toolList.get("copperSpear").unlock()
            break
        case 2:
            toolList.get("badRod").unlock()
            toolList.get("mapleRod").unlock()
            toolList.get("bambooRod").unlock()
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
    
    p.innerHTML = `${researchXp} / ${4 ** researchTier * 500} to next level`
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