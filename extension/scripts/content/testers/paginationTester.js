
/**
 * Testira straničenje. 
 * Provjera u prvih nekoliko stranica (ili sve strane) ima li koji element koji se ponavlja. 
 */
class PaginationTester extends Tester {

    /**
     * 
     * @param {*} pagerClass    razred elemenata koji klikom mjenjaju stranicu 
     * @param {*} maxPages      koliko će se maksimalno stranica provjeriti
     *                          postaviti na 0 ili manje ako nema ograničenja
     */
    constructor(test, group, student, id, pagerClass, maxPages) {
        super("paging", test, group, student, id);

        this.class = pagerClass;
        this.maxPages = maxPages;

        this.tempData = id + "tempPagingTester";
    }

    // Override
    executeStep(stepIndex, callBack) {
        if (stepIndex == 0) {   
            this.saveStatus(undefined, "straničenje...");

            var toStore = {};
            toStore[this.tempData] = {};
            chrome.storage.local.set(toStore, () => callBack());
             
        } else { 
            var pageChanger = new PageChanger(() => {
                chrome.storage.local.get(this.tempData, items => {
                    var pages = items[this.tempData];
                    pages[stepIndex] = [];
                    var isFirst = true; // da se ne uzme header
                    document.querySelectorAll("tr").forEach(row => {
                        if (isFirst) {
                            isFirst = false;
                        } else {
                            pages[stepIndex].push(row.innerText);
                        }
                    });
                    chrome.storage.local.set(items);
                });

            }, () => {
                chrome.storage.local.get(this.tempData, items => {
                    var pages = items[this.tempData];
                    var isPassed = true;
                    var different = new Set();
                    for (var pageId in Object.keys(pages)) {
                        for (var lineId in pages[pageId]) {
                            var line = pages[pageId][lineId];
                            if (different.has(line)) {
                                this.saveStatus(false, "ponavlja se: " + line);
                                isPassed = false;
                            } else {
                                different.add(line);
                            }
                        }
                    }
                    if (isPassed) {
                        this.saveStatus(true, "niti jedan redak se ne ponavlja");
                    }
                    this.gradeTest(isPassed);
                    callBack(this.STOP);
                });
                
            }, () => {
                callBack(this.WAIT_PAGE_CHANGE);    
                
            }, this.class, (this.id + "paging"), (stepIndex == 1), this.maxPages, true);

            pageChanger.nextPage();
        }
    }
}