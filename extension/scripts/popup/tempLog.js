
chrome.storage.onChanged.addListener(
    (changes, areaName) => {
        if (areaName != "local") return;
        if (!changes.testStatus) return;

        if (changes.testStatus.newValue) {
            var status = changes.testStatus.newValue;
            addRow(status.isGood, status.msg, status.id);
        }
    }
);

var tableById = {};

function getRow(tabId) {
    var table = tableById[tabId];
    if (table == undefined) {
        table = document.createElement("table");
        var row = table.insertRow();
        row.insertCell();  // da id piše desno
        row.insertCell().innerHTML = "tab ID: " + tabId;
        tableById[tabId] = table;
        document.getElementById("log").appendChild(table);
    }
    return table.insertRow();
}

function addRow(isGood, msg, tabId) {
    var row = getRow(tabId);

    if (isGood === undefined) {
        row.insertCell();

    } else {
        var icon = new Image(16, 16);
        if (isGood) {
            icon.src = 'icons/good.png';
        } else {
            icon.src = 'icons/bad.png';
        }

        row.insertCell().appendChild(icon);
    }

    row.insertCell().innerHTML = msg;    
}