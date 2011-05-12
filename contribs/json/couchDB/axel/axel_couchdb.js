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
	
	// Init the connection and keep the database name
	connect : function(database){
		this.db = new CouchDB(database);
		this.dbName = "/"+database;
	},
	
	// We use this method to save a template's data the first time
	saveTemplate : function(id, data){
		var json_tmp = {};
		json_tmp._id = id;
		json_tmp.root = data;
		this.db.save(json_tmp);
	},
	
	// This method delete a given template's data
	deleteTemplate : function(id, rev){
		return this.db.deleteDoc({"_id":id, "_rev":rev});
	},
	
	// We use this method to update template's data
	updateTemplate : function(id, data, rev){
		var json_tmp = {};
		json_tmp._id = id;
		json_tmp._rev = rev;
		json_tmp.root = data;
		this.db.save(json_tmp);
	},
	
	// This function maque the request we want depending on args.
	// This is similar as couchDB.request(type,option) method
	request : function(type,query){
		return this.getResult(this.db.request(type,query));
	},
	
	// We use this method to list the template's data documents
	listeTemplate : function(){
		return this.request("GET",(this.dbName+"/_all_docs"));
	},
	
	// We use this method to load template's data from a given document
	loadTemplate : function(id){
		return this.request("GET",(this.dbName+"/"+id));
	},
	
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
		// TODO ?
	}
	
}




