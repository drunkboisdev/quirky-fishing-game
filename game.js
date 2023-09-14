"use strict"

const internalVer = "2023.09.05.01"; // track number of commits kinda? except not really because i forget sometimes (also git just does it for you)
let currentFish = "", fishingTimer = 0, fishStart = 0, money = 0, researchTier = 0, researchXp = 0, nextResearchReq = 500, numAccuracy = 1, curTool = "woodenSpear";
const fishList = new Map(), toolList = new Map();

// helper functions woohoo
function $(m) { return document.getElementById(m) }
function updateMoney() { $("money").innerHTML = `You have $${money}` }
//function ls(k, v) { localStorage.setItem(k, v) }
//function lg(k) { return localStorage.getItem(k) }

class Fish {
    constructor(name, sellPrice, quantity, tier, countable = false) {
        this.name = name;
        this.sellPrice = sellPrice;
        this.quantity = quantity;
        this.tier = tier;
        this.countable = countable;
    }
    add(amount) {
        this.quantity += amount;
        return this.quantity;
    }
    sell() {
        const temp = this.quantity;
        this.quantity = 0;
        return temp;
    }
}

class Tool {
    constructor(name, minRoll, rollRange, minCatch, catchRange, cooldown, cost, unlocked, owned, buyFunc) {
        this.name = name;
        this.minRoll = minRoll;
        this.rollRange = rollRange;
        this.minCatch = minCatch;
        this.catchRange = catchRange;
        this.cooldown = cooldown;
        this.cost = cost;
        this.unlocked = unlocked;
        this.owned = owned;
        this.buyFunc = buyFunc;
    }
    buy() {
        if (!this.owned && money >= this.cost) {
            money -= this.cost;
            this.owned = true;
            this.buyFunc();
        }
    }
    unlock() {
        this.unlocked = true;
        const div = document.createElement("div");
        div.className = "buyButton";
        div.id = `${findToolName(this.name)}`;
        div.addEventListener("click", () => { selectTool(findToolName(this.name)) });
        div.innerHTML = `<p>${this.name}</p><p id=${findToolName(this.name)}Price>$${this.cost}</p>`;

        if (this.name.includes("Spear")) {
            $("spearContent").appendChild(div);
        } else if (this.name.includes("Rod")) {
            $("rodContent").appendChild(div);
        }
    }
}

const researchCentre = {
    tier: 0,
    cost: 300,
    get() {
        this.tier++;
        this.cost = 300 * 3 ** (this.tier * 3);
        $("resCentreButton").innerHTML = `Tier ${this.tier+1} research centre`
        document.querySelector("#research .buyButton p[name='price']").innerHTML = `$${this.cost}`;
    },
    buy() {
        if (money >= this.cost) {
            money -= this.cost;
            this.get();
        }
    },
}

// probably a better way to do this
fishList.set("perch", new Fish("perch", 2, 0, 1));
fishList.set("prawn", new Fish("prawn", 5, 0, 2, true));
fishList.set("catfish", new Fish("catfish", 8, 0, 3));
fishList.set("whitefish", new Fish("whitefish", 12, 0, 4));
fishList.set("walleye", new Fish("walleye", 13, 0, 5));
fishList.set("salmon", new Fish("salmon", 18, 0, 6));
fishList.set("eel", new Fish("eel", 20, 0, 7, true));
fishList.set("basa", new Fish("basa", 25, 0, 8));

