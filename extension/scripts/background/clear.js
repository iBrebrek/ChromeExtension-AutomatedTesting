

window.addEventListener("load", () => {
    // popis ključeva koji se ne brišu
    var doNotRemove = ["students", "tests"];

    chrome.storage.local.get(null, items => {
        let keys = Object.keys(items);
        let toRemove = [];
        for(let index = 0; index < keys.length; index++) {
            if (doNotRemove.includes(keys[index])) continue;
            toRemove.push(keys[index]);
        }
        chrome.storage.local.remove(toRemove);
    });
});