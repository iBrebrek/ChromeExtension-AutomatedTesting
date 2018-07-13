
/**
 *  @abstract
 * 
 * Tester daje 0 ili maksikalno bodova. 
 * 
 * Za izvođenje testa se koristi metoda executeStep.
 * 
 * VAŽNO: testiranje se može nastaviti s novim objektom. 
 * To svojstvo je bitno u slučaju ako se tokom testiranja promijeni stranica (jer se u tome slučaju mora promijeniti objekt).
 * 
 * Status testova se sprema u chrome.storage.local pod ključ "testStatus".
 * Moguće je dodati novu poruku u status korištenjem metode saveStatus(isGood, message).
 * 
 * Za izradu novog testera (novog razreda) potrebno je naslijediti ovaj razred te u konstruktoru pozvati konstruktor ovog razreda.
 * U novom razredu se poziva metoda addStep za dodavanje koraka. 
 * Korak je funkcija koja prima 1 argument: funkciju koju će korak morati pozvati nakon što se izvšri
 * Korak može utijecati na tijek izvođena ako dobivenoj funkciji preda:
 *      this.STOP          
 *             - označava da korak želi da se testiranje završi
 *      this.WAIT_PAGE_CHANGE    
 *              - označava da korak želi da se testiranje (sljedeći korak) obaviti na promijenjenoj stranici
 * STOP i PAGE_CHANGE nema smisla vraćati ako je u pitanju zadnji korak. 
 * Npr. ako test ima ukupno 5 koraka i u 3. koraku se došlo do neispravnog stanja - korak može vratiti STOP da testiranje završi.
 * No ako je do neispravnog stanja se došlo nakon zadnjeg koraka, onda nema smisla vratiti STOP jer će testiranje ionako završiti.
 * 
 * U slučaju da se metoda executeStep nadjača (override) tada zadnji korak MORA pozvati this.STOP.
 */
class Tester {

    /**
     * @constructor
     * 
     * @param {*} testerName    ime testera, potrebno je ručno paziti da se testeri ne zovu isto
     * @param {*} test          ime testa koje će biti bodovano
     * @param {*} group         groupa studenta kojemu se testira test
     * @param {*} student       jmbag studenta
     * @param {*} id            id testera (po ovome vanjski razredu znaju gdje se stalo)
     */
    constructor(testerName, test, group, student, id) {
        if (this.constructor === Tester) {
            throw new TypeError('Abstract class "Tester" cannot be instantiated directly.'); 
        }

        this.name = testerName;
        this.group = group;
        this.student = student;
        this.test = test;
        this.id = id;

        this.STOP = "stop";
        this.WAIT_PAGE_CHANGE = "change";

        this.steps = [];
    }

    /**
     * Ocijenjuje test. Ako je test prošao dobiva maksimalno bodova, a ako je pao dobiva nulu.
     * 
     * @param {boolean} isPassed    true ako je test prošao, false ako nije
     */
    gradeTest(isPassed) {
        if (isPassed) this.saveStatus(true, "TEST PROŠAO");
        else this.saveStatus(false, "TEST PAO");

        chrome.storage.local.get("students", items => {

            if (!this.student || this.student == "") { // ako se ocijenjuje cijela grupa
                var group = items.students[this.group];
                Object.keys(group).forEach(jmbag => {
                    var test = group[jmbag].tests[this.test];
                    if (isPassed) {
                        test.points = test.maxPoints;
                    } else {
                        test.points = 0;
                    }
                });

            } else {
                var test = items.students[this.group][this.student].tests[this.test];
                if (isPassed) {
                    test.points = test.maxPoints;
                } else {
                    test.points = 0;
                }
            }

            chrome.storage.local.set(items);
        })
    }

    /**
     * Sprema poruku vezanu uz test.
     * 
     * @param {*} isGood    true - poruka je pozitivna, npr. dogodio se dobar korak
     *                      false - poruka je negativna, npr. neki korak nije dobro izvršen
     *                      undefined - neutralna poruka, npr. ako se samo želi zapisati obavijest
     * @param {*} message   sadržaj poruke
     * 
     */
    saveStatus(isGood, message) {
        chrome.storage.local.set({testStatus : 
            { isGood: isGood, msg: message, id : this.id }});
    }

    /**
     * 
     * @param {Function} step       funkcija koja će se izvesti u tome koraku
     */
    addStep(step) {
        this.steps.push(step);
    }

    /**
     * Obavlja i-ti korak testa.
     * 
     * @param {int} stepIndex       korak testa koji se želi obaviti     * 
     * @param {Function} callBack   poziva se nakon što se korak izvede, funkcija prima izlaz koraka 
     *                              (pogledati dokumentaciju razreda - što korak može vratiti)
     *                              funkcija prima this.STOP ako je testiranje gotvo (ako je tako odredio korak ili su svi koraci izvršeni)
     */
    executeStep(stepIndex, callBack) {

        if (stepIndex >= this.steps.length) {
            callBack(this.STOP);
        } else {
            this.steps[stepIndex](callBack);
        }
    }
}