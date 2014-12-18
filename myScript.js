var baseUrl = "https://rest.ehrscape.com/rest/v1";
var queryUrl = baseUrl + "/query";

var currentEHR = "";
//za preverjanje, kdaj je neka funkcija končala na ehrscape
var stikalo = 0;

//test Abraham Lincoln: 39ff2767-5805-4585-8377-0b3bfa9abbf6
//EHRToName("39ff2767-5805-4585-8377-0b3bfa9abbf6");

function getSessionID(){
	var response = $.ajax({
		type: "POST",
		url: baseUrl + "/session?username=" + encodeURIComponent("ois.seminar") + "&password=" + encodeURIComponent("ois4fri"),
		async: false
	});
	//
	//console.log("Sess ID = " + response.responseJSON.sessionId);
	return response.responseJSON.sessionId;
}

function odjava(){
	currentEHR = "";
	$("#prijava").val("");
	$("#prijava").attr("placeholder", "ime priimek");
	$("#labelEHRID").text("EHR:");
	$("#prijavljen").text("");
}

//argument je String EHRID
function EHRToName(ehr){
	currentEHR = ehr
	$.ajaxSetup({
		headers: {
			"Ehr-Session": getSessionID()
		}
	});
	var searchData = [
		{key: "ehrId", value: ehr}
	];
	$.ajax({
		url: baseUrl + "/demographics/party/query",
		type: "POST",
		contentType: "application/json",
    	data: JSON.stringify(searchData),
		success: function(result){
			for(i in result.parties){	//nevem, zakaj je to for loop, saj naj bi bil ID le eden... se pa raje držim dokumentacije
				var party = result.parties[i];
				//console.log("najdeno ime: " + party.firstNames);
				if(i==0){
					$("#prijava").val(party.firstNames + " " + party.lastNames);
		            $("#prijavljen").text("(prijavljen)");
		            $("#labelEHRID").text("EHR: " + ehr);
				}
			}
		}
	});
}

function nameToEHR(){
	var imepriimek = $("#prijava").val();
	imepriimek = imepriimek.split(" ");
	if(imepriimek.length != 2){
		console.log("napacen vnos");
		return;
	}
	ime = imepriimek[0];
	priimek = imepriimek[1];
	//console.log("ime: " + ime + ", priimek: " + priimek);
	$.ajaxSetup({
		headers: {
			"Ehr-Session": getSessionID()
		}
	});
	var searchData = [
		{key: "firstNames", value: ime},
		{key: "lastNames", value: priimek}
	];
	$.ajax({
		url: baseUrl + "/demographics/party/query",
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(searchData),
		success: function(result){
			for(i in result.parties){
				var party = result.parties[i];
				var ehrID;
				for(j in party.partyAdditionalInfo){
					if(party.partyAdditionalInfo[0].key == "ehrId"){
						ehrID = party.partyAdditionalInfo[0].value;
						console.log("found one: " + ime + " " + priimek + " - " + ehrID);
						if(i==0){ //prijavi se kot zadnji dodan
							$("#prijava").val(ime + " " + priimek);
				            $("#prijavljen").text("(prijavljen)");
				            $("#labelEHRID").text("EHR: " + ehrID);
				            currentEHR = ehrID;
				       	}
					}
				}
			}
		}
	});
}

//test
function testing(){
	console.log("This is a test:");
	var a = $("#prijava").val();
	var b = $("#newUsrBtn").val();
	var c = $("#newIme").val();
	console.log(a + ", " + b + ", " + c);
}

