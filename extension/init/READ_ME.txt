
za promjenu inicijalnih podataka potrebno je promijeniti datoteke students.txt i tests.txt
te dvije datoteke se uvijek moraju tako zvati jer inače neće biti učitane.

Jedan redak u datoteci students.txt mora biti sljedeće forme: (\t je tab)
	<jmbag_studenta>\t<prezime_studenta>\t<ime_studenta>\t<ime_grupe_studenta>

Redak u tests.txt:
	ako je test individualan redak mora biti:
		\t <ime_testa> \t <broj_bodova> \t <kriterij>
		
	ako je test za cijelu grupu redak mora biti:
		<ime_testa> \t \t <broj_bodova> \t <kriterij>
		
	individualan test -> u popupu ekstenzije svaki student će imati svoje polje za unos bodova
	grupni test -> studenti neće imati svoja polja nego će samo biti bodovi pod "ekipa"

	
____________________________________________________________________________________________

!!!!!  U slučaju da se promijene imena testova koja se koriste u automatskim testovima !!!!!
____________________________________________________________________________________________

Potrebno je promijeniti imena testova u kodu, u skripti scripts\content\content.js
imena moraju biti jednaka imenu testa u datoteci tests.txt
trenutno, te varijable su:
var VALIDATE_TEST = "Validacija";
var CREATE_TEST = "Dodavanje novog podatka";
var EDIT_TEST = "Ažuriranje jednostavnog podatka";
var PAGING_TEST = "Straničenje i sortiranje u jednostavnom tabličnom prikazu";
var DELETE_TEST = "Brisanje podatka";
var DIALOG_BEFORE_DELETE_TEST = "Potvrda prije brisanja podatka";