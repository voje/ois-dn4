var baseUrl = "https://rest.ehrscape.com/rest/v1";
var queryUrl = baseUrl + "/query";

var currentEHR = -1;

//test
EHRToName("39ff2767-5805-4585-8377-0b3bfa9abbf6");

function getSessionID(){
	var response = $.ajax({
		type: "POST",
		url: baseUrl + "/session?username=" + encodeURIComponent("ois.seminar") + "&password=" + encodeURIComponent("ois4fri"),
		async: false
	});
	console.log("Sess ID = " + response.responseJSON.sessionId);
	return response.responseJSON.sessionId;
}

//test: Abraham Lincoln: 39ff2767-5805-4585-8377-0b3bfa9abbf6
//String ehr
function EHRToName(ehr){
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
				console.log("najdeno ime: " + party.firstNames);
				if(i==0){
					$("#prijava").val(party.firstNames + " " + party.lastNames);
		            $("#prijavljen").text("(prijavljen)");
		            $("#labelEHRID").text("EHR: " + ehr);
				}
			}
		}
	});
}

function odjava(){
	$("#prijava").val("ime priimek");
	$("#labelEHRID").text("EHR:");
	$("#prijavljen").text("");
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
	console.log("ime: " + ime + ", priimek: " + priimek);
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
			console.log("success 1");
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
	var sessionId = getSessionID();
	var ime =  $("#newIme").val();
	var priimek = $("#newPriimek").val();
	var datOfBir = $("#newDatum").val() + "T00:00";	//dan rojsta je dovolj velika natančnost za to aplikacijo
	console.log(datOfBir);
	if(ime == null || priimek == null || datOfBir == null || ime == "" || priimek == "" || datOfBir == ""){
		console.log("prazna polja");
		//console.log(ime + ", " + priimek + ", " + datOfBir);
		return;
	}
	
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
		    var ehrId = data.ehrId;
		    currentEHR = ehrId;
		    $("#labelEHRID").text("EHR: " + ehrId);

		    // build party data
		    var partyData = {
		        firstNames: ime,
		        lastNames: priimek,
		        dateOfBirth: datOfBir,
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




