toolList.set("woodenSpear", new Tool("Wooden Spear", 0, 30, 1, 1, 8, 0, true, true, () => { $("woodenSpearPrice").innerHTML = "Owned" }));
toolList.set("flintSpear", new Tool("Flint Spear", 5, 80, 2, 1, 7.5, 80, true, false, () => { $("flintSpearPrice").innerHTML = "Owned" }));
toolList.set("copperSpear", new Tool("Copper Spear", 20, 130, 2, 2, 6, 350, false, false, () => { $("copperSpearPrice").innerHTML = "Owned" }));
toolList.set("bronzeSpear", new Tool("Bronze Spear", 60, 240, 4, 1, 5, 1200, false, false, () => { $("bronzeSpearPrice").innerHTML = "Owned" }));
toolList.set("steelSpear", new Tool("Steel Spear", 140, 510, 4, 2, 4.5, 8800, false, false, () => { $("steelSpearPrice").innerHTML = "Owned" }));
toolList.set("badRod", new Tool("Makeshift Rod", 10, 60, 1, 2, 4, 150, false, false, () => { $("badRodPrice").innerHTML = "Owned" }));
toolList.set("mapleRod", new Tool("Maple Rod", 25, 95, 2, 1, 3.8, 480, false, false, () => { $("mapleRodPrice").innerHTML = "Owned" }));
toolList.set("bambooRod", new Tool("Bamboo Rod", 60, 130, 2, 2, 3.6, 900, false, false, () => { $("bambooRodPrice").innerHTML = "Owned" }));
toolList.set("graphRod", new Tool("Graphite Rod", 120, 400, 3, 2, 3.4, 3500, false, false, () => { $("graphRodPrice").innerHTML = "Owned" }));
toolList.set("fiberRod", new Tool("Fiberglass Rod", 180, 570, 5, 2, 3.2, 15000, false, false, () => { $("fiberRodPrice").innerHTML = "Owned" }));
//toolList.set("devTool", new Tool("???", 0, 300, 11, 11, 0.2, 64, false, true, () => { console.log("hello there.") }));

function findToolName(name) {
    let n;
    toolList.forEach((v, k) => {
        if (v.name === name) { n = k; }
    });
    return n;
}

function sumFish() {
    let sum = 0;
    fishList.forEach((v) => { sum += v.quantity });
    return sum;
}

function sumFishSell() {
    let sum = 0;
    fishList.forEach((v) => { sum += v.sellPrice * v.quantity; })
    return sum;
}

function pickFish(roll) {
    let fish;
    fishList.forEach((v) => {
        if (roll >= 10 * v.tier ** 2 - 10 * v.tier + 5 && roll < 10 * (v.tier+1) ** 2 - 10 * (v.tier+1) + 5) { fish = v.name; } // i can't fucking believe i'm using polynomials in a quirky fishing game
    });
    if (fish) { return fish; }
    return "nothing";
}

function updateFishList() {
    $("fishList").innerHTML = "";

    fishList.forEach((v) => {
        (v.countable && v.quantity != 1) ? $("fishList").innerHTML += `<li>${v.quantity} ${v.name}s</li>` : $("fishList").innerHTML += `<li>${v.quantity} ${v.name}</li>`;
    })
}

function updateToolInfo() {
    const nothingChance = toolList.get(curTool).minRoll > 5 ? 1 : 1 - ((5 - toolList.get(curTool).minRoll) / (toolList.get(curTool).minRoll + toolList.get(curTool).rollRange)) ** (toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch);
    const avgFish = (toolList.get(curTool).catchRange / 2 + toolList.get(curTool).minCatch) * nothingChance;

    $("toolName").innerHTML = toolList.get(curTool).name;
    $("toolPower").innerHTML = `${toolList.get(curTool).minRoll} - ${toolList.get(curTool).rollRange + toolList.get(curTool).minRoll} fishing power`;
    $("toolCooldown").innerHTML = `${toolList.get(curTool).cooldown}s cooldown`;
    $("toolAvgCatch").innerHTML = `${+avgFish.toFixed(numAccuracy)} fish caught on average`;
    $("toolFishPerSec").innerHTML = `${+(1 / toolList.get(curTool).cooldown * avgFish).toFixed(numAccuracy)} fish/s`;
}

