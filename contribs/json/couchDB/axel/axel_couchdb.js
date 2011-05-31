/**
	* This is a class use to simplify the couchDB access for Axel lib.
	* We use this class to save template's data into couchDB
	* This class must include before couch.js, json2.js, json.js to work !
	*
	*
	* <script src="../script/couch.js" type="text/javascript" charset="utf-8"></script>
	* <script src="../script/json2.js" type="text/javascript" charset="utf-8"></script>
	* //<script src="json.js" type="text/javascript" charset="utf-8"></script>
	* //<script src="axel_couchdb.js" type="text/javascript" charset="utf-8"></script>
	*
	**/



couchDB_util = function () {
	this.db = {};
	this.dbName = "";
}

couchDB_util.prototype = {

	/////////////////
	// CONNEXION   //
	/////////////////	
	// Init the connection and keep the database name
	// Default use without login and password !!
	// @database: the name of the database
	connect : function(database){
		this.db = new CouchDB(database);
		this.dbName = "/"+database;
	},
	
	/////////////////
	// SAVE DATA   //
	/////////////////
	// We use this method to save a template's data the first time
	// @id: template's data's name
	// @data: Data from the template saved
	saveData : function(id, data){
		var json_tmp = {};
		json_tmp._id = id;
		json_tmp.root = data;
		this.db.save(json_tmp);
	},
	
	/////////////////
	// DELETE DATA //
	/////////////////
	// This method delete a given template's data
	// @id: template's data's name
	// @rev: revision id from couchDB
	deleteData : function(id, rev){
		return this.db.deleteDoc({"_id":id, "_rev":rev});
	},
	
	/////////////////
	// UPDATE DATA //
	/////////////////
	// We use this method to update template's data
	// @id: template's data's name
	// @data: Data from the template saved
	// @rev: reviosion id from couchDB
	updateData : function(id, data, rev){
		var json_tmp = {};
		json_tmp._id = id;
		json_tmp._rev = rev;
		json_tmp.root = data;
		this.db.save(json_tmp);
	},
	
	/////////////////
	// REQUEST     //
	/////////////////
	// This function maque the request we want depending on args.
	// This is similar as couchDB.request(type,option) method
	// @type: query's type (GET,PUT,...)
	// @query: couchDB's query
	request : function(type,query){
		return this.getResult(this.db.request(type,query));
	},
	
	/////////////////
	// LIST DATA   //
	/////////////////
	// We use this method to list the template's data documents
	listeTemplateData : function(){
		return this.request("GET",(this.dbName+"/_all_docs"));
	},
	
	/////////////////
	// LOAD DATA   //
	/////////////////
	// We use this method to load template's data from a given document
	// @id: template's data's name
	loadData : function(id){
		return this.request("GET",(this.dbName+"/"+id));
	},
	
	/////////////////
	// EXTRACT INFO//
	/////////////////
	// This method is used to return the JSON str response from the couchDB XMLHTTPRequest
	getResult : function(XMLHTTPRequest){
		eval(("var tmp = "+XMLHTTPRequest.responseText+";"));
		return tmp;
	},
	
	// This method add the necessary field for couchDB
	// By convention :
	// _id : name of the template's data (must be known)
	// _rev: the revision information needed for update
	// root: to store our JSON data
	constructJSON : function(id, rev, data){
		// IMPLEMENTATION ?
		// DEPEND ON APPLICATION WANTED
	},
	
	////////////////////////
	// QUERY MAP - REDUCE //
	////////////////////////
	// Function use to do a map reduce server's side query.
	// @map: map function
	// @reduce: reduce function
	// @option: option
	// @keys: keys constraints
	// @language: other language if not javascript
	query : function(map, reduce, option, keys, language){
		return this.db.query(map, reduce, option, keys, language);
	},
	
	//////////////
	// SEARCH   //
	//////////////
	// This function is used for search a keyword inside all the documents stored.
	// It does not do any distinction within template's data
	// Basicaly isolate every "$text" then check if the word is inside, and return
	// the template's data's name if yes.
	//
	// This function use map-reduce on couchDB's side.
	searchCouchDB : function(word){
		
		/* // Developped version of MAP function
		
		var map = function(doc, keyword) {
			if (doc.root) {	
				var result = [];
				
				var find$text = function(elem, tab){
					for(var i in elem){
						if(typeof elem[i] == "object"){
							tab = find$text(elem[i],tab);
						} else {
							if(i == "$text"){
								tab.push(elem[i]);
							}
						}
					}
					return tab;
				};
				
				var temps = find$text(doc.root, result);
	
				for(var i in temps){
					if(temps[i] == keyword){
						emit();
						break;
					}
				}
	    }
		}
		
		*/
		
		// To avoid javascript injections !
		word = word.replace(/;/gi,'');
		word = word.replace(/\'/gi,'');
		word = word.replace(/\"/gi,'');
		word = word.replace(/\//gi,'');
		word = word.replace(/\\/gi,'');
		
		// MAP function passed to couchDB
		var mapString = "var map = function(doc) {if (doc.root) {	var result = [];var find$text = function(elem, tab){for(var i in elem){if(typeof elem[i] == \"object\"){tab = find$text(elem[i],tab);} else {if(i == \"$text\"){tab.push(elem[i]);}}}return tab;};var temps = find$text(doc.root, result);for(var i in temps){if(temps[i] == \""+word+"\"){emit();break;}}}}";

		eval(mapString);
		
		var jsonResult = this.query(map,null,null,null,null);

		// Formating Result For The Exemple
		
		var formatedResult = [];
		
		for(var i in jsonResult.rows){ 
			formatedResult.push(('<a onclick="load(\''+jsonResult.rows[i].id+'\');">'+jsonResult.rows[i].id+'</a><br />'));
		}

		return formatedResult;
	}
	
}




