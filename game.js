"use strict"

let fishingTimer = 0
let currentFish = ""
let fishList = new Map()
let money = 0
let textTimer = 0
let fishes = {
    perch: {
        name: "Perch",
        minXp: 3,
        xpRange: 1,
        sellPrice: 2
    },
    shrimp: {
        name: "Shrimp",
        minXp: 6,
        xpRange: 2,
        sellPrice: 5
    },
    catfish: {
        name: "Catfish",
        minXp: 9,
        xpRange: 2,
        sellPrice: 8
    },
    whitefish: {
        name: "Whitefish",
        minXp: 14,
        xpRange: 4,
        sellPrice: 12
    },
    walleye: {
        name: "Walleye",
        minXp: 16,
        xpRange: 5,
        sellPrice: 13
    }
}
let tools = {
    woodenSpear: {
        name: "Wooden Spear",
        minRoll: 0,
        rollRange: 25,
        minCatch: 1,
        catchRange: 1,
        cooldown: 3
    },
    devTool: {
        name: "???",
        minRoll: 0,
        rollRange: 300,
        minCatch: 11,
        catchRange: 11,
        cooldown: 0.2
    }
}
let curTool = "devTool"
const fishNames = ["perch", "shrimp", "catfish", "whitefish", "walleye"]

fishList.set("perch", 0)
fishList.set("shrimp", 0)
fishList.set("catfish", 0)
fishList.set("whitefish", 0)
fishList.set("walleye", 0)

function $(m) { return document.getElementById(m) }

function setCookie(name, value) {
    const d = new Date()
    d.setTime(d.getTime() + 31536000000) // saving this for a year
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`
    console.log(`${name}=${value};expires=${d.toUTCString()};path=/`)
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

document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { // look at me, being considerate of macOS for once
        e.preventDefault()
        setCookie("money", money)
        setCookie("perch", fishList.get("perch"))
        setCookie("shrimp", fishList.get("shrimp"))
        setCookie("catfish", fishList.get("catfish"))
        setCookie("whitefish", fishList.get("whitefish"))
        setCookie("walleye", fishList.get("walleye"))
    }
})

function sumFish() {
    let sum = 0
    fishList.forEach((v) => { sum += v })
    return sum
}

function sumFishSell() {
    let sum = 0
    fishList.forEach((v, k) => {
        sum += fishes[k].sellPrice * v
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
        $("fishList").innerHTML += `<li>${v} ${k}</li>`
    })
}

function catchFish() {
    let roll = []
    let catchAmount = Math.floor(Math.random() * tools[curTool].catchRange + tools[curTool].minCatch + 1)
    let af = $("addFish")
    af.innerHTML = ""

    for (let i = 0; i < catchAmount; i++) {
        roll.push(Math.floor(Math.random() * tools[curTool].rollRange + tools[curTool].minRoll + 1))
        roll[i] = pickFish(roll[i])

        if (roll[i] !== "nothing") {
            fishList.set(roll[i], fishList.get(roll[i]) + 1)
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
        timer(tools[curTool].cooldown)
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

    fishList.set("perch", 0)
    fishList.set("shrimp", 0)
    fishList.set("catfish", 0)
    fishList.set("whitefish", 0)
    fishList.set("walleye", 0)
    updateFishList()
}

function init() {
    // load save data
    const lastSavedMoney = Number.parseInt(getCookie("money"))
    const lastSavedPerch = Number.parseInt(getCookie("perch"))
    const lastSavedShrimp = Number.parseInt(getCookie("shrimp"))
    const lastSavedCatfish = Number.parseInt(getCookie("catfish"))
    const lastSavedWhitefish = Number.parseInt(getCookie("whitefish"))
    const lastSavedWalleye = Number.parseInt(getCookie("walleye"))
    if (lastSavedMoney !== "") {
        money = lastSavedMoney
        $("money").innerHTML = `You have $${money}`
    }
    if (lastSavedPerch !== "") {
        fishList.set("perch", lastSavedPerch)
    }
    if (lastSavedShrimp !== "") {
        fishList.set("perch", lastSavedShrimp)
    }
    if (lastSavedCatfish !== "") {
        fishList.set("perch", lastSavedCatfish)
    }
    if (lastSavedWhitefish !== "") {
        fishList.set("perch", lastSavedWhitefish)
    }
    if (lastSavedWalleye !== "") {
        fishList.set("perch", lastSavedWalleye)
    }
    updateFishList()

    // other stuff yknow
    $("toolName").innerHTML = tools[curTool].name
    $("toolPower").innerHTML = `${tools[curTool].rollRange / 2 + tools[curTool].minRoll} fishing power`
    $("toolCooldown").innerHTML = `${tools[curTool].cooldown}s cooldown`
    $("toolAvgCatch").innerHTML = `${tools[curTool].catchRange / 2 + tools[curTool].minCatch} fish caught on average`
    $("toolFishPerSec").innerHTML = `${1 / tools[curTool].cooldown * (tools[curTool].catchRange / 2 + tools[curTool].minCatch)} fish/s`

    fishList.forEach((v, k) => {
        $("fishList").innerHTML += `<li>${v} ${k}</li>`
    })
}