function catchFish() {
    const roll = [];
    let catchAmount = Math.floor(Math.random() * (toolList.get(curTool).catchRange + 1) + toolList.get(curTool).minCatch);
    let af = $("addFish");
    af.innerHTML = "";
    const rodSpr = document.querySelector("#rod");

    rodSpr.src = `assets/tools/${curTool}.png`;

    if (curTool.includes("Spear")) {
        rodSpr.style.bottom = "29px";
        rodSpr.style.right = "0px";
    } else if (curTool.includes("Rod")) {
        rodSpr.style.top = "600px";
        rodSpr.style.left = "360px";
    }

    for (let i = 0; i < catchAmount; i++) {
        roll.push(Math.floor(Math.random() * toolList.get(curTool).rollRange + toolList.get(curTool).minRoll + 1));
        roll[i] = pickFish(roll[i]);

        if (roll[i] !== "nothing") {
            fishList.get(roll[i]).add(1);
        }
    }
    const newFish = [];

    for (let i = 0; i < fishList.size; i++) { newFish[i] = 0; }

    for (let i = 0; i < roll.length; i++) {
        //console.log(roll[i]);
        switch (roll[i]) {
            case "perch":
                newFish[0]++;
                break;
            case "prawn":
                newFish[1]++;
                break;
            case "catfish":
                newFish[2]++;
                break;
            case "whitefish":
                newFish[3]++;
                break;
            case "walleye":
                newFish[4]++;
                break;
            case "salmon":
                newFish[5]++;
                break;
            case "eel":
                newFish[6]++;
                break;
            case "basa":
                newFish[7]++;
                break;
        }
        if (researchCentre.tier !== 0 && roll[i] !== "nothing") {
            researchXp += fishList.get(roll[i]).tier ** 2 + 9 * researchCentre.tier ** 3;

            if (researchXp >= nextResearchReq) {
                researchXp -= nextResearchReq;
                increaseResearchTier(true);
            }
        }
    }

    const fishNames = ["perch", "prawn", "catfish", "whitefish", "walleye", "salmon", "eel", "basa"];
    let addedFishes = 0;
    for (let i = 0; i < newFish.length; i++) {
        if (newFish[i] !== 0) {
            addedFishes++;
            af.innerHTML += `<li>${newFish[i]} ${fishList.get(fishNames[i]).name}</li>`;
        } else { af.innerHTML += "<li style='list-style-type:\" \"'></li>"; } // this is one of the greatest workarounds to any problem ever 
    }

    (addedFishes === 0) ? $("moneyGain").innerHTML = "You caught nothing :(" : $("moneyGain").innerHTML = "";

    rodSpr.style.visibility = "visible";
}

function gameLoop() {
    // update fishing timer
    const msElapsed = new Date().getTime() - fishStart;
    if (msElapsed < toolList.get(curTool).cooldown * 1000) { $("timer").innerHTML = `Wait ${(toolList.get(curTool).cooldown - msElapsed / 1000).toFixed(numAccuracy)} seconds before casting again.`; }
    else {
        $("timer").innerHTML = `Ready to cast!`;
        document.querySelector("#rod").style.visibility = "hidden";
    }
    fishingTimer = toolList.get(curTool).cooldown * 1000 - msElapsed;

    // update other things
    updateFishList();
    updateToolInfo();
    updateMoney();
    updateResearch();
}

function fish() {
    if (fishingTimer <= 0) {
        catchFish();
        fishStart = new Date().getTime();
    }
}

function sell() {
    const moneyBefore = money;
    money += sumFishSell();
    if (money === moneyBefore) {
        $("moneyGain").innerHTML = "You don't have any fish to sell.";
        return;
    }
    $("moneyGain").innerHTML = `You sold ${sumFish()} fish to earn $${sumFishSell()}!`;
    $("money").innerHTML = `You have $${money}`;
    $("addFish").innerHTML = "";

    fishList.forEach((v) => { v.sell(); })
}

function changeShop(tab) {
    const t = document.getElementsByClassName("storeTab");

    for (let i = 0; i < t.length; i++) { t[i].style.display = "none"; }
    $(tab).style.display = "block";
}

