var baseUrl = "https://rest.ehrscape.com/rest/v1";
var queryUrl = baseUrl + "/query";

var currentEHR = "";
//za preverjanje, kdaj je neka funkcija končala na ehrscape
var stikalo = 0;

//test Abraham Lincoln: 39ff2767-5805-4585-8377-0b3bfa9abbf6
EHRToName("fd8aecdd-0007-42ad-89b0-b50208c0b6e1");

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
	$("#newUsrDiv").hide();
	$("#rezultati").hide();
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
	var podatki = [mase = new Array(), datumi = new Array()];
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
				podatki[0][i] = data[i].weight;
				podatki[1][i] = data[i].time;
				console.log(data[i].time + ": " + data[i].weight + " " + data[i].unit);
			}
		}
	});
	return podatki;
}

function getBMI(){
	var bmi, kategorija;
	$.ajax({
    	url: "https://rest.ehrscape.com/ThinkCDS/services/CDSResources/guide/execute/BMI.Calculation.v.1/" + currentEHR,
    	type: "GET",
    	headers: {"Ehr-Session": getSessionID()},
    	success: function(data){
    		var bmiValue = "";
    		var bmiDetails = "";
    		if(data instanceof Array){
    			if(data[0].hasOwnProperty("results")){
    				data[0].results.forEach(function(v, k){
    					if(v.archetypeId === "openEHR-EHR-OBSERVATION.body_mass_index.v1"){
		                    var rounded = Math.round(v.value.magnitude * 100.0) / 100.0;
		                    bmiValue = rounded + ' ' + v.value.units;
		                    bmi = bmiValue;
		                    console.log("BMI = " + bmi);
		                    izpisRezultatov(bmi);
		            	}else{
                        	if(v.archetypeId === "openEHR-EHR-EVALUATION.gdl_result_details.v1"){
                            	bmiDetails = v.value.value;
                            	kategorija = bmiDetails;
                            	console.log("BMIdetails: " + bmiDetails);
                            	
                       		}
                    	}//else
    				})//function
    			}//if
    		}
    	}
    });
}

function izpisRezultatov(bmi){
	$("#rezultati").show();
	bmi = bmi.split(" ")[0];
	$("#rez1").append("Vaš BMI znaša: " + bmi);
	if(bmi<25){	//vredu
		$("#rez2").text("Vaša telesna teža je normalna. Jeste lahko karkoli. Tu je nekaj predlogov kuharskih spletnih strani:");
		$("#rez3").html("<ul><li><a href='http://www.reciperoulette.tv/#?recipe=474' target='_blank'>RecipeRoulette.com</a></li><li><a href='http://www.kulinarika.net/' target='_blank'>kulinarika.net</a></li></ul>");
	}
	else if(bmi<30){ //prekomerna teža
		$("#rez2").text("Imate rahlo prekomerno telesno težo. Predlagali vam bomo nekaj shujševalnih programov:");
		$("#rez3").html("<ul><li><a href='http://www.health.com/health/gallery/0,,20678467,00.html' target='_blank'>Health.com</a></li><li><a href='http://www.myrecipes.com/weight-loss-recipes' target='_blank'>myRecipes.com</a></li>");
	}else{	//debelost
		$("#rez2").text("Vaša telesna teža je prekomerna. Svetujemo vam, da se s specialistom posvetujete o nadaljnih ukrepih. Predlagamo naslednji seznam zdravnikov:");
	}
}

//FUNKCIJE ZA RANDOM PACIENTA ####################
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

	var oldCurrEHR = currentEHR;
	dodajNovegaPacienta1(ime, priimek, datRoj);
	$("#newUsrDiv").hide();
	$("#rezultati").hide();
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
		case "Meghan Trainor":	//primer prelahkega
			ustvariRandomPacienta("Meghan", "Trainor", "1994-2-12", 70, 160, "2010-5-3", 10);
			break;
	}
}
//########################################

function drawGraph(){
	$(document).ready(function(){
		var margin = {top: 20, right: 20, bottom: 30, left: 40},
			width = document.getElementById("d3jsGraph").offsetWidth - 50;
			height = 200;

		var x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(10);

		var svg = d3.select("#d3jsGraph").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		//vir: http://www.telegraph.co.uk/health/healthnews/8302317/Obesity-tables-which-nations-have-the-highest-BMIs-in-Western-Europe.html
		d3.tsv("menObesity.tsv", type, function(error, data) {
		  x.domain(data.map(function(d) { return d.drzava; }));
		  y.domain([0, d3.max(data, function(d) { return d.procent; })]);

		  svg.append("g")
			  .attr("class", "x axis")
			  .attr("transform", "translate(0," + height + ")")
			  .call(xAxis)
			  .selectAll("text")  
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", ".15em")
				.attr("transform", function(d) {
					return "rotate(-20)" 
					});

		  svg.append("g")
			  .attr("class", "y axis")
			  .call(yAxis)
			.append("text")
			  .attr("transform", "rotate(-90)")
			  .attr("y", 6)
			  .attr("dy", ".71em")
			  .style("text-anchor", "end")
			  .text("Procent prebivalstva");

		  svg.selectAll(".bar")
			  .data(data)
			.enter().append("rect")
			  .attr("class", "bar")
			  .attr("x", function(d) { return x(d.drzava); })
			  .attr("width", x.rangeBand())
			  .attr("y", function(d) { return y(d.procent); })
			  .attr("height", function(d) { return height - y(d.procent); });

		});

		function type(d) {
		  d.procent = +d.procent;
		  return d;
		}
	});
}













