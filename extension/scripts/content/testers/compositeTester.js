
/**
 * 
  testira navednim redom: (koristi već napravljene testere)
  - validacija
  - dodavanje
  - ažuriranje
  - brisanje
  - straničenje

 */
class CompositeTester extends Tester {

    /**
     * 
     * @param {*} validateTestName  ime testa za bodovanje validacije
     * @param {*} createTestName    ime testa za bodovanje dodavanja
     * @param {*} editTestName      ime testa za bodovanje ažuriranja   
     * @param {*} deleteTestName    ime testa za bodovanje brisanja
     * @param {*} pagingTestName    ime testa za bodovanje straničenja
     * @param {*} dialogTestName    ime testa za bodovanje dijaloga prije brisanja
     * @param {*} group             grupa u kojoj je student koji se boduje
     * @param {*} student           jmbag studenta
     * @param {*} id                identifikacija testera
     * @param {*} editClass         klasa gumba kojim se pokreće ažuriranje
     * @param {*} deleteClass       klasa gumba kojim se pokreće ažuriranje
     * @param {*} pagingClass       razred elemenata koji klikom mjenjaju stranicu 
     * @param {*} fillForms         funkcija koja popunjavanja forme na trenutnoj stranici
     * @param {*} getAllMeta        funkcija koja vraća metapodatke trenunte stranice
     * @param {*} pagingMaxPages    maksimalan broj stranica koji se provjerava prilikom straničenja
     */
    constructor(validateTestName, createTestName, editTestName, deleteTestName, pagingTestName, dialogTestName,
                group, student, id, editClass, deleteClass, pagingClass, fillForms, getAllMeta, pagingMaxPages) {
        super("composite", null, group, student, id);

        this.validateTester = new ValidateTester(
            validateTestName, group, student, id
        );
        this.createTester = new CreateTester(
            createTestName, group, student, id,
            pagingClass, fillForms, getAllMeta
        );
        this.editTester = new EditTester(
            editTestName, group, student, id,
            pagingClass, editClass, fillForms, getAllMeta
        );
        this.deleteTester = new DeleteTester(
            deleteTestName, group, student, id,
            deleteClass, dialogTestName
        );
        this.pagingTester = new PaginationTester(
            pagingTestName, group, student, id,
            pagingClass, pagingMaxPages
        );

        this.tempData = id + "tempComposite";
    }

    executeStep(stepIndex, callBack) {
        chrome.storage.local.get(this.tempData, items => {
            var currentTesterName;
            if (stepIndex == 0) {   // u slučaju ako je zapelo i pokreće se ispočetka
                currentTesterName = "validate";
                items[this.tempData] = { current: currentTesterName, firstIndex: 0 }
                chrome.storage.local.set(items);
            } else {
                currentTesterName = items[this.tempData].current;
            }

            var tester;
            var next;

            switch (currentTesterName) {
                case "validate":
                    next = "create";
                    tester = this.validateTester;
                    break;
                case "create":
                    next = "edit";
                    tester = this.createTester;
                    break;
                case "edit":
                    next = "delete";
                    tester = this.editTester;
                    break;
                case "delete":
                    next = "paging";
                    tester = this.deleteTester;
                    break;
                case "paging":
                    next = null;
                    tester = this.pagingTester;
                    break;
            }

            var realIndex = stepIndex;
            if (items[this.tempData].firstIndex) {
                realIndex = stepIndex - items[this.tempData].firstIndex;
            }

            tester.executeStep(realIndex, result => {
                if (result == this.STOP && next != null) {
                    items[this.tempData] = { current: next, firstIndex: (stepIndex + 1) }
                    chrome.storage.local.set(items);
                    callBack();
                } else {
                    callBack(result);
                }
            });
        });
    }
}