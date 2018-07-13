
/**
 * 
 */
class PageChanger {

    /**
     * 
     * @param {*} actionPerPage funkcija koja će biti pozvana na svakoj strani 
     * @param {*} actionAtEnd   funkcija koja će biti pozvana nakon što se obiđu sve strane
     * @param {*} onChange      funkcija koja će biti pozvana kada se mjenja strana
     * @param {*} pagerClass    razred elemenata koji klikom mjenjaju stranicu 
     * @param {*} id            id pod kojim će spremati (ili pod kojim su već spremljene) potrebne varijable nakon promjene stranice
     *                          ako je isti id smatra se da je isti test (staviti različiti id ako se planira testirati paralelno)
     * @param {*} isStarting    true ako započnije, false ako nastavlja
     * @param {*} maxPages      koliko će se maksimalno stranica promijeniti
     *                          postaviti na 0 ili manje ako nema ograničenja
     * @param {*} isFromFirst   true ako je potrebno pozicionirati na 1. stranu prije početka,
     *                          false ako je svejedno na kojoj strani počinje,
     *                          npr., da je na početku na strani 35, a maxPages je više od 35, 
     *                          tada ako zastavica isFromFirst nije true: pozvat će actionPerPage odma na strani 35, 
     *                          prebaciti se na 1. stranu, i kasnije opet doći do strane 35, 
     *                          tako da ako je bitno da se actionPerPage nikada ne ponovi na istoj strani potrebno je početi od prve strane
     */
    constructor(actionPerPage, actionAtEnd, onChange, pagerClass, id, isStarting, maxPages, isFromFirst) {

        this.class = "[class='" + pagerClass + "']";
        this.isFromFirst = isFromFirst;
        this.endAction = actionAtEnd;
        this.action = actionPerPage;
        this.onChange = onChange;
        this.maxPages = maxPages;
        this.lastIndex = id + "lastPagingIndex";
        this.lastLength = id + "lastPagingLength";
        this.numOfPages = id + "numberOfPages";
        this.gettingStarted = id + "pageChangerStarting";
        
        if (isStarting) {
            chrome.storage.local.remove([this.lastIndex, this.lastLength, this.numOfPages]); // počistiti od prošlog

            var toStore = {};
            toStore[this.gettingStarted] = 1;
            chrome.storage.local.set(toStore);
        }
            
    }

    /**
     * Počinje od prve stranice i ide do zadnje.
     * Na svakoj strani poziva actionPerPage koji je predan konstruktoru.
     * Na svakom prijelazu poziva onChange, a na kraju endAction.
     */
    nextPage() {
        var all = document.querySelectorAll(this.class);

        var retrieve = {};
        retrieve[this.lastIndex] = null;
        retrieve[this.lastLength] = null;
        retrieve[this.numOfPages] = null;
        retrieve[this.gettingStarted] = null;

        chrome.storage.local.get(retrieve, items => {

            if (this.isFromFirst && items[this.gettingStarted] > -1 && all.length > 1) {
                /*
                    Ovaj dio pozicionira na 1. stranu.
                    gettingStarted će prvo biti 1 -> kliknut će na 2. element
                    zatim se gettingStarted smanji na 0 -> kliknut će na 1. element
                    zatim je na -1 i više se ne ulazi u ovaj blok koda

                    na ovaj način je osigurano da će uvijek početi od prve strane
                    čak i ako element za odabir strane ima drugu klasu za trenutno odabranu stranu
                 */
                items[this.gettingStarted]--;
                chrome.storage.local.set(items, () => {
                    this.onChange();
                    all[items[this.gettingStarted] + 1].click();
                });
                return;
            }

            this.action();

            if (items[this.lastIndex] == null) {
                items[this.lastIndex] = 0;

            } else {
                if (items[this.lastIndex] === items[this.lastLength] - 1
                        || items[this.numOfPages] == this.maxPages) {
                    
                    this.endAction();
                    return;
                }

                /*
                    trenutni max veći od prošlog -> kliknemo index za 1 veći
                    inače isti index (jer npr. ako se prikazuje +-5 stranica oko trenutne onda će lijevo uvijek biti isti broj)
                */
                if (all.length > items[this.lastLength]) {
                    items[this.lastIndex] += 1;
                }
            }

            items[this.numOfPages]++;
            items[this.lastLength] = all.length;

            chrome.storage.local.set(items, () => {
                this.onChange();
                all[items[this.lastIndex]].click();
            });
        });
    }
}