function increaseResearchTier(showBox = false) {
    researchTier++;
    nextResearchReq = (nextResearchReq * (2 + researchTier / (researchTier + 1))).toFixed(0);
    let researchContent;
    
    switch (researchTier) {
        case 1:
            toolList.get("copperSpear").unlock();
            researchContent = "<li>Copper Spear</li>";
            break;
        case 2:
            toolList.get("badRod").unlock();
            toolList.get("mapleRod").unlock();
            toolList.get("bambooRod").unlock();

            const div = document.createElement("div");
            div.innerHTML = "Rods";
            div.id = "rods";
            div.addEventListener("click", () => (changeShop("rodContent")));
            $("rodContent").style.display = "none";
            document.querySelector("#storeTabs").appendChild(div);

            researchContent = "<li>Makeshift Rod</li><li>Maple Rod</li><li>Bamboo Rod</li>";
            break;
        case 3:
            toolList.get("bronzeSpear").unlock();
            researchContent = "<li>Bronze Spear</li>";
            break
        case 4:
            toolList.get("graphRod").unlock();
            researchContent = "<li>Graphite Rod</li>";
            break;
        case 5:;
            toolList.get("steelSpear").unlock();
            researchContent = "<li>Steel Spear</li>";
            break;
        case 6:
            toolList.get("fiberRod").unlock();
            researchContent = "<li>Fiberglass Rod</li>";
            break;
        default:
            researchContent = "<li>Nothing...</li><li>If you haven't already, I recommend going outside</li>";
    }
    if (document.querySelector(".resResult") !== null) {
        document.querySelector("#middleSection").removeChild(document.querySelector(".resResult"));
    }

    if (showBox) {
        const researchResults = dialogBox("resResult", `Research Lvl ${researchTier}`, "You unlocked:", `<ul>${researchContent}</ul>`);
        document.querySelector("#middleSection").appendChild(researchResults);
        setTimeout(() => { document.querySelector("#middleSection").removeChild(researchResults) }, 10000);
    }
}

function updateResearch() {
    if (researchCentre.tier > 0) {
        let p = $("researchDisp");
        let tier = $("researchTierDisp");
        if (p === null) {
            p = document.createElement("p");
            p.id = "researchDisp";
            $("research").appendChild(p);
        }
        if (tier === null) {
            tier = document.createElement("p");
            tier.id = "researchTierDisp";
            $("research").appendChild(tier);
        }
        
        p.innerHTML = `${+(researchXp / nextResearchReq * 100).toFixed(numAccuracy)}% research finished`;
        tier.innerHTML = `Research level ${researchTier}`;
    }
}

function selectTool(item) {
    if (!toolList.get(item).owned) { toolList.get(item).buy(); }
    else {
        $(`${curTool}Price`).innerHTML = "Owned";
        curTool = item;
        $(`${curTool}Price`).innerHTML = "Selected!";
    }
}

function init() {
    loadSave();

    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") { // look at me, being considerate of macOS for once
            e.preventDefault();
    
            createSave();
        } if (e.key === "Tab") { e.preventDefault(); }
    })
    
    $("middleSection").addEventListener("click", fish);
    $("sellButton").addEventListener("click", sell);
    $("spears").addEventListener("click", () => { changeShop("spearContent") });
    $("woodenSpear").addEventListener("click", () => { selectTool("woodenSpear") });
    $("flintSpear").addEventListener("click", () => { selectTool("flintSpear") });
    $("settings").addEventListener("click", openSettings);

    const shopTabs = document.getElementsByClassName("storeTab");
    for (let i = 0; i < shopTabs.length; i++) {
        const shopTools = document.querySelectorAll("#store.buyButton");

        for (let j = 0; j < shopTools.length; j++) { shopTools[j].addEventListener("click", selectTool(shopTools[j].id)); }
    }
    $("researchCentre").addEventListener("click", researchCentre.buy());

    updateToolInfo();
    updateFishList();
    updateMoney();
    setInterval(createSave, 60000);
    setInterval(gameLoop, 10);
}

function dialogBox(id, header = null, bodyText = null, special = null) {
    const div = document.createElement("div");
    div.id = id;
    div.innerHTML = "";
    if (header) { div.innerHTML += `<h1>${header}</h1>`; }
    if (bodyText) { div.innerHTML += `<p>${bodyText}</p>`; }
    if (special) { div.innerHTML += special; }
    return div;
}