//dodaj novega pacienta
function dodajNovegaPacienta(){
	var ime =  $("#newIme").val();
	var priimek = $("#newPriimek").val();
	var datRoj = $("#newDatum").val() + "T00:00";	//dan rojsta je dovolj velika natančnost za to aplikacijo
	//console.log(datRoj);
	if(ime == null || priimek == null || datRoj == null || ime == "" || priimek == "" || datRoj == ""){
		console.log("prazna polja");
		//console.log(ime + ", " + priimek + ", " + datRoj);
		return;
	}
	dodajNovegaPacienta1(ime, priimek, datRoj);
}
function dodajNovegaPacienta1(ime, priimek, datRoj){
	var sessionId = getSessionID();
	//
	$.ajaxSetup({
		headers: {
		    "Ehr-Session": sessionId
		}
	});
	$.ajax({
		url: baseUrl + "/ehr",
		type: 'POST',
		success: function (data) {
			console.log("Dodajam pacienta: " + ime + " " + priimek + " " + datRoj);
		    var ehrId = data.ehrId;
		    currentEHR = ehrId;
		    stikalo = 1;
		    $("#labelEHRID").text("EHR: " + ehrId);

		    // build party data
		    var partyData = {
		        firstNames: ime,
		        lastNames: priimek,
		        dateOfBirth: datRoj,
		        partyAdditionalInfo: [
		            {
		                key: "ehrId",
		                value: ehrId
		            }
		        ]
		    };
		    $.ajax({
		        url: baseUrl + "/demographics/party",
		        type: 'POST',
		        contentType: 'application/json',
		        data: JSON.stringify(partyData),
		        success: function (party) {
		            if (party.action == 'CREATE') {
		                $("#newURL").html("URL: " + party.meta.href);
		                $("#prijava").val(ime + " " + priimek);
		                $("#prijavljen").text("(prijavljen)");
		            }
		        }
		    });
		}
	});
}
function vnesiMeritve(){
	var masa = $("#vnosMasa").val();
	var visina = $("#vnosVisina").val();
	var datum = $("#vnosDatum").val(); + "T00:00";
	vnesiMeritve1(masa, visina, datum);
}
function vnesiMeritve1(masa, visina, datum){
	$.ajaxSetup({
		hearders: {
			"Ehr-Session": getSessionID()
		}
	});
	
	var composition = {
		/*"vital_signs/body_weight/any_event/body_weight": masa,
		"vital_signs/height_length/any_event/body_height_length": visina,
		"ctx/time": datum
		*/
		"ctx/time": datum,
		"ctx/language": "en",
		"ctx/territory": "SLO",
		"vital_signs/height_length/any_event/body_height_length": visina,
		"vital_signs/body_weight/any_event/body_weight": masa
	};
	
	//console.log(currentEHR);
	var queryParams = {
		"ehrId": currentEHR,
		templateId: 'Vital Signs',
		format: 'FLAT',
		committer: 'myApp'
    };
	
	$.ajax({
		url: baseUrl + "/composition?" + $.param(queryParams),
		type: "POST",
		contentType: 'application/json',
		data: JSON.stringify(composition),
		success: function(result){
			console.log("poslani podatki za ID = " + currentEHR);
			console.log("masa: " + masa);
			console.log("visina: " + visina);
			console.log("dautm: " + datum);
			
		}
	});
}

//poišče vse zapise mase pacienta (podobna stvar, kot je v dokumentaciji)
function vseMeritve(ehrID){
	console.log("EHR: " + currentEHR);
	$.ajax({
		url: baseUrl + "/demographics/ehr/" + currentEHR + "/party",
		type: "GET",
		headers: {"Ehr-Session": getSessionID()},
		success: function(data){
			console.log("SUCCESS");
			var party = data.party;
			console.log(party.firstNames + " " + party.lastNames + " ");
		}
	});
	$.ajax({
		url: baseUrl + "/view/" + currentEHR + "/weight",
		type: "GET",
		headers: {"Ehr-Session": getSessionID()},
		success: function(data){
			for(var i in data){
				console.log(data[i].time + ": " + data[i].weight + " " + data[i].unit);
			}
		}
	});
}

//+- 1.5kg
function randomMasa(staraMasa){
	masa = staraMasa - 1.5 + Math.random()*3;
	return masa.toFixed(2);
}
//predela datum v formatu yy-mm-dd (doda 7 do 13 dni)
function randomDatum(starDatum){
	var inkrement = 7 + Math.random()*7;
	var datum = new Date(Date.parse(starDatum));
	//console.log("STAR: " + datum.toString());
	//console.log("++:" + inkrement);
	datum.setDate(datum.getDate() + inkrement);
	//console.log("NOV: " + datum.toString());
	var month = datum.getMonth();
	month += 1;
	var strDatum = datum.getFullYear() + "-" + month + "-" + datum.getDate();
	//console.log("str: " + strDatum);
	return strDatum;
}
//ustvari novega pacienta, ki si začne meriti vitalne znake ob datZac. Datum se inkrementira po naključnih intervalih 7 - 14 dni, visina pocasi raste, masa se rahlo spreminja (+-).
//helper funkcije:
function urp1(r_mase, visina, r_datumi, stMeritev){
	for(var i=0; i<stMeritev; i++){
		vnesiMeritve1(r_mase[i], visina, r_datumi[i]);
	}
}
function ustvariRandomPacienta(ime, priimek, datRoj, masa, visina, datZac, stMeritev){
	//tabele za random vrednosti;
	//privzeli bomo, da je aplikacija za odrasle, zato bo visina konstantna
	var r_mase = [masa.toString()];
	var r_datumi = [datZac];
	for(var i=1; i<stMeritev; i++){
		r_mase[i] = randomMasa(r_mase[i-1]);
		r_datumi[i] = randomDatum(r_datumi[i-1]);
	}

	$("#newUsrDiv").hide();
	var oldCurrEHR = currentEHR;
	dodajNovegaPacienta1(ime, priimek, datRoj);
	setTimeout(function() { urp1(r_mase, visina, r_datumi, stMeritev); }, 3000);
	setTimeout(function() { vseMeritve(currentEHR); }, 5000);
}

function randomPacient(string){
	switch(string){
		case "Randall Flagg":	//primel normalne teže
			ustvariRandomPacienta("Randall", "Flagg", "1978-1-1", 66, 176, "1986-6-6", 10);
			break;
		case "Arktos Snežak":	//primer debelega
			ustvariRandomPacienta("Arktos", "Snežak", "2000-2-5", 200, 150, "2003-9-1", 10);
			break;
		case "Abraham Lincoln":	//primer prelahkega
			ustvariRandomPacienta("Abraham", "Lincoln", "1809-2-12", 60, 193, "1856-5-3", 10);
			break;
	}
}
