function wipeSaveWarning() {
    const warning = dialogBox("wipeWarning", "Are you sure?", "Your save file will <em>NOT</em> be recoverable if you do this.", "<button class='danger' id='deleteSave'>Yes, I'm sure!</button><button id='cancelDelete'>Cancel</button>");
    document.querySelector("body").appendChild(warning);
    $("deleteSave").addEventListener("click", () => { wipeSave() });
    $("cancelDelete").addEventListener("click", () => { document.querySelector("body").removeChild(warning) })
}

function wipeSave() { // fix this later
    document.querySelector("body").removeChild($("wipeWarning"));
    if ($("settingsBox")) { document.querySelector("body").removeChild($("settingsBox")); }

    localStorage.clear();
    currentFish = "", fishingTimer = 0, fishStart = 0, money = 0, researchTier = 0, researchXp = 0, nextResearchReq = 600, numAccuracy = 1;
    researchCentre.tier = 0;
    fishList.forEach((v) => { v.quantity = 0; })
    toolList.forEach((v) => {
        if (v.name !== "Wooden Spear") { v.owned = false; }
        v.unlocked = false;
    })
    selectTool("woodenSpear");

    const spearButtons = document.querySelectorAll("#spearContent .buyButton");
    const rodButtons = document.querySelectorAll("#rodContent .buyButton"); // idk maybe this could go into 1 line but whatever im tired

    for (let i = 2; i < spearButtons.length; i++) {
        if (spearButtons[i].id !== "flintSpear" || spearButtons[i].id !== "woodenSpear") { $("spearContent").removeChild(spearButtons[i]); }
    }
    for (let i = 0; i < rodButtons.length; i++) { $("rodContent").removeChild(rodButtons[i]); }
    $("resCentreButton").innerHTML = "Research centre";
    document.querySelector("p[name='price']").innerHTML = "$300";
    if ($("researchDisp") !== null) { $("research").removeChild($("researchDisp")); }
    if ($("researchTierDisp") !== null) { $("research").removeChild($("researchTierDisp")); }

    init();
}

function loadSave() {
    if (localStorage.getItem("save") !== null) {
        let s = atob(localStorage.getItem("save"));
        // prunes invalid characters
        s = s.replace(/\\n/g, "\\n")
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&")
            .replace(/\\r/g, "\\r")
            .replace(/\\t/g, "\\t")
            .replace(/\\b/g, "\\b")
            .replace(/\\f/g, "\\f");
        s = s.replace(/[\u0000-\u0019]+/g,"");
        const o = JSON.parse(s);
    
        money = o.money;
        numAccuracy = o.settings.numAcc;
        researchXp = o.res.xp;
        for (let i = 0; i < o.res.tier; i++) { increaseResearchTier(); }
        for (let i = 0; i < o.res.centreTier; i++) { researchCentre.get(); }
        document.querySelector("#research .buyButton p[name='price']").innerHTML = `$${10 ** researchCentre.tier * 300}`;
    
        for (const t in o.toolsOwned) {
            toolList.get(t).owned = o.toolsOwned[t];
            if (toolList.get(t).owned) { selectTool(t); }
        }
        for (const f in o.fish) { fishList.get(f).quantity = o.fish[f]; }
        selectTool(o.curTool);
        fishStart = o.cdstart;
        fishingTimer = toolList.get(curTool).cooldown * 1000 - (new Date().getTime() - o.cdstart)   
    }
}

function createSave() {
    let saveText = `{"money":${money},"settings":{"numAcc":${numAccuracy}},"res":{"xp":${researchXp},"tier":${researchTier},"centreTier":${researchCentre.tier}},"toolsOwned":{`;
    let i = 0;
    toolList.forEach((v, k) => {
        saveText += `"${k}":${v.owned}`;
        if (i < toolList.size - 1) { saveText += "," };
        i++;
    })
    saveText += '},"fish":{';
    i = 0;
    fishList.forEach((v, k) => {
        saveText += `"${k}":${v.quantity}`;
        if (i < fishList.size - 1) { saveText += "," };
        i++;
    })
    saveText += `},"curTool":"${curTool}","cd":${fishingTimer},"cdstart":${fishStart}}`;
    localStorage.setItem("save", btoa(saveText));

    const save = dialogBox("saveBox", null, "Game saved!");
    document.querySelector("body").appendChild(save);
    setTimeout(() => { document.querySelector("body").removeChild(save) }, 2000);
}

function closeSettings(e) {
    const settings = $("settingsBox");
    if (settings !== null) {
        if (!settings.contains(e.target) && !$("settings").contains(e.target)) {
            document.querySelector("body").removeChild($("settingsBox"));
            document.removeEventListener("click", closeSettings);
        }
    }
}
 
function openSettings() {
    if ($("settingsBox") === null) {
        const settings = dialogBox("settingsBox", "Options", null, "<button onclick=createSave()>Save</button><button class='danger'>Delete save</button><br><input type='checkbox' id='highNumAcc'><label for='highNumAcc'>Higher decimal accuracy</label>");
        document.querySelector("body").appendChild(settings);
        settings.querySelector("#highNumAcc").checked = (numAccuracy === 2);
        document.querySelector(".danger").addEventListener("click", () => { wipeSaveWarning() });
        $("highNumAcc").addEventListener("click", () => { updateSettings() });

        document.addEventListener("click", closeSettings);
    }
}

function updateSettings() {
    numAccuracy = ($("highNumAcc").checked) ? 2 : 1;
}

function exampleSave() {
    money = 10004, researchXp = 30000, researchTier = 5, researchCentre.tier = 1;
    toolList.get("flintSpear").owned = true, toolList.get("copperSpear").owned = true, toolList.get("bronzeSpear").owned = true, toolList.get("steelSpear").owned = true, toolList.get("badRod").owned = false, toolList.get("mapleRod").owned = true, toolList.get("bambooRod").owned = true, toolList.get("graphRod").owned = true, toolList.get("fiberRod").owned = false;
    fishList.get("perch").quantity = 0;
    fishList.get("prawn").quantity = 0;
    fishList.get("catfish").quantity = 0;
    fishList.get("whitefish").quantity = 0;
    fishList.get("walleye").quantity = 0;
    fishList.get("salmon").quantity = 0;
    fishList.get("eel").quantity = 1;
    fishList.get("basa").quantity = 0;
    curTool = "steelSpear";
    fishStart = 1692800000000;
    createSave();
}

// alright lets get this show started
addEventListener("load", init);

// save file lmao
// eyJtb25leSI6OTAwLCJzZXR0aW5ncyI6eyJudW1BY2MiOjJ9LCJyZXMiOnsieHAiOjU0MzUsInRpZXIiOjMsImNlbnRyZVRpZXIiOjF9LCJ0b29sc093bmVkIjp7Indvb2RlblNwZWFyIjp0cnVlLCJmbGludFNwZWFyIjp0cnVlLCJjb3BwZXJTcGVhciI6dHJ1ZSwiYnJvbnplU3BlYXIiOnRydWUsInN0ZWVsU3BlYXIiOmZhbHNlLCJiYWRSb2QiOnRydWUsIm1hcGxlUm9kIjp0cnVlLCJiYW1ib29Sb2QiOnRydWUsImdyYXBoUm9kIjpmYWxzZSwiZmliZXJSb2QiOmZhbHNlfSwiZmlzaCI6eyJwZXJjaCI6MCwicHJhd24iOjEsImNhdGZpc2giOjE3LCJ3aGl0ZWZpc2giOjE1LCJ3YWxsZXllIjoxNywic2FsbW9uIjowLCJlZWwiOjAsImJhc2EiOjB9LCJjdXJUb29sIjoiYnJvbnplU3BlYXIiLCJjZCI6LTYyNDEyNSwiY2RzdGFydCI6MTY5NDU2NzEyMTQyN30=