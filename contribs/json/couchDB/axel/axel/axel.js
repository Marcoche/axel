/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file contains files from the Adaptable XML Editing Library (AXEL)
 * Version 1.1.2-beta (Rev 260)
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Contributors(s) : Stephane Sire, Antoine Yersin, Jonathan Wafellmann, Useful Web Sàrl 
 * 
 * ***** END LICENSE BLOCK ***** */
 /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */
 
/*
 * Single global object used by XTiger Forms library. 
 */
if (typeof xtiger == "undefined" || !xtiger) {
	var xtiger = {};	
	xtiger.COMPONENT = 1; // XTiger node type constants
	xtiger.REPEAT = 2;
	xtiger.USE = 3;
	xtiger.BAG = 4;         
	xtiger.ATTRIBUTE = 5;	
	xtiger.SERVICE = 6;	// extension
	xtiger.UNKNOWN = -1;	
}

// the following modules will be filled by other library files
/** @namespace Contains parsing facilities to handle the XTiger XML language */
xtiger.parser = {};
/** @namespace Contains editors and plugins */
xtiger.editor = {};
/** @namespace Contains services */
xtiger.service = {};
/** @namespace Contains utilities to make the library cross-browser */
xtiger.cross = {};
/** @namespace Contains various utility methods */
xtiger.util = {};

/**
 * Single global object that contains DOM dependent methods which may also 
 * depend of the user agent.
 */
if (typeof xtdom == "undefined" || !xtdom) {
	xtdom = {};	
}

/**
 * Contains methods for managing the modules under the xtiger namespace.
 * It will evolve toward dynamical module loading.
 */
// xtiger.util.Loader = {};

/**
 * Associates a hash storage with a document. This is used to share objects for the life time
 * of a document, such as a keyboard manager, a tabgroup manager, etc.
 */

// a simpe Hash could be enough to manage sessions but maybe we will add methods in the future
xtiger.util.Session = function () {	
	this.store = {};
}

xtiger.util.Session.prototype = {	
	save : function (name, object) {
		this.store[name] = object;
	},
	load : function (name) {
		return this.store[name];
	}
}

// Lazily extends document object with a xtiger.util.Session object and/or returns it.
// @doc is the document to extend
// We use this method (document extension) because if the document is deleted by the user
// then it's session will also be deleted without the need to call a Session.delete() method
xtiger.session = function (doc) {
	if (! doc._xtigerSession) {
		doc._xtigerSession = new xtiger.util.Session ();
	}
	return doc._xtigerSession;
}

/**
 * Resource manager for managing access to UI resources (icons at that time)
 * It could evolve to also manage error messages and i18n
 */
xtiger.util.Resources = function () {	
	this.bundles = {}; // raw bundles (no paths)
	xtiger.bundles = {}; // "mount" point for exporting bundles to the editors
}

xtiger.util.Resources.prototype = {
	// Copies keys from the bundle name into xtiger.bundles namespace
	_mountBundle : function (name, baseurl) {
		var bsrc = this.bundles[name];
		var bdest = xtiger.bundles[name];
		for (var k in bsrc) {
			bdest[k] = baseurl + name + '/' + bsrc[k];
		}		
	},	
	// A bundle is just a hash where each key points to an icon file name
	// It is expected that there will be one bundle for each editor that need to display icons in the UI	
	addBundle : function (name, bundle) { 
		this.bundles[name] = bundle;
		xtiger.bundles[name] = {}; // makes the "mount" point
		for (var k in bundle) { // copy icon URLs 
			xtiger.bundles[name][k] = bundle[k]; // although it should be copied with setBase()
		}			
	},
	// Sets the base path for all the icon URLs in all the bundles
	setBase : function (baseUrl) {
		if (baseUrl.charAt(baseUrl.length -1) != '/') { // forces a trailing slash
			baseUrl = baseUrl + '/';
		}		
		for (var bkey in this.bundles) {
			this._mountBundle(bkey, baseUrl);
	 	}		
	}
}

// Resource manager instance (Singleton)
xtiger.resources = new xtiger.util.Resources ();
// bundles will be mounted under "xtiger.bundles"

/**
 * Central factory registry 
 * This allows to share some classes (essentially devices) between editors with decoupling
 */
xtiger.util.FactoryRegistry = function () {	
	this.store = {};
}

xtiger.util.FactoryRegistry.prototype = {	
	
	registerFactory : function (name, factory) {  
		if (this.store[name]) {
			alert("Error (AXEL) attempt to register an already registered factory : '" + name + "' !");
		} else {
			this.store[name] = factory;
		}
	},
	
	getFactoryFor : function (name) {
		if (! this.store[name]) {
			alert("Fatal Error (AXEL) unkown factory required : '" + name + "' \nYour editor will NOT be generated !");
			// FIXME: we could return a "dummy" factory that would return a "dummy" factory to getInstance
		} else {
			return this.store[name];
		}
	}
}

// Resource manager instance (Singleton)
xtiger.registry = new xtiger.util.FactoryRegistry ();
xtiger.factory = function (name) {	return xtiger.registry.getFactoryFor(name); } // simple alias

/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * This file declares xtdom functions which are not browser dependent
 * Browser dependent functions are declared either in defaultbrowser.js or iebrowser.js
 */

xtdom.counterId = 0;
	
xtdom.genId = function () {
	return xtdom.counterId++;
}

xtdom.createTextNode = function (doc, text) {
	return doc.createTextNode(text);
}

xtdom.hasAttribute = function (node, name) {
	return node.hasAttribute(name);
}

/**
 * Removes the elemet passed as parameter
 */
xtdom.removeElement = function (element) {
	var _parent = element.parentNode;
	if (! _parent)
		return; // Sanity check, don't remove elements that are not in DOM
	_parent.removeChild(element);
}

// Returns true if node is an XTiger element or if it contains at least one
xtdom.containsXT = function (node) {
	if (node.nodeType == xtdom.ELEMENT_NODE) {
		if (xtdom.isXT(node)) {
			return true; 
		} else {
			if (node.childNodes && node.childNodes.length > 0) {
				for (var i = 0; i < node.childNodes.length; i++) 
					if (xtdom.containsXT(node.childNodes[i])) {
						return true;
					}
			}
		}
	}	
	return false;
}

// Returns the first 'xt:menu-marker' element within node or false otherwise
xtdom.getMenuMarkerXT = function (node) {
	var res = false;
	var results = xtdom.getElementsByTagNameXT(node, 'menu-marker');
	if (results.length > 0) {
		res = results[0];
	}
	return res;	
}         
                    
// Returns a string representing the tag name associated with a XTiger Node
xtdom.getTagNameXT = function (node) {    
	var key = (xtiger.ATTRIBUTE == xtdom.getNodeTypeXT(node)) ? 'name' : 'label';
	return node.getAttribute(key);
}

// Returns a string representing the content of an XTiger node or false if content is empty
// Pre-condition: the node is supposed to contain only plain text or to contain only HTML elements
// in which case the innerHTML of the children will be concatenated (first level tag names are removed)
// This is the case for instance of a xt:use of a "string" primitive type
// FIXME: that method should be able to dump any content (including XML) but innerHTML does not work on node
// which is not an HTML node (it's an xt:use)
xtdom.extractDefaultContentXT = function (node) {
	var dump = false;   
	if (xtiger.ATTRIBUTE == xtdom.getNodeTypeXT(node)) {
		dump = node.getAttribute('default');
	} else if (node.childNodes) {
		for (var i = 0; i < node.childNodes.length; i++) {
			var str;
			var cur = node.childNodes[i];
			if (cur.nodeType == xtdom.ELEMENT_NODE) {
				str = cur.innerHTML;
			} else { // assumes TEXT_NODE
				str = cur.nodeValue;
			}				
			if (dump) {
				dump += str;
			} else {
				dump = str;
			}
		}
	}
	return dump;
}

// Returns the first DOM Element node which is a child of node or undefined otherwise
xtdom.getFirstElementChildOf = function (node) {
	var res;
	for (var i=0; i < node.childNodes.length; i++) {   
		if (node.childNodes[i].nodeType == xtdom.ELEMENT_NODE) {
			res = node.childNodes[i];
			break;
		}			
	}
	return res; 
}

// Inserts all the nodes in nodes in the target DOM just after target
// As a side effect all the nodes are removed from nodes
xtdom.moveNodesAfter = function (nodes, target) {
	var n;   
	// sets next to the next sibling after target if it exists or to null otherwise
	if (target.nextSibling) {
		var next = target.nextSibling;
		while (n = nodes.shift()) {
			next.parentNode.insertBefore(n, next);
		}
	} else { // it was the last sibling...
		while (n = nodes.shift()) {
			target.parentNode.appendChild(n);
		}		
	}
}

xtdom.moveChildrenOfAfter = function (parentSrc, target) {
	var n;   
	// sets next to the next sibling after target if it exists or to null otherwise
	if (target.nextSibling) {
		var next = target.nextSibling;
		while (n = parentSrc.firstChild) {
			parentSrc.removeChild (n);
			next.parentNode.insertBefore(n, next);
		}
	} else { // it was the last sibling...
		while (n = parentSrc.firstChild) {
			parentSrc.removeChild (n);
			target.parentNode.appendChild(n);
		}		
	}
}

// Imports a copy of all the child nodes of a source node into a target node.
// targetDoc is the target document
// destNode is the target node and it must be owned by targetDoc
xtdom.importChildOfInto = function (targetDoc, srcNode, destNode) {
	for(var i = 0; i<srcNode.childNodes.length; i++) {
		var src = srcNode.childNodes[i];
		var copy = xtdom.importNode (targetDoc, srcNode.childNodes[i], true);
		destNode.appendChild(copy);		
	}
}
	
// Replaces the node "former" by all the children of the node "newer"
// Prec-condition: former and newer must be owned by the same document
// The "former" node must have a parent node, it must not be a dangling node
// At the end, "newer" is an empty node
// accu is a list of the nodes which have been moved
xtdom.replaceNodeByChildOf = function (former, newer, accu) {
	var parent = former.parentNode;
	var n;
	while (n = newer.firstChild) {
		newer.removeChild (n);
		parent.insertBefore (n, former, true);	
		if (accu) {
			accu.push (n);
		}
	}
	parent.removeChild(former);	
}

// FIXME: shouldn't we purge event handlers before 
// see http://www.crockford.com/javascript/memory/leak.html
xtdom.removeChildrenOf = function (aNode) {
	aNode.innerHTML = "";
	// var n;
	// while (n = aNode.firstChild) {
	// 	aNode.removeChild(n);
	// }		
}
	
/// Pre-requisite: former and newer must belong to the same document	
xtdom.moveChildOfInto = function (former, newer, accu) {
	var n;
	// inserts the child of former into newer
	while (n = former.firstChild) {
		former.removeChild (n); // FIXME: maybe useless (DOM API removes nodes when moving them) ?
		newer.appendChild (n); // FIXME: maybe no cross-browser !!! 
		if (accu) {
			accu.push (n);
		}
	}		
}

// Returns the value of the display property of the DOM aNode if it has been defined inline
// (i.e. directly in the markup). Returns an empty string otherwise
xtdom.getInlineDisplay = function  (aNode) {
	var res = '';
	if ((aNode.style) && (aNode.style.display)) {
		res = aNode.style.display;
	}
	return res;
}

xtdom.getSelectedOpt = function (sel) {
	for (var i = 0; i < sel.options.length; i++) {
        	if (sel.options[i].selected) {
			break;
	    }
	}
	return i;
}

xtdom.setSelectedOpt = function (sel, index) {
	sel.selectedIndex = index; // FIXME: is it cross-browser ?
} 

xtdom.addClassName = function (node, name) {
	// FIXME: currently the test is fooled by an already set class name that contains name 
	if (node.className) {
		if (node.className.search(name) == -1) {
			if (node.className.length == 0) {
				node.className = name;
			} else {
			 	node.className += " " + name;
			}
		} // else it already has the class name (or a sub-set)
	} else {
		node.className = name;
	}
}

xtdom.removeClassName = function (node, name) {
	// FIXME: see addClassName
	if (node.className) {
		var index = node.className.search(name);
		if (index != -1) {
			node.className = node.className.substr(0, index) + node.className.substr(index + name.length);
		}
	}
}

xtdom.replaceClassNameBy = function (node, formerName, newName) {
	// FIXME: see addClassName	
	var index = node.className.search(formerName);
	if (index != -1) {
		node.className = node.className.substr(0, index) + newName + node.className.substr(index + formerName.length);
	} else {
		xtdom.addClassName (node, newName);
	}	
}

/**
 * @param {string} aStyle A CSS style given as dashed parameter (foo-bar, not fooBar)
 */
xtdom.getComputedStyle = function (aNode, aStyle) {
	if (!aNode || !aNode.ownerDocument) // Safety guard
		return null;
	var _doc = aNode.ownerDocument;	
	if (window.getComputedStyle) {
		return window.getComputedStyle(aNode, null).getPropertyValue(aStyle);
	}
	else if (aNode.currentStyle) {
		aStyle = aStyle.replace(/\-(\w)/g, function (strMatch, p1){
			return p1.toUpperCase();
		});
		return aNode.currentStyle[aStyle];
	}
	return null; // TODO remove, only for debugging purpose
}

//From http://www.quirksmode.org/js/findpos.html
// Finds the absolute position of object obj relatively to the body !
xtdom.findPos = function (obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		curleft = obj.offsetLeft
		curtop = obj.offsetTop
		if (document.defaultView)
			var position = document.defaultView.getComputedStyle(obj,null).getPropertyValue('position');
		else if (document.uniqueID)
			var position = obj.currentStyle.position;
		if (obj.scrollTop && (position == 'absolute')) {
			curtop -= obj.scrollTop;
		}		
		if (obj.scrollLeft && (position == 'absolute')) {
			curleft -= obj.scrollLeft;
		}				
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft
			curtop += obj.offsetTop
			if (document.defaultView)
				var position = document.defaultView.getComputedStyle(obj,null).getPropertyValue('position');
			else if (document.uniqueID)
				var position = obj.currentStyle.position;
			if (obj.scrollTop && (position == 'absolute')) {
				curtop -= obj.scrollTop;
			}			
			if (obj.scrollLeft && (position == 'absolute')) {
				curleft -= obj.scrollLeft;
			}							
		}
	}
	return [curleft,curtop];
};

/**
 * <p>
 * Returns the absolute position (top-left corner) of the given element, that
 * is, the offset that will place the given element at his current position if
 * its position attribute is "absolute". The position is given relatively of the
 * containing block (see CSS spec) of the given element.
 * </p>
 * 
 * From http://www.quirksmode.org/js/findpos.html
 * 
 * <p>
 * NOTE The method does not support (yet) floating elements and may reacts
 * imprevisibly if such elements are encountered.
 * </p>
 * 
 * @param {DOM Document}
 *            aDocument The document that contains the element to analyse
 * @param {HTMLElement}
 *            aElement An HTML element from which the position is deduced
 * @return {integer[]} An array representing the top and the left absolute
 *         offset
 */
xtdom.findPosAsSibling = function (aDocument, aElement) {
	var _curleft = _curtop = 0;
	var _obj = aElement;
	if (_obj.offsetParent) {
		_curleft += _obj.offsetLeft;
		_curtop += _obj.offsetTop;
		
		while (_obj = _obj.offsetParent) {
			if (aDocument.defaultView)
				var _pos = aDocument.defaultView.getComputedStyle(_obj, null).getPropertyValue('position');
			else if (a)
			/* correcting scroll */
			if (_obj.scrollTop && _pos == 'absolute') {
				_curtop -= _obj.scrollTop;
			}			
			if (_obj.scrollLeft && (_pos == 'absolute')) {
				_curleft -= _obj.scrollLeft;
			}
			if (_pos == 'absolute' || _pos == 'fixed' || _pos == 'relative')
				break; // The containing block is found
			
			_curleft += _obj.offsetLeft;
			_curtop += _obj.offsetTop;
		}
	}
	return [_curleft, _curtop];
}

/**
 * <p>
 * returns true if the second
 * </p>
 */
xtdom.isOffsetAncestorOf = function (aNode, anAncestor) {
	var _n = aNode.offsetParent;
	while(_n != null) {
		if (_n === anAncestor)
			return true;
		_n = _n.offsetParent;
	}
	return false;
}

/**
 * <p>
 * This method is used to find the following position: Given a reference node
 * and a container (that is, an HTML element able to contains a block HTML
 * element), we want to insert into the container a node that, when positioned
 * with absolute positioning and the offsets returned by this method, is
 * displayed right above the given reference node.
 * </p>
 *
 * @deprecated
 * 
 * @param {HTMLElement}
 *            aElement An HTML element from which the position is deduced
 * @param {HTMLElement}
 *            aElement An HTML element that contains the first one
 */
xtdom.findPostitionFrom = function (aNode, aContainer) {
	if (!aNode || !aContainer)
		return null;
	var _document = aNode.ownerDocument;
	var _offsetAncestor = aContainer;
	while(!xtdom.isOffsetAncestor(aNode, _offsetAncestor))
		_offsetAncestor = _offsetAncestor.offsetParent;
	
}        
          
// Returns an array with the width and height of aHandle's window   
// plus the scroll width and height
// This is useful to calculate how far aHandle (in absolute position)
// is to the window border
// From http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
xtdom.getWindowLimitFrom = function (aHandle) {  
  var myWidth = 0, myHeight = 0, scrollLeft = 0, scrollTop = 0;
  var oDoc = aHandle.ownerDocument;                
  var win= oDoc.defaultView || oDoc.parentWindow;  
  // in case template shown inside an iframe

  // 1. Dimension
  if( typeof( win.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = win.innerWidth;
    myHeight = win.innerHeight;
  } else if( oDoc.documentElement && ( oDoc.documentElement.clientWidth || oDoc.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = oDoc.documentElement.clientWidth;
    myHeight = oDoc.documentElement.clientHeight;
  } else if( oDoc.body && ( oDoc.body.clientWidth || oDoc.body.clientHeight ) ) {
    //IE 4 compatible
    myWidth = oDoc.body.clientWidth;
    myHeight = oDoc.body.clientHeight;
  }       
                
  // 2.  Scrolling 
  if( typeof( win.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrollTop = win.pageYOffset;
    scrollLeft = win.pageXOffset;
  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
    //DOM compliant
    scrollTop = document.body.scrollTop;
    scrollLeft = document.body.scrollLeft;
  } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrollTop = document.documentElement.scrollTop;
    scrollLeft = document.documentElement.scrollLeft;
  }

  return [myWidth + scrollLeft, myHeight + scrollTop];      
  // FIXME: add correction with scrollLeft
}/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/* 
 * An DOMDataSource contains some XML data that can be loaded into an editor built from an XTiger template
 * This implementation encapsulates an XML Document object containing the data, which is either
 * passed directly (initFromDocument) or which can be passed from a string (initFromString)
 */
xtiger.util.DOMDataSource = function (sources) {	
	var d; // XML document
	this.xml = null; // main XML data
	this.flow = {}; // seperate flows
	this.stack = [];  
	if (sources) {
		if (sources.constructor === {}.constructor) { // hash list case
			for (var k in sources) {
				d = sources[k];
				if (d) { // sanity check
					(k == 'document') ? this.initFromDocument(d) : this.initFlowFromDocument(d, k);
				}
			}
		} else {
			this.initFromDocument (sources); // assumes it's a single document
		}	
	}
}

xtiger.util.DOMDataSource.prototype = {

	// Return true of the data source has been initialized, false otherwise
	hasData : function () {
		return (null != this.xml);
	},   
	
	// Internal method to set root document from a DOM element node
	_setRootNode : function (n) {
		this.xml = n;
	},
	
	// Internal method to set a flow document from a DOM element node
	_setFlowNode : function (name, n) {
		this.flow[name] = [0, n]; // 0 means uninitialized
	},
	
	// Internal method to initialize the source from a DOM element node
	// Pre-condition: tide is a <xt:tide> element
	_initFromTide : function (tide) {
		var c = tide.childNodes;
		for (var i = 0; i < c.length; i++) {
			var cur = c.item(i);
			if (cur.nodeType == xtdom.ELEMENT_NODE) {
				if (this.xml == null) { // 1st child has main data
					this._setRootNode(cur);
				} else {
					this._setFlowNode(xtdom.getLocalName(cur), cur);
				}
			}
		}
	},                              

	// DEPRECATED : Initializes data source from a DOM Document 
	// Note that document may be false or undefined to simplify error management
	// Returns true on sucess, false otherwise
	initFromDocument : function (doc) {     
		this.xml = null;                      
		if (doc && doc.documentElement) {
			var root = doc.documentElement;
			// check if it's a document with tide/flow
			var tideOn = root.nodeName == 'tide' || root.nodeName == 'xt:tide'; // FIXME: prefix, case sensitivity
			if (tideOn) {   
				this._initFromTide (root);
			} else {
				this._setRootNode(root);
			}
		}
		return (this.xml != null);
	},
		
	// DEPRECATED
	// FIXME: make name optional and sets the name of the flow from the document root in case it is not defined
	initFlowFromDocument : function (doc, name) { 
		var xml = (doc && doc.documentElement) ? this._setFlowNode(name, doc.documentElement) : false;
		return xml != false;
	},
	
	/**
	 * Inits *this* data source with a string
	 * @param str
	 * @return
	 */
	initFromString : function (str) {
		var res = true;
		try {
			var parser = xtiger.cross.makeDOMParser ();
			var doc = parser.parseFromString(str, "text/xml");
			this.initFromDocument(doc);
		} catch (e) {
			alert('Exception : ' + e.message);
			res = false;
		}
		return res;
	},   
	                                           
	// label, if present, is the opening label corresponding to the opening flow 
	// If both have the same value the root of the flow is considered as belonging 
	// to the target data model otherwise it is just regarded as a flow name
	openFlow : function (name, curPoint, label) {               
		if (this.flow[name]) {      
			if ( 0 === this.flow[name][0]) { // initializes the flow
				if (label && (name == label)) { // 
					this.flow[name] = [name, this.flow[name][1]]; // name is taken as an arbitrary root
				} else {
					this.flow[name] = this.makeRootVector(this.flow[name][1]); // root name is not part of data model 
				}  
			}
			this.stack.push([name, curPoint]);
			return this.flow[name];
		}
		return false;
	},
	
	closeFlow : function (name, curPoint) {      
		var saved = (this.stack.length > 0) ? this.stack[this.stack.length - 1] : false;
		if (saved && (name == saved[0])) { // sanity check
			this.stack.pop();
			if (this.stack.length > 0) {  // FIXME: not sure about this test ?
				// NOT TESTED : For nested flow (e.g. flow a in flow b) - I am really not sure about this...
				this.flow[name] = curPoint;
			} // otherwise the root vector for the flow has been consumed up to the point
			return saved[1]; // restore previous point to continue from	it
		}	
		return false;
	},
	
	// clonePoint : function (point) {
	// 	var msg = '';
	// 	var res = [];
	// 	if (point instanceof Array) {
	// 		for (var i = 0; i < point.length; i++) {
	// 			res.push(point[i]);
	// 			msg = msg + point[i];
	// 		}
	// 	} else {
	// 		res = point;
	// 		msg = point;
	// 	}		
	// 	xtiger.cross.log('data-trace', 'clonePoint cloned', msg);
	// 	return res;		
	// },
	            
	// FIXME: currently for an attribute point it returns the name of the parent node
	// and not the name of the attribute (see getAttributeFor)
	nameFor : function (point) {       
		if (point instanceof Array) {
			return xtdom.getLocalName(point[0]);			
		} else {                          
			return null; // point must be -1
		}
	},
	
	lengthFor : function (point) {
		if (point instanceof Array) {
			return point.length - 1;
		} else {
			return 0;
		}		
	}, 
	
	makeRootVector : function (rootNode) {
		var res = [rootNode];
		if (rootNode) {
			var c = rootNode.childNodes;
			for (var i = 0; i < c.length; i++) {			
				var cur = c.item(i);
				if (cur.nodeType == xtdom.ELEMENT_NODE) {
					res.push(cur);
				}
			}	
		}
		return res;	
	},
	
	// Returns children of the root in an array
	// In our content model, the root node can not have text content
	getRootVector : function () {
		return this.makeRootVector(this.xml);
	},  
	  
	// Returns true if the point contains some content (element nodes, not just text content)
	// for a node called name in FIRST position, or returns false otherwise
	hasDataFor : function (name, point) {
		var res = false;          
		if ('@' == name.charAt(0)) { // assumes point[0] DOM node
			if (point !== -1) {
				res = xtdom.hasAttribute(point[0], name.substr(1));					
			}
		} else if ((point instanceof Array) && (point.length > 1))	{  
			if (point[1] && (point[1].nodeType == xtdom.ELEMENT_NODE)) { // otherwise point has no descendants
				var nodeName = xtdom.getLocalName(point[1]);
				var found = name.search(nodeName);                                                          
				// res =  (found != -1) && ((found + nodeName.length) == name.length) || (name.charAt(found + nodeName.length) == ' ');
				res =  (found != -1) && (((found + nodeName.length) == name.length) || (name.charAt(found + nodeName.length) == ' '));
			}
		}
		return res;
	},     
	         
	// Only terminal data node have a string content (no mixed content in our model)
	// Returns null if there is no data for the point
	getDataFor : function (point) {
		if ((point instanceof Array) && (point.length > 1))	{     
			// FIXME: should we check it's not empty (only spaces/line breaks) ?
			return point[1];
		} else {
			return null;
		}
	},      
	  
	// Returns true if the point is empty, i.e. it contains no XML data nor string (or only the empty string)
	// FIXME: currently a node with only attributes is considered as empty and mixed content maybe be handled 
	// incorrectly
	isEmpty : function (point) {
		var res = false;           
		if ((point instanceof Array) && (point.length > 1)) { 
			// terminal string node or non terminal with children (including mixed content)
			if (point.length == 2) { // then it must be a text string (terminal data node)
				if (typeof(point[1]) == 'string') { 
					res = (point[1].search(/\S/) == -1); // empty string
				}
			}
		} else { // no data for sure (must be -1)
			res = true;
		}
		return res;
	},
	
	// Pre-condition: point must be an Array [n, e1, e2, ...] of DOM nodes
	// Returns the n-th child of node n
	getPointAtIndex : function 	(name, index, point) {	
		var res;
		var n = point.splice(index, 1)[0]; // splice returns an array, hence we take result[0]
		var c = n.childNodes;
		if ((c.length == 1) && (c.item(0).nodeType == xtdom.TEXT_NODE)) {
			var content = c.item(0).data; // FIXME: maybe we should concatenate all the string content (?)
			res = [n, content];			
		} else {
			res = [n];						
			for (var i = 0; i < c.length; i++) {
				var cur = c.item(i);
				if (cur.nodeType == xtdom.ELEMENT_NODE) {
					res.push(cur);
				}
			}													
			if (res.length == 1) { // empty node (treated as null text content)
				res.push(null);
			} 
		}
		return res;		
	},	  
	
	hasVectorFor : function (name, point) {
		if (point instanceof Array)	{
			for (var i = 1; i < point.length; i++) {
				if ((point[i] !== null) && (point[i].nodeType == xtdom.ELEMENT_NODE) && (xtdom.getLocalName(point[i]) == name)) { // since there is no mixed content, this is an Element
					return true;
				}				
			}
		}
		return false;
	},	
	
	// Makes a new point for node labelled name in the current point
	// The returned point is removed from the current point
	// In our content model, the new point is either a text node singleton
	// or it is a vector of element nodes (no mixed content) 
	getVectorFor : function (name, point) {
		if (point instanceof Array)	{
			for (var i = 1; i < point.length; i++) {
				if ((point[i] !== null) && (point[i].nodeType == xtdom.ELEMENT_NODE) && (xtdom.getLocalName(point[i]) == name)) { // since there is no mixed content, this is an Element
					return this.getPointAtIndex(name, i, point);
				}				
			}
		}
		return -1;
	},   
	
	hasAttributeFor : function (name, point) {  
		return (point instanceof Array) && (point[0].getAttribute(name) != null);
	},	
	        
	// Makes a new point for the attribute named 'name' in the current point
	// Quite simple: a point for an attribute is just a [node, value] array
	// that means you cannot use such points for navigation !    
	// FIXME: sanity check against attribute point in getVectorFor...
	getAttributeFor : function (name, point) {  
		var res = -1
		if (point instanceof Array)	{
			var n = point[0]; // FIXME: sanity check even if can't be null per-construction ?
			var attr = n.getAttribute(name);
			if (attr) {
				n.removeAttribute(name);
				res = [n, attr]; // simulates text node
			}
		}
		return res;
	},	
	
	// FORTIFICATION
	hasVectorForAnyOf : function (names, point) {
		if (point instanceof Array)	{
			for (var i = 1; i < point.length; i++) {				
				for (var j = 0; j < names.length; j++) {
					if ((point[i] !== null) && (point[i].nodeType == xtdom.ELEMENT_NODE) && xtdom.getLocalName(point[i]) == names[j]) {
						return true;
					}				
				}
			}
		}
		return false;
	},

	getVectorForAnyOf : function (names, point) {
		if (point instanceof Array)	{
			for (var i = 1; i < point.length; i++) {				
				for (var j = 0; j < names.length; j++) {
					if ((point[i] !== null) && (point[i].nodeType == xtdom.ELEMENT_NODE) && xtdom.getLocalName(point[i]) == names[j]) {
						return this.getPointAtIndex(names[j], i, point);
					}				
				}
			}
		}
		return -1;
	}		
				
} 
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Represents a node in a tree-like memory structure that mimics a DOM for XTiger Forms.
 */         
xtiger.util.PseudoNode = function (type, value) {
	this.type = type;
	this.discard = false;
	if (type == xtiger.util.PseudoNode.ELEMENT_NODE) {
		this.name = value;
		this.attributes = null;
		this.content = null;
	} else {
		this.content = value;
	}
}           
            
xtiger.util.PseudoNode.TEXT_NODE = 0;
xtiger.util.PseudoNode.ELEMENT_NODE = 1;
xtiger.util.PseudoNode.NEWLINE = '\n';

xtiger.util.PseudoNode.prototype = {     

	indent : ['', '  '], // cached space strings for indentation when dumping

	discardNodeIfEmpty : function () {       
		this.discard = true;
	},
	
	addChild : function (c) {
		if (xtiger.util.PseudoNode.TEXT_NODE == c.type) {
			// small optimization: in XTiger Forms models, text nodes are terminal and unique
			this.content = c;
		} else {
			if (! this.content) {
				this.content = [];
			}
			if (this.content instanceof Array) {
				this.content.push(c);
			} else {
				// alert('Attempt to save mixed content in template !');
				xtiger.cross.log('error', 'Mixed content [' + this.content + '] in ' + this.name);
			}
		}
	},
	
	addAttribute : function (name, value) {	
		if (! this.attributes) {
			this.attributes = {};
		}
		this.attributes[name] = value;
	},    

	getIndentForLevel : function (level) {
		if (typeof this.indent[level] != 'string') {  
			var spacer = this.indent[level - 1];
			spacer += this.indent[1];
			this.indent[level] = spacer;
		}
		return this.indent[level];
	},    
	           
	// Returns a string representing the attributes
	// the returned string starts with a space      
	// Pre-condition: this.attributes must exist
	dumpAttributes : function () {
		var text = '';
		for (var k in this.attributes) {
			text += ' ';
			text += k;
			text += '="';
			text += xtiger.util.encodeEntities(this.attributes[k]);
			text += '"';												
		}
		return text;
	},                           

	// Indented (and recursive) dump method
	dump : function (level) {   
		if (xtiger.util.PseudoNode.TEXT_NODE == this.type) {
			return xtiger.util.encodeEntities(this.content);
		} else {    
			var text = this.getIndentForLevel(level); // copy indentation string
			if (this.content) {
				// opening tag
				text += '<';
	      		text += this.name;   
        		if (this.attributes) {
					text += this.dumpAttributes ();
				}
				text += '>'; 
				if (this.content instanceof Array) {   
					text += xtiger.util.PseudoNode.NEWLINE;	 
					for (var i = 0; i < this.content.length; i++) {
						text += this.content[i].dump(level + 1); 
					}			                           
					text += this.getIndentForLevel(level);
				} else {                      
				 	// only one children, this is a text per construction, do not insert NEWLINE					
					text += xtiger.util.encodeEntities(this.content.content); // short circuit recursive call					
				} 
				// closing tag;  
				text += '</';
	      text += this.name;
				text += '>';				
			} else { // empty tag   
				text += '<';
	      text += this.name;    
        if (this.attributes) {
					text += this.dumpAttributes ();
				} else if (this.discard) {
					return ''; // optional node which is empty
				}
				text += '/>';                  
			}                                        
			text += xtiger.util.PseudoNode.NEWLINE;	 
			return text;
		}
	}
}

/**
 * Logs data strings into a tree-like memory structure.
 * This helper object allows to dump an XTiger template content before submitting it to a server.
 */         
xtiger.util.DOMLogger = function () {
	this.stack = [];
	this.curTop = null; // current anchoring point                          
	this.curAttr = null; // can manage one attribute at a time
	this.curFlow = null; 
	this.root = null; // main data flow, lazy creation in OpenTag     
	this.flow = {}; // extra XML data flow, lazy creation in openFlow
	this.flowStack = []; // navigation between flow
}

xtiger.util.DOMLogger.prototype = {
	// Declares the current node as optional if it is empty
	discardNodeIfEmpty : function () {       
		if (this.curTop) { this.curTop.discardNodeIfEmpty() }
	},   
	openAttribute : function (name) {
		this.curAttr = name;		
	},   
	// each flow state is stored is an array [pseudo_root, current_top]
	openFlow : function (name, label) {
		if (! this.flow[name]) {  // creates it
			this.flow[name] = [null, null]; // flow root and curTop not yet defined
		}                                 
		// memorizes the current flow for restoring it in closeFlow
		this.flowStack.push([name, this.curTop, this.curFlow]);
		this.curTop = this.flow[name][1];
		this.curFlow = name;
		return true;
	},
	closeFlow : function (name) { 
		var saved = (this.flowStack.length > 0) ? this.flowStack[this.flowStack.length - 1] : false;
		if (saved && (name == saved[0])) { // sanity check
			this.flowStack.pop();  
			this.flow[name][1] = this.curTop || this.flow[name][0]; // memorizes it for future use
				//  FIXME: in my understanding this.curTop could be removed as it should be null in that case 
				// because no tag can spread on two slices of a flow
			this.curTop = saved[1];
			this.curFlow = saved[2];			
			return true;
		}	
		return false;		
	},
	closeAttribute : function (name) {
		if (this.curAttr != name) {
			alert('Attempt to close an attribute ' + name + ' while in attribute ' + this.curAttr + '!');
		}
		this.curAttr = null;		
	},	
	openTag : function (name) {
		var n = new xtiger.util.PseudoNode (xtiger.util.PseudoNode.ELEMENT_NODE, name);
		if (! this.root) { // stores root for later reuse (e.g. dump)
			this.root = n;      
		} else if (this.curFlow && (! this.flow[this.curFlow][0])) {   
			if (this.curFlow == name) { // checks if flow name and root name are the same
				this.flow[this.curFlow][0] = n; // same: no need to create a tag for the flow
			} else { // different: creates a specific node for the flow root
				var r = new xtiger.util.PseudoNode (xtiger.util.PseudoNode.ELEMENT_NODE, this.curFlow);				
				this.flow[this.curFlow][0] = r;
				r.addChild (n);
			}
		}                            
		if (this.curTop) {
			this.curTop.addChild (n);      
		}
		this.stack.push(this.curTop);
		this.curTop = n;
	},
	closeTag : function (name) {
		this.curTop = this.stack.pop(); // FIXME: sanity check this.stack ?
	},  
	emptyTag : function (name) {
		this.openTag(name);
		this.closeTag(name);
	},
	write : function (text) {                                                      
	 // FIXME: sanity check this.curTop ?
		if (this.curAttr) {
			this.curTop.addAttribute(this.curAttr, text);
		} else {       			
			var n = new xtiger.util.PseudoNode(xtiger.util.PseudoNode.TEXT_NODE, text);		 
			this.curTop.addChild (n);
	 }
	},
	// Adds an attribute to the current node at the top 
	writeAttribute : function (name, value) {
		this.curTop.addAttribute(name, value);
	}, 
	// target is the name of the flow to dump, 'document' means main document
	// level should be 0 or 1  (see xtiger.util.PseudoNode.indent[level])
	_dump : function (target, level) {
		if (target == 'document') {
			if (this.root) {
				return this.root.dump(level);
			} else {
				return xtiger.util.PseudoNode.prototype.indent[level] + '<document/>\n'; // FIXME: use xt:head label
			}
		} else {
			if (this.flow[target]) {
				return this.flow[target][0].dump(level); 
			} else {
				return xtiger.util.PseudoNode.prototype.indent[level] + '<' +  target + '/>\n';
			}			
		}
	},
	// Pretty prints XML content to a string
	// The optional selector argument tells what and how to dump:
	// undefined, '' or 'document' : dumps only the main document standalone
	// '*' : dumps as a standalone document if no flows, otherwise dumps the tide
	// ['*'] : dumps whole document and flows as a tide (even if document is no tide)
	// ['document'] : dumps main document within a tide
	// 'name' : dumps only flow named "name" standalone
	// ['document', 'name1', 'name2', ...] : dumps requested flows within a tide 
	dump : function (selector) {
		var todo;		
		var target = selector || 'document';
		if ((target instanceof Array) || (target == '*')) { // most probably a tide
			if (((target instanceof Array) && (target[0] == '*'))
				|| ((target == '*') && (xtiger.util.countProperties(this.flow) > 0))) {
				todo = ['document'];
				for (var k in this.flow) {
					todo.push(k);
				}				
			} else {
				todo = (target == '*') ? 'document' : target;
			}
		} else {
			todo = target;
		}
		if (todo instanceof Array) { // tide
			var output = [];			
			output.push('<xt:tide xmlns:xt="' + xtiger.parser.nsXTiger + '">\n');
			for (var i = 0; i < todo.length; i++) {
				output.push(this._dump(todo[i], 1));
			}
			output.push('</xt:tide>\n');
			return output.join('');			
		} else {
			return this._dump(todo, 0); 
		}
	},
	// DEPRECATED ?
	close : function () {	} 
}/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin, Jonathan Wafellman 
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * The xtiger.cross object is a single global object used by XTiger Library. 
 * It contains utility function for adapting the library to different browsers.
 * @module xtiger.cross
 */

// user agent detection
xtiger.cross.UA = {
	IE:   !!(window.attachEvent && navigator.userAgent.indexOf('Opera') === -1),
	opera:  navigator.userAgent.indexOf('Opera') > -1,
	webKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
	gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
	mobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)	
}

if (! (xtiger.cross.UA.gecko || xtiger.cross.UA.webKit || xtiger.cross.UA.IE || xtiger.cross.UA.opera ||  xtiger.cross.UA.mobileSafari)) {
	xtiger.cross.log ('warning', 'XTiger Forms could not detect user agent name, assuming a Gecko like browser');
	xtiger.cross.UA.gecko = true;
}           

xtiger.util.countProperties = function (o) {
	var total = 0;
	for (var  k in o) if (o.hasOwnProperty(k))	total++;
	return total;
}

// Two utility functions to encode/decode XML entities
xtiger.util.encodeEntities = function (s) {
	if (typeof(s) != "string") { // FIXME: isn't it too costly here ?
		// maybe it's a number
		return s; 
	}
	var res = s;
	if (s.indexOf('&') != -1) {
		res = res.replace(/&(?![a-zA-Z]{3,5};)/g, '&amp;'); // Avoid double encoding
 	}
	if (s.indexOf('<') != -1) {        
		res = res.replace(/</g, '&lt;');	
	} 
	if (s.indexOf('>') != -1) {        
		res = res.replace(/>/g, '&gt;');	
	} 
	return res;
}
              
// Not used yet because it seems the native XML parser converts entities on the fly when loading an XML document
// (at least on FireFox)
xtiger.util.decodeEntities = function (s) {
	if (s.indexOf('&amp;') != -1) {
		var res = s.replace(/&amp;/g, '&');
		if (s.indexOf('<') != -1) {
			return res.replace(/&lt;/g, '<');	
		}                                   
		return res;
	}
	return s;
}

/**
 * Parses the "param" attribute of &lt;xt:use&gt; elements. It stores the
 * parsing results in the provided hash.
 * 
 * @param {string}
 *            aString The string content of the "param" attribute
 * @param {object}
 *            aParams A hash where to store the parsed results
 */
xtiger.util.decodeParameters = function (aString, aParams) {
	if (!aString)
		return;
	var _tokens = aString.split(';');
	for (var _i = 0; _i < _tokens.length; _i++) {
		var _parsedTok = _tokens[_i].split('=');
		var _key = _parsedTok[0].replace(/^\s*/, '').replace(/\s*$/, ''); // Trim    
		if (_key == 'class') { // pb with 'class' key in js on Safari
		  _key = 'hasClass';
		}
		aParams[_key] = _parsedTok[1];
	}
}  

/**
 * Adds all properties and methods of props to obj. This addition is
 * "prototype extension safe", so that instances of objects will not
 * pass along prototype defaults.
 * 
 * Mainly copied form the DOJO toolkit library.
 */
xtiger.util.mixin = function mixin (/*Object*/ obj, /*Object*/ props) {
	var tobj = {};
	for(var x in props){
		// the "tobj" condition avoid copying properties in "props"
		// inherited from Object.prototype.  For example, if obj has a custom
		// toString() method, don't overwrite it with the toString() method
		// that props inherited from Object.protoype
		if((typeof tobj[x] == "undefined") || (tobj[x] != props[x])){
			obj[x] = props[x];
		}
	}
	// IE doesn't recognize custom toStrings in for..in
	if(xtiger.cross.UA.IE 
		&& (typeof(props["toString"]) == "function")
		&& (props["toString"] != obj["toString"])
		&& (props["toString"] != tobj["toString"]))
	{
		obj.toString = props.toString;
	}
	return obj; // Object
}             

/**
 * Implements the "map" feature for arrays.
 * 
 * This function does not affect the given array. It returns a freshly created
 * one.
 */
xtiger.util.array_map = function array_map (aArray, aCallback) {
	if (! (typeof aArray == 'object' && typeof aCallback == 'function'))
		return aArray;
	var _buf = [];
	for (var _i = 0; _i < aArray.length; _i++) {
		_buf[_i] = aCallback(aArray[_i]);
	}
	return _buf;
}

/**
 * Implements the "filter" feature for arrays. Returns an array whose elements
 * are on the given array AND satisfies the given predicate.
 * 
 * This function does not affect the given array. It returns a freshly created
 * one.
 * 
 * @param {[any]}
 *            An array to filter
 * @param {function(any)}
 *            A function taking a value from the array and returning a boolean
 * @return {[any]} A new array containing elements from the given array that
 *         match the predicate
 */
xtiger.util.array_filter = function array_filter (aArray, aCallback) {
	if (! (typeof aArray == 'object' && typeof aCallback == 'function'))
		return aArray;
	var _buf = [];
	for (var _i = 0; _i < aArray.length; _i++) {
		if (aCallback(aArray[_i]))
			_buf.push(aArray[_i]);
	}
	return _buf;
}

xtiger.util.array_contains = function array_contains (aArray, aElement) {
	if (typeof aArray != 'object')
		return false;
	for (var _i = 0; _i < aArray.length; _i++) {
		if (aArray[_i] == aElement)
			return true;
		if (typeof(aArray[_i]) == 'object' && typeof(aElement) == 'object')
			if (xtiger.util.object_compare(aArray[_i], aElement))
				return true;
	}
	return false;
}

/**
 * <p>
 * Compares two objects. Returns true if and only if these objects share
 * extaclty the same set of properties and if and only if all those properties
 * are equals.
 * </p>
 * 
 * <p>
 * For performance reasons, the algorithm returns false at the first noticed
 * difference.
 * </p>
 * 
 * <p>
 * The algorithm was found (and slightly adapted) at
 * http://stackoverflow.com/questions/1068834/object-comparison-in-javascript/1144249#1144249
 * </p>
 * 
 * @param aObject1
 * @param aObject2
 * @return {boolean}
 */
xtiger.util.object_compare = function object_compare (aObject1, aObject2) {
	for (_prop in aObject1) {
	    if(typeof(aObject2[_prop]) == 'undefined') 
	    	return false;
	}

	for (_prop in aObject1) {
	    if (aObject1[_prop]) {
	        switch(typeof(aObject1[_prop]))
	        {
	                case 'object': // recursive
	                        if (!xtiger.util.object_compare(aObject1[_prop], aObject2[_prop])) { 
	                        	return false;
	                        }
	                        break;
	                case 'function':
	                        if (typeof(aObject2[_prop]) == 'undefined'
	                        	|| (_prop != 'equals' && aObject1[_prop].toString() != aObject2[_prop].toString())) {
	                        	return false;
	                        	}
	                        break;
	                default:
	                        if (aObject1[_prop] != aObject2[_prop]) {
	                        	return false;
	                        }
	        }
	    }
	    else {
	        if (aObject2[_prop]) {
	            return false;
	        }
	    }
	}

	for(_prop in aObject2) {
	    if(typeof(aObject1[_prop])=='undefined') {
	    	return false;
	    }
	}

	return true;
}

//////////////////
// xtiger.cross //
//////////////////

/**
 * Returns an XMLHTTPRequest object depending on the platform.
 * Returns false and displays an alert if it fails to create one 
 */
xtiger.cross.getXHRObject = function () {
	var xhr = false;	
	if (window.XMLHttpRequest) {
	   xhr = new XMLHttpRequest();
	} else if (window.ActiveXObject) {  // IE
		try {
			xhr = new ActiveXObject('Msxml2.XMLHTTP');
		} catch (e) {
			try {   
				xhr = new ActiveXObject('Microsoft.XMLHTTP');  
			} catch (e) {
	  	}
		}
	}
	if (! xhr) {
	   alert("Your browser does not support XMLHTTPRequest");
	}
	return xhr;				
}                  
          
/**
 * Loads the document at URL using the default XHR object created by the getXHRObject method
 * Accepts an optional logger (xtiger.util.Logger) object to report errors
 * Returns the document (should be a DOM Document object) or false in case of error
 */
xtiger.cross.loadDocument = function (url, logger) {
	var xhr = xtiger.cross.getXHRObject ();
	try {  
		xhr.open("GET", url, false); // false:synchronous
		xhr.send(null);
		if ((xhr.status  == 200) || (xhr.status  == 0)) { // 0 is for loading from local file system
			if (xhr.responseXML) {
				return xhr.responseXML;     
				// FIXME: on FF we must test for parseerror root and first child text node err msg !!!!
			} else if (logger) {
				logger.logError('$$$ loaded but it contains no XML data', url);
			}
		} else if (logger) { 
			var explain = xhr.statusText ? '(' + xhr.statusText + ')' : ''; 
			logger.logError('HTTP error while loading $$$, status code : ' + xhr.status + explain, url);
		}
 	} catch (e) {        
		if (logger) {	logger.logError('Exception while loading $$$ : ' + (e.message ? e.message : e.name), url); }
 	} 
	return false;	
}

/**
 * Logs its arguments separated by a space.
 */
xtiger.cross.log = function  (channel, msg)	{
	switch (channel) {
	case 'error' :
	case 'fatal' :
		xtiger.cross.print('[XX] ' + msg);
		break;
	case 'warning' :
		xtiger.cross.print('[!!] ' + msg);
		break;
	case 'info' :
		//xtiger.cross.print('[ii] ' + msg);
		break;
	case 'debug' :
		xtiger.cross.print('[dd] ' + msg);
		break;
	default :
		//xtiger.cross.print('[' + channel + '] ' + msg);
	}
}

/**
 * Prints an output on the browser's console, if any
 */
xtiger.cross.print = function (aMessage) {
	try {
		if (typeof(opera) != 'undefined' && opera.log) {
			opera.postError(aMessage);
		}
		else if (typeof(console) != 'undefined') {
			if (/^\[!!\]/.test(aMessage) && console.warn)
				console.warn(aMessage);
			else if (/^\[XX\]/.test(aMessage) && console.error)
				console.error(aMessage);
			else if (console.log)
				console.log(aMessage);
		}
		else if (typeof(window.console) != 'undefined' && window.console.log) {
			window.console.log (aMessage);
		}
		/*else
			alert(aMessage);*/ // Only if debugging
	} catch (_err) {
		alert(aMessage + "\nUnable to print on console (" + _err.message + ")"); 
	}
}

/**
 * Factory function that creates a minimal DOMParser object for parsing XML string
 * into DOM objects (to be used as data sources).
 * @function xtiger.cross.makeDOMParser
 */
// DOMParser is currently used only to load data in a data source from a String
if (typeof DOMParser == "undefined") {
	
	xtiger.util.DOMParser = function () {};
	
	xtiger.util.DOMParser.prototype.parseFromString = function (str, contentType) {
		if (typeof ActiveXObject != "undefined") {
			var d = new ActiveXObject("MSXML.DomDocument");
			d.loadXML(str);
			return d;
		} else if (typeof XMLHttpRequest != "undefined") {
			// FIXME: with FF 3.0.5 this raises an exception (access to restricted URI)
			// because data: URI scheme is considered as a cross browser attempt to read a file
			var req = new XMLHttpRequest;
			req.open("GET", "data:" + (contentType || "application/xml") +
			                ";charset=utf-8," + encodeURIComponent(str), false);
			if (req.overrideMimeType) {
			   req.overrideMimeType(contentType);
			}
			req.send(null);
			return req.responseXML;
		}
	}				
	xtiger.cross.makeDOMParser = function () {
		return new xtiger.util.DOMParser();
	}			
	
} else {
	xtiger.cross.makeDOMParser = function () {
		return new DOMParser();
	}
}

/**
 * Factory function that creates and returns a new TreeWalker object.
 * @function xtiger.cross.makeTreeWalker
 */
if (! document.createTreeWalker) {	
// if (true) {	
	xtiger.util.TreeWalker =
		function (node, nodeType, filter){
			this.nodeList = new Array();
			this.nodeType = nodeType;
			this.filter = filter;
			this.nodeIndex = -1;
			this.currentNode = null;			
			this.findNodes(node);
		}		
		
	xtiger.util.TreeWalker.prototype = {
		nextNode:function(){
			this.nodeIndex += 1;
			if(this.nodeIndex < this.nodeList.length){
				this.currentNode = this.nodeList[this.nodeIndex];
				return true;
			}else{
				this.nodeIndex = -1;
				return false;
			}
		},
		
		findNodes:function(node){
			if( node.nodeType == this.nodeType && this.filter(node)== xtdom.NodeFilter.FILTER_ACCEPT ){
				this.nodeList.push(node);
			}
			if(node.nodeType == 1 ){
				for(var i = 0; i<node.childNodes.length; i++){
					this.findNodes(node.childNodes[i]);
				}
			}
		}
	}
	
	xtiger.cross.makeTreeWalker =
		function (n, type, filter) { return new xtiger.util.TreeWalker(n, type, filter) }
		
} else {
	
	// FIXME: currently it uses "document" although it should be passed the document !!!
	if (xtiger.cross.UA.webKit) {
				
		xtiger.cross.makeTreeWalker =
			function (n, type, filter) { return document.createTreeWalker(n, type, filter, false) }
	} else {
		
		xtiger.cross.makeTreeWalker =
			function (n, type, filter) {
				var filterFunc = { acceptNode: filter };
				return document.createTreeWalker(n, type, filterFunc, false);
			}		
	}
}  

/**
 * Returns the XTiger type of a DOM node. Returns xtiger.UNKNOWN otherwise.
 * Pre-condition: the node must be an Element node.
 * FIXME: do browser dependent version trully using namespace DOM API to void setting prefixes in marble  
 */
xtdom.getNodeTypeXT = function (aNode) {
	// FIXME: depends on namespace prefix on FF	
	var s = aNode.nodeName.toLowerCase(); // localName not defined for IE
	if ((s == 'use') || (s == 'xt:use')) {
		return xtiger.USE;
	} else if ((s == 'component') || (s == 'xt:component')) {
		return xtiger.COMPONENT;
	} else if ((s == 'repeat') || (s == 'xt:repeat')) {
		return xtiger.REPEAT;
	} else if ((s == 'bag') || (s == 'xt:bag')) {
		return xtiger.BAG;
	} else if ((s == 'attribute') || (s == 'xt:attribute')) {
		return xtiger.ATTRIBUTE;
	} else if ((s == 'service') || (s == 'xte:service')) {
		return xtiger.SERVICE;
	// } else if ((s == 'menu-marker') || (s == 'xt:menu-marker')) { {
	// 	return xtiger.MENU_MARKER;
	} else {
		return xtiger.UNKNOWN;
	}
}

/////////////////////
// A few constants //
/////////////////////

xtdom.ELEMENT_NODE = 1;
xtdom.ATTRIBUTE_NODE = 2;
xtdom.TEXT_NODE = 3;
xtdom.CDATA_SECTION_NODE = 4;
xtdom.COMMENT_NODE = 8

if ((typeof NodeFilter == "undefined") || !NodeFilter) {
	xtdom.NodeFilter = {
		SHOW_ELEMENT : 1,
		FILTER_ACCEPT : 1,
		FILTER_SKIP : 3 
	}	
} else {
	xtdom.NodeFilter = {
		SHOW_ELEMENT : NodeFilter.SHOW_ELEMENT,
		FILTER_ACCEPT : NodeFilter.FILTER_ACCEPT,
		FILTER_SKIP : NodeFilter.FILTER_SKIP
	}
}

/**
 * Returns the DOM window object for a given document. if the document is within
 * an iframe, returns the frame's window object.
 * 
 * @param aDocument
 * @return
 */
xtdom.getWindow = function getWindow (aDocument) {
	if (window.document == aDocument)
		return window;
	if (window.frames.length > 0) {
		for (var _i = 0; _i < window.frames.length; _i++) {
			if (window.frames[_i].document == aDocument)
				return window.frames[_i];
		}
	}
	xtiger.cross.log('warning', 'The window object was not found.');
	return window;
}

// No-IE browser methods
if (! xtiger.cross.UA.IE) {

	// Returns true if the node is an XTiger node
	xtdom.isXT = function isXT (node) {
		var ns = node.namespaceURI;
		return (ns == xtiger.parser.nsXTiger) || (ns == xtiger.parser.nsXTiger_deprecated) || (ns == xtiger.parser.nsXTigerExt);
	}	
	
	// Returns true if the DOM is a xt:use node, false otherwise.
	xtdom.isUseXT = function isUseX (aNode) {	
		// FIXME: depends on namespace prefix on FF + should we lowercase nodeName ?
		return (aNode.nodeName == 'use' || aNode.nodeName == 'xt:use');
	}

	// Returns true if the DOM is a xt:bag node, false otherwise.
	xtdom.isBagXT = function (aNode) {	
		// FIXME: depends on namespace prefix on FF + should we lowercase nodeName ?
		return (aNode.nodeName == 'bag' || aNode.nodeName == 'xt:bag');
	}

	xtdom.getElementsByTagNameXT = function (container, name) {	
		// FIXME: depends on namespace prefix on FF		
		var res = container.getElementsByTagName(name);
		if (0 == res.length) {
			res = container.getElementsByTagName('xt:' + name);
		}	
		return res;
	}	
	
	// Returns the local node of a node (without namespace prefix)
	xtdom.getLocalName = function (node) {
		return node.localName; // otherwise nodeName includes "prefix:"
	}
	
	xtdom.getTextContent = function (aNode) {
		if (aNode.textContent)
			return aNode.textContent;
		else if (aNode.text)
			return aNode.text;
		else
			return '';
	}
		
	xtdom.createElement = function (doc, tagName) {
		// there may be some issues with massive default attribute creation on IE ?
		//	return doc.createElement(tagName);
		return doc.createElementNS("http://www.w3.org/1999/xhtml", tagName);
	};

	xtdom.createElementNS = function (doc, tagName, ns) {
		return doc.createElementNS(ns, tagName);
	};
		
	xtdom.importNode = function (doc, node, deep) {
		return doc.importNode (node, deep);
	}
	
	xtdom.cloneNode = function (doc, node, deep) {
		// FIXME: shall we check if (node.ownerDocument == doc) to import the node instead of cloning
		return node.cloneNode (deep);
	}	
		
	xtdom.setAttribute = function(node, name ,value){
		node.setAttribute(name, value);
	}
	
	xtdom.getStyleAttribute = function (aNode) {
		return aNode.getAttribute('style');
	}
	
	xtdom.getEventTarget = function (ev) {
		return ev.target;
	}	

	xtdom.addEventListener = function (node, type, listener, useCapture){
		node.addEventListener(type, listener, useCapture);
	}

	xtdom.removeEventListener = function (node, type, listener, useCapture) {
		node.removeEventListener(type, listener, useCapture);
	}	

	xtdom.removeAllEvents = function (node) {
		alert ('removeAllEvents should not be called on this browser')
	}
	
	xtdom.preventDefault = function (aEvent) {
		aEvent.preventDefault();
	}
	
	xtdom.stopPropagation = function (aEvent) {
		aEvent.stopPropagation();
	}           
	                       
	xtdom.focusAndSelect = function (aField) {
		try {
			aField.focus();
			aField.select(); // not sure: for Safari focus must preceed select
	  }
	  catch (e) {}
	}

	xtdom.focusAndMoveCaretTo = function (aField, aPos) {
	  try {
		aField.focus();
		if (aField.setSelectionRange) {
			aField.setSelectionRange(aPos, aPos);
		}		
	  }
	  catch (e) {}
	}   

} // else REMEMBER TO INCLUDE iebrowser.js !

/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Jonathan Wafellman
 * 
 * ***** END LICENSE BLOCK ***** */

// Additional file to include for running on IE browser

if (xtiger.cross.UA.IE) {
	
	xtdom.hasAttribute = function (node, name) {
		return node.getAttribute(name) != null;
	}
	
	xtdom.isXT = function (node) {
		return xtiger.parser.isXTigerName.test(node.nodeName);
	}	
	
	// Returns true if the DOM is a xt:use node, false otherwise.
	xtdom.isUseXT = function (aNode) {	
		// FIXME: depends on namespace prefix on FF + should we lowercase nodeName ?
		return (aNode.nodeName == 'use' || aNode.nodeName == 'xt:use');
	}

	// Returns true if the DOM is a xt:bag node, false otherwise.
	xtdom.isBagXT = function (aNode) {	
		// FIXME: depends on namespace prefix on FF + should we lowercase nodeName ?
		return (aNode.nodeName == 'bag' || aNode.nodeName == 'xt:bag');
	}

	xtdom.getElementsByTagNameXT = function (container, name) {	
		var res = container.getElementsByTagName(name);
		if (0 == res.length) {
			res = container.getElementsByTagName('xt:' + name);
		}	
		return res;
	}	
				
	xtdom.getLocalName = function (node) {
		return node.nodeName;  // FIXME: check that IE do not keep "prefix:"
	}
	
	xtdom.getTextContent = function (aNode) {
		if (aNode.innerText)
			return aNode.innerText;
		else if (aNode.text)
			return aNode.text;
		else
			return '';
	}
	
	xtdom.createElement = function (doc, tagName) {
		// there may be some issues with massive default attribute creation on IE ?
		return doc.createElement(tagName);
	}
	
	xtdom.createElementNS = function (doc, tagName, ns) {
		if (ns == xtiger.parser.nsXTiger) {
			return doc.createElement('xt:' + tagName);
		} else {
			return doc.createElement(ns + ':' + tagName);
		}		
	}
	
	// see http://www.alistapart.com/articles/crossbrowserscripting
	xtdom.importNode = function(doc, node, deep) {
		switch (node.nodeType) {
			case xtdom.ELEMENT_NODE:
				var newNode = xtdom.createElement(doc, node.nodeName);
				if (node.attributes && node.attributes.length > 0) // copy attributes
					for (var i = 0; i < node.attributes.length; i++)
						xtdom.setAttribute(newNode, node.attributes[i].name, node.attributes[i].value);
				if (deep && node.childNodes && node.childNodes.length > 0) // copy children (recursion)
					for (var i = 0; i < node.childNodes.length; i++)
						newNode.appendChild( xtdom.importNode(doc, node.childNodes[i], deep) );
				return newNode;
				break;
			case xtdom.TEXT_NODE:
			case xtdom.CDATA_SECTION_NODE:
			case xtdom.COMMENT_NODE:
				return xtdom.createTextNode(doc, node.nodeValue);
				break;
		}
	}		
	
	xtdom.cloneNode = function (doc, node, deep) {
		// FIXME: shall we check if(node.ownerDocument == this.doc)
		var clone = node.cloneNode (deep);
		xtdom.removeAllEvents(clone); // IE do also clone event handlers
		return clone;
	}	

	// this is called at least from importNode
	xtdom.setAttribute = function(node, name ,value) {
		if (name == 'class') {
			node.className = value;
		} else {
			node.setAttribute(name, value);
		}
	}
	
	// Fixes the mess around the style attribute in IE
	xtdom.getStyleAttribute = function (aNode) {
		if (aNode.style)
			return aNode.style.cssText;
		else if (aNode.attributes[0] && aNode.attributes[0].nodeName == 'style') {
			return aNode.attributes[0].nodeValue;
		}
	}

	// ev.srcElement replaces window.event.srcElement since IE8
	xtdom.getEventTarget = function (ev) {
		return (ev && ev.srcElement) ? ev.srcElement : window.event.srcElement;
	}
	
	/**
	* Attach an event to the given node
	*, WARNING : cannot capture events on IE, events only bubble
	*/
	xtdom.addEventListener = function (node, type, listener, useCapture) {
		node.attachEvent('on' + type, listener);
		// node.addEventListener(type, listener, useCapture);		
		if (! node.events) {
			node.events = new Array();
		}
		node.events.push ([type,listener]);
	}	

	xtdom.removeEventListener = function (node, type, listener, useCapture) {
		node.detachEvent('on' + type, listener);
		// node.removeEventListener(type, listener, useCapture);		
		// FIXME: remove [type,listener] from node.events (?)
	}			

	xtdom.removeAllEvents = function (node) {
		if (node.events) {
			for(var i = 0; i < node.events.length; i++){
				xtdom.removeEventListener (node, node.events[i][0], node.events[i][1], true);				
			}
			node.events = new Array();
		}
	}

	xtdom.preventDefault = function (aEvent) {
		aEvent.returnValue = false;
	}
	
	xtdom.stopPropagation = function (aEvent) {
		aEvent.cancelBubble = true;
	}     
	
	xtdom.focusAndSelect = function (aField) {
		try { // focusing a hidden input causes an error (IE)
			aField.focus();
			var oRange = aField.createTextRange(); 
			oRange.moveStart("character", 0); 
			oRange.moveEnd("character", aField.value.length); 
			oRange.select();		
	  }        
	  catch (e) {}
	}	          
	                      
	// FIXME: currently moves caret to the end of aField
	xtdom.focusAndMoveCaretTo = function (aField, aPos) {
	 	try {
			aField.focus();
			var oRange = aField.createTextRange(); 
			oRange.collapse(false); // move caret to end
			oRange.select();
	  }   
	  catch (e) {}
	}	

}
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */  
 
xtiger.util.filterable = function (name, that) {
  
  if (! that) { // safe guard
    xtiger.cross.log('error', 'filter "' + name + '" is undefined');
    return that;
  }
  
  /* A registry to store filters */
	var _filtersRegistry = {};       
	
  /* A plugin name for log messages */
	var _pluginName = name;      
	
	/**
	 * <p>
	 * Registers a filter under the given key. The filter must implement the
	 * delegation pattern documented in Alex Russell's blog at
	 * http://alex.dojotoolkit.org/2008/10/delegate-delegate-delegate/.
	 * </p>
	 * 
	 * @param {string}
	 *            aKey A string key under which to register the filter
	 * @param {object}
	 *            aFilter A filtering object implementing the aforesaid
	 *            delegation pattern
	 */
	that.registerFilter = function registerFilter (aKey, aFilter) {
		if (! typeof(aFilter) == "object") // NOTE may test harder?
			return;
		if (_filtersRegistry[aKey])
			xtiger.cross.log('warning', '"' + _pluginName + '" plugin: filter "' + aKey + '" is already registred. Overwriting it.');
		_filtersRegistry[aKey] = aFilter;
	};     
	
	/**
	 * <p>
	 * Same as registerFilter but for a service delegate. It may evolve differently
	 * in the future (e.g. to print a different error message, to support service specific 
	 * parameters or to allow name collision between service delegates and plugin filters).
	 * </p>
	 */
	that.registerDelegate = that.registerFilter;
  
  /**
  * <p>
  * Apply all filters for the given model. The filtering implements a
  * DOJO-like delegation pattern, thanks to the explanation of Mr. Alex
  * Russell on his blog, at
  * http://alex.dojotoolkit.org/2008/10/delegate-delegate-delegate/. 
  * See filter's code for further explanations.
  * </p>
  * 
  * @param {_LinkModel}
  *            aModel The model to filter
  * @param {string}
  *            aFiltersParam The string of the "filters=" parameter
  * @return {_LinkModel} A filtered instance
  */
  that.applyFilters = function applyFilters (aModel, aFiltersParam) {

  	// the "_baseobject" condition avoid copying properties in "props"
  	// inherited from Object.prototype.  For example, if obj has a custom
  	// toString() method, don't overwrite it with the toString() method
  	// that props inherited from Object.protoype
  	var _baseobject = {};

  	var _filtersnames = aFiltersParam.split(' '); // filters are given as a space-separated name list

  	var _filtered = aModel;

  	// Apply filters
  	for (var _i = 0; _i < _filtersnames.length; _i++) {
  		var _unfiltered = _filtered;
  		var _filter = _filtersRegistry[_filtersnames[_i]]; // fetch the filter
  		if (!_filter) {
  		  xtiger.cross.log('warning', '"' + _pluginName + '" plugin: missing filter "' + _filtersnames[_i] + '"');
  			continue;    
  		}
  		var _Filtered = function () {}; // New anon class
  		_Filtered.prototype = _unfiltered; // Chain the prototype
  		_filtered = new _Filtered();
  		if (_filter) {
             var _remaps = _filter["->"];
             if (_remaps) {
                 //delete _filter["->"]; // TODO avoid for further uses?
                 for (var _p in _remaps) {
                     if (_baseobject[_p] === undefined || _baseobject[_p] != _remaps[_p]) {
                         if (_remaps[_p] == null) {
                             // support hiding via null assignment
                             _filtered[_p] = null;
                         }
                         else {
                             // alias the local version away 
                             // alias to no-op function if it doesn't exist
                             _filtered[_remaps[_p]] = _unfiltered[_p] || function () { };
                         }
                     }
                 }
             }
             xtiger.util.mixin(_filtered, _filter);
         }
  	}
  	return _filtered;
  };
   
  return that;
};   /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Jonathan Wafellman
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Global Constants for the XTiger Template parser
 */

xtiger.parser.NATIVE = 0;
xtiger.parser.CONSTRUCTED = 1;

// RegExps
xtiger.parser.nsXTiger = "http://ns.inria.org/xtiger";
xtiger.parser.nsXTigerExt = "http://ns.media.epfl.ch/xtiger-extension";
xtiger.parser.nsXTiger_deprecated = "http://wam.inrialpes.fr/xtiger"; // deprecated ns
xtiger.parser.nsXHTML = "http://www.w3.org/1999/xhtml"
xtiger.parser.isXTiger = /<[^>]*[(component)(use)(repeat)(service)]/; // XTiger node opening tag
xtiger.parser.isXTigerName = /[(component)(use)(repeat)(service)]/; // XTiger node name

/**
 * Represents the tree of each component inside the XTiger file to visualize
 * NATIVE components correspond to the XTiger builtin types 'string', 'number' and 'boolean'
 * or to the target language elements filtered (declared with "xtt:targetElements")
 */
xtiger.parser.Component = function (nature, tree) {
	this.nature = nature;
	this.tree = tree;
	this.str =  null;
}

xtiger.parser.Component.prototype = {
	
	isNative : function () {
		return (xtiger.parser.NATIVE == this.nature);
	},

	hasBeenExpanded : function () {
		return (xtiger.parser.NATIVE == this.nature) || (this.str != null);
	},
	
	getSource : function () {
		if (! this.str) {
			this.str = this.tree.innerHTML;
		}
		return this.str;
	},
	
	getTree : function () {
		return this.tree;
	},
	
	getClone : function (doc) {
		var res = xtdom.cloneNode (doc, this.tree, true);
		return res;
	},
	
	importStructTo : function (targetDoc) {
		var copy = xtdom.importNode (targetDoc, this.tree, true);
		this.tree = copy;
	}
	
}

/**
 * Creates an iterator to transform the XTiger template document passed as parameter 
 * with the transformer instance
 */
xtiger.parser.Iterator = function (doc, transformer) {	
	this.transformer = transformer;
	this.unionList = new Object(); // type list of the union. any, anyElement, anyComponent, anySimple
	this.componentLib = new Object(); // parsed XTiger components
	this.transformer.coupleWithIterator (this);
	this.acquireComponentStructs (doc); // parses XTiger components
	this.acquireUnion (doc); // resolves the union types
	this.acquireHeadLabel (doc); // xt:head label
} 

xtiger.parser.Iterator.prototype = {
			
	/**************************************************/
	/*                                                */
	/*         Components acquisition methods         */
	/*                                                */
	/**************************************************/   
	
	hasType : function (name) {
		return this.componentLib[name] ? true : false;
	},

	defineType : function (name, definition) {
		this.componentLib[name] = definition;
	},
	
	defineUnion : function (name, definition) {
		this.unionList[name] = definition;
	},
	
	getComponentForType : function (name) {
		return this.componentLib[name];
	},
	
	acquireHeadLabel : function (aDocument) {
		var l;
		var head = xtdom.getElementsByTagNameXT (aDocument, "head");		
		if (head && (head.length > 0)) {
			 l = head[0].getAttributeNode('label');
			 if (! l) { // FIXME : most probably xtdom.getElementsByTagNameXT returned the XHTML head
				head = xtdom.getElementsByTagNameXT (head[0], "head");
				if (head && (head.length > 0)) {
					l = head[0].getAttributeNode('label');
				}
			}
		}
		this.headLabel = l ? l.value : undefined;
	},

	// Creates a memory structure for each XTiger component defined in its parameter aDocument
	// aDocument must contain an XTiger document tree
	acquireComponentStructs : function (aDocument) {
		var structs = xtdom.getElementsByTagNameXT (aDocument, "component");
		var mapTypes = new Array();
		for(var inc = 0; inc< structs.length; inc++) {
			var name = structs[inc].getAttribute('name');
			// var name = structs[inc].getAttributeNode('name').value;
			if (name) {
				mapTypes.push(name);
				this.componentLib[name] = new xtiger.parser.Component (xtiger.parser.CONSTRUCTED, structs[inc]);
			}
		}	
		this.unionList['anyComponent'] = mapTypes;
	},

	// Acquires complex types and sets them in the object
	acquireUnion : function (template) {
		var unions = xtdom.getElementsByTagNameXT (template, "union");		
		for (var inc = 0; inc < unions.length; inc++) {
			var tmp;
			var name = unions[inc].getAttributeNode('name').value; // FIXME: exception handling
			// 1. extracts and develop types to include (mandatory)
			tmp = unions[inc].getAttributeNode('include').value.split(" "); // FIXME: exception handling
			var typeIn = this.flattenUnionTypes(tmp);
			var typeString = " " + typeIn.join(" ") + " "; //  protects names with spaces for RegExp matching
			// 2. extracts and develop types to exclude and exclude them (optional)
			tmp = unions[inc].getAttributeNode('exclude');			
			if (tmp) {
				tmp = typeDel.value.split(" ");
				var typeDel = this.flattenUnionTypes(tmp);
				for (var inc2 = 0; inc2< typeDel.length; inc2++) {
					typeString = typeString.replace(new RegExp(" " + typeDel[inc2] + " "), " ");
				}
			}
			typeString = typeString.substring(1,typeString.length-1); // trims spaces
			this.unionList[name] = typeString.split(" ");			
		}
		// completes with the type "any"
		this.unionList["any"] = this.unionList["anySimple"].concat(this.unionList["anyElement"], this.unionList["anyComponent"]);
	},
	
	// Transforms a list of types into a list of simple types where all the union types have been flattened
	// into their corresponding simple types.
	// types is an array of strings that represent the type names
	flattenUnionTypes : function (types) {
		// FIXME: optimize it with lazy creation of a new array (output)
		var output = [];
		for (var inc = 0; inc < types.length; inc ++) {
			if (this.unionList[types[inc]] != null) { // checks if the type is itself a union
				var thisUnion = this.unionList[types[inc]]; // develops it		
				for (var i = 0; i < thisUnion.length; i++) {
					output.push(thisUnion[i]);
				}			
			} else {
				output.push(types[inc]); // keeps it
			}
		}
		return output;
	},	
	
	// Imports all the component definitions into the document targetDoc
	// This is a pre-requisite before transforming targetDoc sub-parts.
	importComponentStructs : function (targetDoc) {	
		xtiger.cross.log('info', 'imports template component structures to target document');
		for (var k in this.componentLib) {
			this.componentLib[k].importStructTo (targetDoc);
		}
	},
		
  /***********************************************************/
	/*                                                         */
	/*  XTiger template tree transformation to XHTML methods   */
	/*                                                         */
	/***********************************************************/

	/** 
	 * Transforms an XTiger template source document
	 * aNode is the root node from where the transformation starts
	 * DOC is document that will be transformed
	 */
	transform : function (aNode, doc) {
		this.curDoc = doc;
		this.transformer.prepareForIteration (this, doc, this.headLabel);
		this.transformIter (aNode);
		this.transformer.finishTransformation (aNode);
	},
		
	transformIter : function (aNode) {		
		if (aNode.nodeType == xtdom.ELEMENT_NODE) { // only operates on element nodes, if not, keep it unchanged
			var type = xtdom.getNodeTypeXT(aNode);  
			if (xtiger.COMPONENT == type) {
				this.changeComponent(aNode);				
			} else {
				this.transformer.saveContext (aNode); // FIXME: aNode.tagName for default case ?
				switch (type) {
					case xtiger.USE: 
						this.changeUse(aNode);
						break;
					case xtiger.REPEAT:
						this.changeRepeat(aNode);
						break;
					case xtiger.ATTRIBUTE:                
						this.changeAttribute(aNode); 
						break;   
					case xtiger.BAG:
						this.changeBag(aNode); 
						break;      
					case xtiger.SERVICE:
						this.changeService(aNode);
						break;      
					default:
						this.continueWithChildOf(aNode);
				}      
				this.transformer.restoreContext (aNode);
			}
		}
	},      
	  
	/*
	Iterates on the children of the node passed as parameter to transform it for presentation:
	- for children sub-trees that contain some Xtiger nodes, continue transformation by calling transform
	- ignores the other children
	Two passes algorithm because calls to transform may change the structure of the tree while iterating
	*/
	continueWithChildOf : function (aNode) {
		var process = new Array();
		for (var i = 0; i < aNode.childNodes.length; i++) { 
			if (xtdom.containsXT(aNode.childNodes[i])) {
				  process.push (aNode.childNodes[i]);
			}
		}
		this.transformItems (process);
	},
	
	// The accumulated nodes can be:
	// - either a simple list of nodes (DOM nodes that contain some XTiger at some point) to transform
	// - or a list starting with 'OPAQUE', in that case the following elements represent the current type
	//   which is beeing expanded, each element (cur) is an opaque structure (known only by the transformer) 
	//   and hence each node must be retrieved with getNodeFromOpaqueContext (cur)
	// Note that when iterating on an opaque list of nodes, the top of the context is removed first 
	// and restored at the end. Then, each iteration saves a new element on top of the context, 	
	// setting a true flag on the saveContext / restoreContext calls to indicate this is the result of an 
	// opaque iteration
	transformItems : function (nodes) {
		if (nodes.length == 0)	return; // nothing to transform
		var cur;		
		if (nodes[0] == 'OPAQUE') { // special iteration caused by "types" expansion
			nodes.shift();
			var saved = this.transformer.popContext (); // removes the top context (xt:use or xt:bag)
			while (cur = nodes.shift()) { 
				this.transformer.saveContext (cur, true); // set top context to the current expanded type
				this.transformIter(this.transformer.getNodeFromOpaqueContext(cur));
				this.transformer.restoreContext(cur, true);
			}
			this.transformer.pushContext(saved); // continue as before			
		} else {
			while (cur = nodes.shift()) { 
				this.transformIter(cur);
			}
		}
	},

	// Transformation of a component element
	changeComponent : function (componentNode) {
		var accu = [];
		var container = xtdom.createElement(this.curDoc, 'div');
		this.transformer.genComponentBody (componentNode, container);
		this.transformer.genComponentContent (componentNode, container, accu);
    this.transformItems (accu);
		this.transformer.finishComponentGeneration (componentNode, container);
		xtdom.replaceNodeByChildOf (componentNode, container);		
	},

	// Transformation of a repeat element
	changeRepeat : function (repeatNode) {
		var accu = [];
		var container = xtdom.createElement(this.curDoc, 'div');
		this.transformer.genRepeatBody (repeatNode, container, accu);
		this.transformer.genRepeatContent (repeatNode, container, accu);
		this.transformItems (accu);
		this.transformer.finishRepeatGeneration (repeatNode, container);
		xtdom.replaceNodeByChildOf (repeatNode, container);
	},

	// Generation for xt:use and xt:use with option flag
	changeUse : function (xtSrcNode) {  
		var accu = [];				
		var container = xtdom.createElement(this.curDoc,'div');
		var kind = xtSrcNode.getAttribute('option') || 'use';	
		// creates an array that contains all the types of the use element			
		var types = xtSrcNode.getAttribute('types').split(" ");
		types = this.flattenUnionTypes(types);	
		this.transformer.genIteratedTypeBody (kind, xtSrcNode, container, types);
		this.transformer.genIteratedTypeContent (kind, xtSrcNode, container, accu, types);
		this.transformItems (accu);		
		this.transformer.finishIteratedTypeGeneration (kind, xtSrcNode, container, types);
		xtdom.replaceNodeByChildOf (xtSrcNode, container);
	}, 
	
	// Generation for xt:attribute
	changeAttribute : function (xtSrcNode) {  
		var accu = null; // not used for attribute that MUST resolve to a single type
		var container = xtdom.createElement(this.curDoc,'div');
		var kind = 'attribute';	// FIXME : how to handle optional attributes ? ('option' = true)
		var types = [xtSrcNode.getAttribute('types') || xtSrcNode.getAttribute('type')]; // attributes have a single type, "type" is deprecated 
		this.transformer.genIteratedTypeBody (kind, xtSrcNode, container, types);
		this.transformer.genIteratedTypeContent (kind, xtSrcNode, container, accu, types);
		this.transformer.finishIteratedTypeGeneration (kind, xtSrcNode, container, types);
		xtdom.replaceNodeByChildOf (xtSrcNode, container);
	},	 

	// Since the bag element is part of XTiger but not currently supported by AXEL
	// It is replaced with an "unsupported" span element in the DOM
	// Previous versions of AXEL (up to Revision 165) converted the bag to a use with multiple choices
	changeBag : function (bagNode) {       
		var span = xtdom.createElement(this.curDoc, 'span');
		xtdom.addClassName(span, 'axel-generator-error');
		var t = xtdom.createTextNode(this.curDoc, '! unsupported Bag element !');
		span.appendChild(t);      
		bagNode.parentNode.insertBefore(span, bagNode, true);
		bagNode.parentNode.removeChild(bagNode);
	},

	// Creates a service
	changeService : function (xtSrcNode) {        
		var sFactory = xtiger.factory('service');
		if (sFactory) {
			var container = xtdom.createElement(this.curDoc,'div');
			var handle = sFactory.createModel(container, xtSrcNode, this.curDoc);
			handle.xttService = sFactory.createServiceFromTree (handle, xtSrcNode, this.curDoc);
			xtdom.replaceNodeByChildOf (xtSrcNode, container);
		} else {
			xtiger.cross.log('warning', 'Missing "service" factory - services will not be generated !');
		}
	}				
}
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

// FIXME: this class should be renamed xtiger.util.Template or xtiger.util.Document
// as it wraps a template turned into an editor with it's current data

/*
 * Creates an XTiger Form that can be used to transform a template.
 * baseUrl is the path to the icons used by the generated editor
 *
 * You can use this class as-is, or as an example of how to integrate 
 * XTiger Forms in the client-side of your application
 */
xtiger.util.Form = function (baseIconsUrl) {
	this.baseUrl = baseIconsUrl;	
	this.doTab = false;  
	this.loader = this.serializer = null;
} 

xtiger.util.Form.prototype = {
		                                                               
	// Internal log mechanism that keeps track of a status
	_report : function (status, str, logger) {
		this.status = status;
		this.msg = str;		              
		if (logger && (0 == this.status)) { 
			logger.logError(str);
		}
	},   
	
	// Overrides default class XML loader object
	setLoader : function (l) {
		this.loader = l;
	},
	
	// Overrides default class XML serializer object
	setSerializer : function (s) {
		this.serializer = s;
	},

	/**
	 * Enables Tab Key navigation in the generated editor.
	 * This method must be called before doing the transformation.
	 */
	enableTabGroupNavigation : function () {
		this.doTab = true;
	},
	
	/**
	 * Sets the document that contains the Tiger template to transform.
	 * xtDoc is the document object (XML DOM) that contains the template, it must 
	 * also includes the head section for the declaration of components.
   * By default all the document template body will be transformed.
   * By default, if you do not call setTargetDocument, it is the template
   * that will be transformed. In that case you should also call injectStyleSheet
   * to include the form CSS style sheet into the template if it wasn't included yet
	 */
	setTemplateSource : function (xtDoc) { // FIXME: add optional logger ?
    // FIXME: add a parameter to select a sub-part of the template to transform		
		this.srcDoc = xtDoc;
		this.srcForm = null;
		if (xtDoc) { // sanity check
			var bodies = xtDoc.getElementsByTagName('body');
			if (bodies && (bodies.length > 0)) {
				this.srcForm = bodies[0];  // sets what will be transformed
			} else {
				try { // IE Case with IXMLDOMElement document (loaded from MSXML)
					xtDoc.setProperty("SelectionNamespaces","xmlns:xhtml='http://www.w3.org/1999/xhtml'");
					this.srcForm = xtDoc.selectSingleNode('//xhtml:body');
				} catch (e) { /* nop */ }
			}			
			if (! this.srcForm) {
				alert('Could not get <body> element from the template to transform !');
			}
			this.curDoc = xtDoc;
			this.targetContainerId = false;
		} else {
			alert('The document containing the template is null or undefined !');
		}
	},
	
	/**
	 * Sets the document where the result of the transformation will be embedded.
	 * targetDoc is the target document
	 * targetContainerId is the identifier of the element that will embed the result
	 * doReplace is a boolean indicating if the result replaces the children of the target
	 * This method should be called only if the target document is different than the 
	 * template to transform.
	 * If you call this method you should have included the CSS style sheet for the editor 
	 * in the target document.
	 */	
	setTargetDocument : function (aDoc, anId, doReplace) {
		this.curDoc = aDoc;
		this.targetContainerId = anId;
		this.doEmptyTarget = doReplace;
	},
	                            
	// Transforms template into editor
	// log is an optional logger to report errors
	transform : function (logger) {
		// FIXME: check this.srcDoc is set...
		if (! this.srcForm) {
			this._report (0, 'no template to transform', logger);
			return false;
		}
		this.editor = new xtiger.editor.Generator (this.baseUrl);
		this.parser = new xtiger.parser.Iterator (this.srcDoc, this.editor);
		if (this.targetContainerId) { // checks if the transformation require a cross-document copy
			var n = this.curDoc.getElementById(this.targetContainerId);
			if (n) {				
				if (this.doEmptyTarget) {
					xtdom.removeChildrenOf (n);
				}
				xtdom.importChildOfInto (this.curDoc, this.srcForm, n);
				this.root = n;
			} else {
				this._report (0, 'transformation aborted because target container "' + this.targetContainerId + '" not found in target document', logger);
				return false;
			}
			this.parser.importComponentStructs (this.curDoc); // to import component definitions
		}	else {
			this.root = this.srcForm;
		}		
		// lazy creation of keyboard manager & optional tab manager within the document session
		var kbd = xtiger.session(this.curDoc).load('keyboard');
		if (! kbd) {
			kbd = new xtiger.editor.Keyboard ();
			xtiger.session(this.curDoc).save('keyboard', kbd);
			// FIXME: someone should call removeDocument ( last document ) if this is no longer needed
			if (this.doTab) {			
				var tab = new xtiger.editor.TabGroupManager (this.root);
				kbd.setTabGroupManager(tab);
				xtiger.session(this.curDoc).save('tabgroupmgr', tab);
			}
		}
		// finally makes form available to other plugins (e.g. lens may need it to know where to insert their wrapper)
		xtiger.session(this.curDoc).save('form', this);
		this.parser.transform (this.root, this.curDoc);
		this._report (1, 'document transformed', logger);    
		return (this.status == 1);		
	},
	
	getEditor : function () {
		return this.editor;
	},

	getRoot : function () {
		return this.root;
	},
	
	// Call this method if you didn't include the style sheet in the document you have transformed to a form
	injectStyleSheet : function (url, logger) {		
		var head = this.curDoc ? this.curDoc.getElementsByTagName('head')[0] : null;
		if (head) {
			var link = document.createElement('link');
			link.setAttribute('rel','stylesheet');
			link.setAttribute('type', 'text/css');
			link.setAttribute('href', url); 
			head.appendChild(link);
			this._report (1, 'stylesheet injected', logger);
		} else {
			this._report (0, "cannot inject editor's style sheet because target document has no head section", logger);
		}
		return (this.status == 1);		
	},   
	
	// Loads XML data into a template which has been previously loaded into a DOMDataSource
	loadData : function (dataSrc, logger) {                
		if (dataSrc.hasData()) {
			this.editor.loadData (this.root, dataSrc, this.loader);
			this._report (1, 'data loaded', logger);
		} else {
			this._report (0, 'data source empty', logger);			
		}
		return (this.status == 1);		
	},
	
	// Loads XML data into a template from a string
	loadDataFromString : function (str, logger) {
		var dataSource = new xtiger.util.DOMDataSource ();
		if (dataSource.initFromString (str)) {
			this.loadData(dataSource, logger);
		} else {
			this._report (0, 'failed to parse string data source', logger);
		}
		return (this.status == 1);
	},
	
	// Loads JSON data into a template from an Object JSON
	loadDataFromJSON : function (jsonObj, logger) {
		var dataSource = new xtiger.util.JSONDataSource ();
		if (dataSource.initFromObject (jsonObj)) {
			this.loadData(dataSource, logger);
		} else {
			this._report (0, 'failed to parse string data source', logger);
		}
		return (this.status == 1);
	},
	
	// Loads XML data into a template from a URL
	// FIXME: check url is { document: url1, name : url2, ... } for tide loading
	loadDataFromUrl : function (url, logger) {
		var doc, source; 		
		var res = false;
		doc = xtiger.cross.loadDocument(url, logger);
		if (doc) {
			res = this.loadData(new xtiger.util.DOMDataSource(doc), logger);
		}
		return res;
	},
	
	// Dumps current form data into a DOMLogger accumulator
	/**
	 * @param {Logger} The logger which 
	 */
	serializeData : function (accumulator) {
		this.editor.serializeData (this.root, accumulator, this.serializer);
	},
	
	/////////////////////////////////////////////////////
	// Following functions are deprecated
	// or should be move somewhere else (xtiger.util.* ?)
	/////////////////////////////////////////////////////
	
	// DEPRECATED : use loadDataFromUrl instead
	// Loads data into the form from a file URL and a XMLHttpRequest object
	loadDataFromFile : function (url, xhr, logger) {
		try {
			xhr.open("GET", url, false);
			xhr.send(null);
			if ((xhr.status  == 200) || (xhr.status  == 0)) {
			 	if (xhr.responseXML) {
					this.loadData (new xtiger.util.DOMDataSource (xhr.responseXML), logger);
				} else {
					var res = xhr.responseText;
					res = res.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // bug 336551 MDC
					xtiger.cross.log('warning', 'attempt to use string parser on ' + url + ' instead of responseXML');
					if (! dataSource.initFromString(res)) { // second trial
						this._report (0, 'failed to create data source for data from file ' + url + '. Most probably no documentElement', logger);
					}
				}
			} else { 
				this._report(0, 'failed to load XML data from file ' + url + ". XHR status : " + xhr.status, logger);
			}
		} catch (e) {                                                                                          
			this._report(0, 'failed to open XML data file ' + url + ". Exception : " + e.name + '/' + e.message, logger);
		}
		return (this.status == 1);		
	},	
	
	// Saves XML content of the current document to a URL using XMLHTTPRequest
	postDataToUrl : function (url, xhr, logger) {		
		// 1. converts template to a string buffer
		var log = new xtiger.util.DOMLogger ();
		var data = this.editor.serializeData (this.root, log, this.serializer);
		log.close();
		// 2. sends it with a sycnhronous POST request
		try {
   			xhr.open( "POST", url,  false);
			xhr.setRequestHeader("Content-Type", "application/xml; charset=UTF-8");
			// FIXME: do we need to set "Content-Length" ?
   			xhr.send(log.dump('*')); // FIXME: not sure Javascript is UTF-8 by default ?
		  	if (xhr.readyState  == 4) {
	      		if((xhr.status  == 200) || (xhr.status  == 201) || (xhr.status  == 0)) {
					this._report(1, xhr.responseText, logger);
		    	} else { 
					this._report(0, 'can\'t post data to "' + url + '". Error : ' + xhr.status, logger);
				}
      		} else {
				this._report(0, 'can\'t post data to "' + url + '". Error readyState is ' + xhr.readyState, logger);
			}
		} catch (e) {
			xhr.abort();
			this._report(0, 'can\'t post data to "' + url + '". Exception : ' + e.name + '/' + e.message, logger);
		}
		return (this.status == 1);		
	},	
                          
	// Firefox only
	// Saves form data into a file, filename must contain an absolute path (i.e. "/tmp/myFile")	
	saveDataToFile : function (filename, logger) {
		if (xtiger.cross.UA.gecko) { 
			// tries with an XPCOM component (nsILocalFile)		
	    try {  
	      netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");  
	    } catch (e) { 
				this._report(0, 'Permission to save data to file "' + filename + '" was denied. Exception : ' + e.name + '/' + e.message, logger);
				return false;
	    }  
	    try {  
				// converts template to a string buffer
				var log = new xtiger.util.DOMLogger ();
				var data = this.editor.serializeData (this.root, log, this.serializer);
				log.close();
				// creates and/or saves file		
		    var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);  
		    file.initWithPath(filename);
		    if (file.exists() == false) {  
		      file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );  
		    }  
		    var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]  
		             .createInstance(Components.interfaces.nsIFileOutputStream);  
		    outputStream.init( file, 0x04 | 0x08 | 0x20, 420, 0 );   
		    //UTF-8 convert  
		    var uc = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]  
		      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);  
		    uc.charset = "UTF-8";  
		    var data_stream = uc.ConvertFromUnicode(log.dump('*'));
		    var result = outputStream.write(data_stream, data_stream.length );  
		    outputStream.close();
				this._report(1, 'Data saved to "' + filename + '"', logger);	
	    } catch (e) { 
				this._report(0, 'Cannot save data to file "' + filename + '". Exception : ' + e.name + '/' + e.message, logger);
	    }  
		} else { 
			// tries with XMLHttpRequest
			this.postDataToUrl (filename, xtiger.cross.getXHRObject());
		}	
		return (this.status == 1);		
	}
	
}	
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Manages atomic editor plugins.
 * Note that at least an Atomic String Editor must be added at some point
 */
xtiger.editor.Plugin = function () {	
}

xtiger.editor.Plugin.prototype = {	
	pluginEditors : {},
			
	// Returns a factory for the xtigerSrcNode if it corresponds to a primitive editor
	// typesArray is an Array containing the list of types for the node
	getEditorFor : function (xtigerSrcNode, typesArray){
		var factory;
		if (typesArray.length == 1) { // currently only 'singleton' use/bag may be primitive editors...
			var wrapper = xtigerSrcNode.getAttribute('wrapper');   
			var editor = (wrapper) ? 'string' : typesArray[0]; // FIXME: wrapper only supported with types='string'
			factory = this.pluginEditors[editor];
		}
		return factory;
	},
		
	// Returns true if the xtigerSrcNode corresponds to a primitive editor
	// typesStr is a String representing the list of types for the node
	hasEditorFor : function (xtigerSrcNode, typesStr) {
		var res;
		if (this.pluginEditors[typesStr]) {
			res = true;
		} else {
			var wrapper = xtigerSrcNode.getAttribute('wrapper');
			var editor = (wrapper) ? 'string' : typesStr; // FIXME: wrapper only supported with types='string'
			res = (this.pluginEditors[editor] != undefined);
		}
		return res;
	}
}

/**
 * Generates an editable XHTML tree while iterating with a xtiger.parser.Iterator on an XTiger XML template
 * FIXME: currently the template is fully developped into the DOM, future implementations should manage 
 * a cache for components, hence the Generator could become en Editor class that maintains the cache
 */
xtiger.editor.Generator = function (baseUrl) {
	if (baseUrl) {	xtiger.resources.setBase(baseUrl);	}
	this.plugins = new xtiger.editor.Plugin();
}

xtiger.editor.LABEL_MARK = 0; // unused (see verifyBoundary)
xtiger.editor.REPEAT_MARK = 1; 
xtiger.editor.CHOICE_MARK = 2;

xtiger.editor.Generator.prototype = {
	
	markerNames : ['xttOpenLabel', 'xttCloseLabel', 'startRepeatedItem', 'endRepeatedItem', 
		'beginChoiceItem', 'endChoiceItem'], // 'xttStringEditor'
		
	// Returns true if we can safely add a marker on the node given as parameter
	// Returns false if the node cannot hold markers or if it has already been marked
	isBoundarySafe : function (node) {
		if (! node) { // sanity check (this happens in IE if <repeat> instead of <xt:repeat> and template in iframe, or if <span/>)
			alert('Empty node in transformation, the template may contain XHTML errors, please correct it !');
			return false;
		}
				
		// special treatment for IE as TEXT nodes do not support custom attributes
		if (xtiger.cross.UA.IE && (node.nodeType != xtdom.ELEMENT_NODE)) {
			return false;
		}
		// checks if node has already been marked for a given category
		for (var i =0; i < this.markerNames.length; i++) {
		  if ( node[ this.markerNames[i] ] ) {
				// xtiger.cross.log("debug", "plants bounds for node "+node.nodeName+" because "+this.markerNames[i]);
				return false;
			}
		}
		if ((node.nodeType == xtdom.ELEMENT_NODE)	&& (node.nodeName.search('menu-marker') != -1)) {
			return false; // FIXME: maybe we can optimize the second test (is search costly ?)
		}
		return true;
	},
	
	// category is currently not used (because for serialization we cannot share marks on nodes)
	verifyBoundaries : function (container, category) {
		var begin;
		if (! this.isBoundarySafe(container.firstChild)) {
			begin = xtdom.createElement(this.curDoc, 'span');
			xtdom.addClassName(begin, 'axel-core-boundary');
		}
		if (! this.isBoundarySafe(container.lastChild)) {
			var end = xtdom.createElement(this.curDoc, 'span');
			xtdom.addClassName(end, 'axel-core-boundary');
			container.appendChild (end);				
		}
		if (begin) { // inserted after end in case there is only one child
			container.insertBefore(begin, container.firstChild);
		}		
	},			
	             
	// Returns the DOM node that need to be managed which is saved in the 'item' element
	// SHOULD not be called with the current algorithm
	getNodeFromOpaqueContext : function (item) {
			xtiger.cross.log('warning', 'unexpected call to "getNodeFromOpaqueContext" in "generator.js"');
			return item;
	},
		
	// Saves a reference to the XTiger source node into the context when a xt:use or xt:bag node is traversed. 
	// Currently the refNode content is only used by primitive editors (such as String) to create their initial state
	// The context on the top may be modified to instantiate special purpose editors (such as a Choice editor), 
	// in that case it is transformed from refNode to [refNode, editor]
	saveContext : function (xtSrcNode, isOpaque) {
		if (xtdom.isUseXT(xtSrcNode) || xtdom.isBagXT(xtSrcNode)) {
			this.context.push(xtSrcNode);
		}
	},

	restoreContext : function (xtSrcNode) {
		if (xtdom.isUseXT(xtSrcNode) || xtdom.isBagXT(xtSrcNode)) {					
			this.context.pop();			
		}
	},

	// Forces a context save of a given value
	pushContext : function (value) {
		this.context.push (value);
	},
	
	// Forces a context restoration
	popContext : function () {
		return this.context.pop ();
	},
		
	// Memorizes a pending editor in the current context
	// The editor may be reused before restoring the context
	savePendingEditor : function (ed, menu) {
		var top = this.popContext();
		this.pushContext ([top, [ed, menu]]); // replaces top of stack with an array
	},
	
	// Returns the pending editor that could have been added to the context
	// or false if there is none.
	getPendingEditor : function () {
		if (this.context.length > 0) {  // checks it has traversed at least a xt:use or xt:bag
			var top = this.context[this.context.length - 1];
			if (top instanceof Array) { // checks if the top of the context contains a pending editor
				return top[1];
			}
		}
		return false;
	},
	
	peekTopContext : function () {
		var top = this.context[this.context.length - 1];
		return (top instanceof Array ? top[0] : top);
	},
	         
	coupleWithIterator : function (iterator) { 
		this.iterator = iterator;							
		// defines type anySimple for simple types 
		var anySimple = new Array("string", "number", "boolean");
		iterator.defineUnion("anySimple", anySimple);
	},
	
	// Prepares the generator to generate with a given iterator inside a given doc 
	// Label is the xt:head label attribute or undefined if it does not exist
	prepareForIteration	: function (iterator, doc, label) { 
		this.context = []; // stack
		this.curDoc = doc;
		this.headLabel = label;
		if (! doc) { alert('You must specify a document to prepareForIteration !'); }
	},
		
	genComponentBody : function (componentNode, container) { },
	 
	// Copies all the children of the component into the container 
	// Accumulates them in the accumulator to continue the transformation
	genComponentContent	: function (componentNode, container, accu) {			
		xtdom.moveChildOfInto (componentNode, container, accu);
	},
	
	finishComponentGeneration : function (xtigerSrcNode, container) { 		
		var context = this.getPendingEditor ();
		if (context) {
			var editor = context[0];
			// currently we have only Choice Editors as pending editors
			this.verifyBoundaries(container, xtiger.editor.CHOICE_MARK);
			var name = xtigerSrcNode.getAttribute('name'); // current type beeing expanded
			editor.addChoiceItem (name, container.firstChild, container.lastChild);			
			var i18n = xtigerSrcNode.getAttribute('i18n');
			if (i18n) {          
				var menu = context[1];
				// change the label of the <option> in the <select> menu created for the <xt:use>
				var options = menu.getElementsByTagName('option');
				for (var i = 0; i < options.length; i++) {
					var text = options.item(i).firstChild;
					if (text.data == name) {
						text.data = i18n;
						break;
					}
				}
		 	}
		}
		//FIXME: we could handle a xttOpenLabel and xttCloseLabel here too for inline components
	},

	genRepeatBody : function (repeatNode, container) { },
	
	genRepeatContent	: function (repeatNode, container, accu) { 
		xtdom.moveChildOfInto (repeatNode, container, accu);	
	},
	
	finishRepeatGeneration : function (repeatNode, container) { 
		this.verifyBoundaries(container, xtiger.editor.REPEAT_MARK);	
		var rc = new xtiger.editor.Repeat ();
		rc.initFromTree (container, repeatNode, this.curDoc);		
	},
		
	genIteratedTypeBody : function (kind, xtigerSrcNode, container, types) { 
		// generates type menu
		if (types.length > 1) {
			var menu;
			var s = menu = xtdom.createElement(this.curDoc, 'select');			
			for (var i = 0; i < types.length; i++) {
				var o = xtdom.createElement(this.curDoc, 'option');
				var t = xtdom.createTextNode(this.curDoc, types[i]); // FIXME : use i18n here !!!! or fix it after generation
				o.appendChild(t);
				s.appendChild(o);
			}
			// Experimental feature : param="marker=classname"
			var cname;
			var marker = xtigerSrcNode.getAttribute('param');
			if (marker) { // FIXME: at the moment we suppose marker is the only allowed parameter
				var i = marker.indexOf('=');
				if (i != -1) {
					cname = marker.substr( i + 1, marker.length - i - 1);
				}
			}
			if (cname) { // generates a <span class="cname"><xt:menu-marker/><br/><select>...</span> group
				var span = xtdom.createElement(this.curDoc, 'span');
				xtdom.addClassName(span, cname);
				var mm = xtdom.createElementNS(this.curDoc, 'menu-marker', xtiger.parser.nsXTiger);
				span.appendChild(mm);
				var br = xtdom.createElement(this.curDoc, 'br');
				span.appendChild(br);
				span.appendChild(menu);
				menu = span;
			} 			
			// End experimental feature			
			container.appendChild(menu);
			var c = new xtiger.editor.Choice ();
			c.initFromTree(s, types, this.curDoc);
			this.savePendingEditor (c, s); // will be used in finishComponentGeneration
			xtdom.addEventListener (s, 'change', function (ev) { c.handleSelect(ev); }, false);
			xtiger.cross.log('plant', 'Created a Choice editor for types ' + '/' + types + '/' );
		}
	},
		
	// Limitations: xt:option, xt:bag are treated as xt:use
	// any string type is converted to a XttStringEditor (even if it was part of a mixed content model)	
	//
	// FIXME: END OF RECURSION should also address the possible Choice editor under way to call addChoiceItem....
	genIteratedTypeContent	: function (kind, xtigerSrcNode, container, accu, types) { 
		var factory;
		if (factory = this.plugins.getEditorFor(xtigerSrcNode, types)) { 
				// END OF RECURSION for primitive editors and xt:attribute elements
				// assumes default content was pushed on the stack
				var editorHandle = factory.createModel (container, xtigerSrcNode, this.curDoc);
				var srcUseOrBag = (kind == 'attribute') ? xtigerSrcNode : this.peekTopContext (); // attribute node not saved onto the context
				// currently srcUseOrBag and xtigerSrcNode are the same because terminal editors can only be on single choice xt:use				
				editorHandle.xttPrimitiveEditor = factory.createEditorFromTree (editorHandle, srcUseOrBag, this.curDoc);				
		} else {
				for (var i = 0; i < types.length; i++) {
					var curComponentForType = this.iterator.getComponentForType(types[i]);
					if (curComponentForType) { // constructed type
						var generated = curComponentForType.getClone (this.curDoc);
						container.appendChild(generated);
						accu.push (generated); // follow up transformation
					} else {  // END OF RECURSION for non constructed types editors
						var span = xtdom.createElement(this.curDoc, 'span');
						xtdom.addClassName (span, 'axel-generator-error');						
	 					var txt = xtdom.createTextNode (this.curDoc, 'ERROR: "' + types[i] + '" is undeclared or is terminal and part of a choice');
						span.appendChild (txt);
						container.appendChild (span);
					}
				}
		}
	},

	// adds xttOpenLabel and xttCloseLabel on the container boundaries which may be ELEMENT_NODE or TEXT_NODE
	finishIteratedTypeGeneration : function (kind, xtigerSrcNode, container, types) {    
		var label = xtdom.getTagNameXT(xtigerSrcNode);    
		if (! label) 	return;  		
		if (kind == 'attribute') {
			label = '@' + label; // code for a label for an attribute
		}
		if (! container.firstChild) { // sanity check
			xtiger.cross.log('warning', 'XTiger component (label="' + label + '") definition is empty');
			return;
		}
		this.verifyBoundaries(container, xtiger.editor.USE_MARK);			
		xtiger.cross.log('plant', 'Planting use Start & End labels for '	+ label);	
		if (container.firstChild.xttOpenLabel) {
			xtiger.cross.log('warning', 'use "' + label + '" and use "' + container.firstChild.xttOpenLabel + '" with same START !' );
		}		
		var flow = xtigerSrcNode.getAttribute('flow');
		if (flow) {
			label = '!' + flow + '!' + label; 
		}
		container.firstChild.xttOpenLabel = label;		
		if (container.lastChild.xttCloseLabel) {
			xtiger.cross.log('warning', 'use "' + label + '" and use "' + container.lastChild.xttCloseLabel + '" with same END !' );
		}	
		container.lastChild.xttCloseLabel = label;
	},
	
	// last callback
	finishTransformation : function (n) {
		// now activate all the Choice editor (except the one duplicated as models inside repeat)
		var treeWalker = xtiger.cross.makeTreeWalker (n, xtdom.NodeFilter.SHOW_ELEMENT,
					function(node) { return (node.markChoiceEditor) ? xtdom.NodeFilter.FILTER_ACCEPT : xtdom.NodeFilter.FILTER_SKIP; });
		while(treeWalker.nextNode()) {
			if (treeWalker.currentNode.markChoiceEditor) {  // Test for Safari
				treeWalker.currentNode.markChoiceEditor.initializeSelectedItem (0);
			}
		}                            
	},
	
	// Loads data from a DOMDataSource into the generated editor starting at node root
	loadData: function (root, dataSrc, loader) {
		var l = loader || this.defaultLoader;
		if (l) { l.loadData(root, dataSrc) } else { alert("Default XML loader missing !" ) }
	},

	// Serializes data from the generated editor starting at node root into a logger
	serializeData: function (root, logger, serializer) {
		var s = serializer ? serializer : this.defaultSerializer;
		if (s) { 
			s.serializeData(root, logger, this.headLabel);
		} else { 
			alert("Default XML serializer missing !") 
		}
	}
}
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * @class Repeat
 * Manages an "atomic" repeater
 */
xtiger.editor.Repeat = function () {
	this.items = [];   
	this.curDoc = null; // will be in initFromTree or initFromSeed
	this.originPosition = -1;
	// this.model will be set in one of the init functions
}         
                                                      
// Static class function
// Traverses all the englobing repeat editors of a given DOM node
// Sets them if they were optional (minOccurs = 0) and unset
xtiger.editor.Repeat.autoSelectRepeatIter = function (startFrom) {  
	var r;
	var cur = startFrom;
	var startCount = 0;
	var endCount = 0;
	while (cur) {		
		if (cur.startRepeatedItem) {	startCount++;	}
		if ((cur != startFrom) && cur.endRepeatedItem) {
			endCount++;	 // does not count if repeat starts and ends on the node it landed on
		}
		// FIXME: is there a case where startRepeatedItem and endRepeated item can be on the same node ?
		if (startCount > endCount) {  
			r = cur.startRepeatedItem;
			if ((0 == r.min) && (0 == r.total)) {  // was optional and unset
				r.unsetOption (); // sets it
			}     
		 // jumps at the begining of this repeater
		 cur = r.getFirstNodeForSlice(0);
		 startCount = endCount = 0; // reset counting  
		}	
		cur = cur.previousSibling;
	}
	if (startFrom.parentNode) {         
		// FIXME: we could define a .xtt-template-root in the DOM since the template may not start at document root ?
		xtiger.editor.Repeat.autoSelectRepeatIter (startFrom.parentNode);
	}
}   

xtiger.editor.Repeat.prototype = {  
	
	// FIXME: make trash template dependant ?=> create a xtiger.Template ?	
	trash : [], // deleted slices stored as [repeater, [slice,*]] 	
	
	hasLabel : function () {
		return (this.label != 'repeat');
	},                
	
	getRepeatableLabel : function () {
		return this.pseudoLabel;
	},
	
	dump : function () {
		return this.label;
	},
	
	getSize : function () {
		// return this.items.length;
		return this.total;
	},                       
	  
	// Returns the last position after which an item was inserted or pasted after user action
	// Actually when the repeater is expanded as a consequence of loading XML data 
	// the concept of origin position is undefined and it returns -1
	getOriginPosition : function () {
		return this.originPosition;		
	},

	// Returns the last node for the slice at index
	getLastNodeForSlice : function (index) {
		var pos = (index < this.items.length) ? index : this.items.length - 1;
		return this.items[pos][1];
	},

	// Returns the first node for the slice at index 
	// FIXME: createIt is temporary (experiment with TOC)
	getFirstNodeForSlice : function (index, createIt) {
		var pos;
		if (index < this.items.length) {
		 	pos = index;
	    } else {
			if (createIt && (index == this.items.length)) {
				this.appendSlice();	
			}
		    pos = this.items.length - 1;
		}
		return this.items[pos][0];
	},	             
	
	getSliceIndexForStartMarker : function (node) {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i][0] == node) {
				return i;
			}
		}		
		return -1;
	},  
	
	makeSeed : function (srcRepeater, dict) {
		if (this == srcRepeater) {
			xtiger.cross.log('clone-trace', '*repeater* do not replicate top/master repeater', this.seed[3]);
		} else {
			if (this.seed) {
				if (this.seed[0] == -2) { // -2 means it's a top/master repeater seed
					var m = dict[this.seed[3]]; // remaps it as a (-1) non top/master seed if not already done
					if (! m) {
						var id = xtdom.genId();
						xtiger.cross.log('clone-trace', '*repeater* remaps a non top/master repeater', id);
						m = [-1, this.seed[1], this.seed[2], id, this.min, this.max, this.pseudoLabel];
						dict[this.seed[3]] = m;						
					}
					return m;
				} else {
					xtiger.cross.log('debug', '*repeater* [should not happen] seed ' + this.seed[3] + ' already mapped as ' + this.seed[0]);
				}
			} else {
				var id = xtdom.genId();
				xtiger.cross.log('debug', '*repeater*  [should not happen] making a entirely repeater seed', id);
				this.seed = [-1, srcRepeater.label, srcRepeater.model, id, this.min, this.max, this.pseudoLabel]; // global model sharing
			}
		}
		return this.seed; // normally for the top/master repeater it has already been created by ShallowClone
	},	
	
	initFromSeed : function (repeaterSeed, doc) {                                             
		this.curDoc = doc;
		this.label = repeaterSeed[1];
		this.model = repeaterSeed[2];          
		this.min = repeaterSeed[4];          
		this.max = repeaterSeed[5];
		this.pseudoLabel = repeaterSeed[6];
		this.total = (this.min > 0) ? 1 : 0; // FIXME: generate entries if this.min > 1 !		
		this.items = [[null, null, null, null]]; // will be set through setStartItem, setEndItem and setMarkItem		
	},
	
	setStartItem : function (node) {
		this.items[0][0] = node;
	},

	setEndItem : function (node) {
		this.items[0][1] = node;
	},

	// this method supposes the callee Repeater has not yet been repeated becauses it always initializes 
	// the first repeated slice (this.items[0])
	setMarkItem : function (node) {
		if (this.items[0][2]) { // sets mark1 (left menu)
			this.items[0][3] = node;  
		} else { // sets mark2 (right menu)
			this.items[0][2] = node;
		}
		var _this = this; // closure
		xtdom.addEventListener (node, 'click', function (ev) { _this.handleRepeat(ev)}, true);
		xtiger.cross.log('iter-trace', 'setMarkItem for repeater ' + this.dump() + ' on node ' + node.tagName);
	},       
	                                       
	// Update menu depending on repeater state and min/max constraints
	configureMenuForSlice : function (index) {   
		// window.console.log('Configure menu min=%s max=%s total=%s index=%s length=%s', this.min, this.max, this.total, index, this.items.length);
		if (index >= this.items.length) {
			xtiger.cross.log('error', 'Wrong menu configuration in repeater ' + this.dump());
			return;
		}
		var leftImg = this.items[index][2];
		var rightImg = this.items[index][3];    
				 
		// configures image for left menu
		var srcLeft = xtiger.bundles.repeat.checkedIconURL;
		if (0 == this.min) {
			if (0 == this.total) {
				srcLeft = xtiger.bundles.repeat.uncheckedIconURL; // no item loaded into the repeat
			} else if (1 == this.total) {
				srcLeft = xtiger.bundles.repeat.checkedIconURL; // just one item loaded into the repeat
		 	} else {                         
				srcLeft = xtiger.bundles.repeat.minusIconURL; // more than one item and they can be deleted 
			}
		} else if (this.total == this.min) {
			srcLeft = xtiger.bundles.repeat.plusIconURL; // only one item and min is not 0
		} else {
			srcLeft = xtiger.bundles.repeat.minusIconURL;
		}               
		// window.console.log('Set left ' + srcLeft);
		xtdom.setAttribute (leftImg, 'src', srcLeft);  
		
		// configures image for right menu
		xtdom.setAttribute (rightImg, 'src', xtiger.bundles.repeat.plusIconURL); // always +
		var rightVisible = false;
		if (0 == this.min) {
			if (((this.max > 1) || (-1 == this.max)) && (this.total > 0)) {
				rightVisible = true;
			}
		} else if ((this.total > 1) && ((this.max > 1) || (-1 == this.max))) {
			rightVisible = true;			
		}                          
		// window.console.log('Set right visibility ' + rightVisible);
		if (rightVisible) {
			xtdom.removeClassName (rightImg, 'axel-core-off');
		} else {
			xtdom.addClassName (rightImg, 'axel-core-off');
		}
	},
		
	initFromTree : function (container, repeatNode, doc)  {
		this.curDoc = doc;
		this.label = repeatNode.getAttribute('label') || 'repeat'; // FIXME: supposes 'repeat' is forbidden in XML tag names
		this.pseudoLabel = repeatNode.getAttribute('pseudoLabel') || 'repeat';
		var val = repeatNode.getAttribute('minOccurs') || 0;
		this.min = isNaN(val) ? 1 : parseInt(val); // defaults min to 1
		val = repeatNode.getAttribute('maxOccurs') || -1;
		this.max = isNaN(val) ? -1 : parseInt(val); // defaults max to -1 (unbounded)
		this.total = (this.min > 0) ? 1 : 0; // FIXME: generate entries if this.min > 1 !
		xtiger.cross.log('plant', 'Create Repeat Editor ' + this.min + '/' + this.max + '/' + this.label);		
				
		// prepares the Repeat menu (an <img>)
		var rightImg = xtdom.createElement(this.curDoc, 'img');
		var width = '16';
				
		// Insertion Point sniffing: the goal is to guess and to insert the repeater menu
		var insertPoint;
		if (insertPoint = xtdom.getMenuMarkerXT(container)) {		
			// 1st case: there is a <xt:menu-mark> remaining inside the container
			insertPoint.parentNode.replaceChild(rightImg, insertPoint);
			width = insertPoint.getAttribute('size') || width; // fixme: inherit class attribute instead
		} else {
			// 2nd case: checks if the repeater is the repeater of a single auto-wrapped element
			var counter = 0;
			var cur = container.firstChild;
			while (cur) {
				if (cur.nodeType == xtdom.ELEMENT_NODE) {
					var curclass = cur.className;
					if (curclass && (-1 != curclass.indexOf('xtt-auto-wrapped'))) { // TODO check if shouldn't be replaced by axel-auto-wrapped
						if (counter == 0) {
							insertPoint = cur;
						}	
						counter++;										
					}
				}				
				cur = cur.nextSibling;
			}
			if (counter == 1) { // inserts the menu just after the autowrapped element
				insertPoint.appendChild(rightImg);
			} else {
				// 3rd case: inserts the menu at the end of the slice
				container.appendChild(rightImg);				
			}
		} 
		
		// finishes menu configuration
		xtdom.setAttribute (rightImg, 'width', width);
		xtdom.addClassName (rightImg, 'axel-repeat-right');
		
		// inserts the second menu
		var leftImg = xtdom.createElement(this.curDoc, 'img');
		xtdom.setAttribute (leftImg, 'width', width);
		xtdom.addClassName (leftImg, 'axel-repeat-left');
		rightImg.parentNode.insertBefore (leftImg, rightImg, false);		
		
		// sets repeater boundaries to the whole slice		
		start = container.firstChild;
		end = container.lastChild;
		
		// saves special attributes         
		if (start.startRepeatedItem) {
			xtiger.cross.log('warning', 'Repeat "' + this.label + '" and repeat "' + start.startRepeatedItem.label + '" with same START boundaries !');
		}		
		start.startRepeatedItem = this;	// NOTE marker here	
		// start.startRepeatLabel = 'startRepeat'; //DEBUG IE
		if (end.endRepeatedItem) {
			xtiger.cross.log('warning', 'Repeat "' + this.label + '" and repeat "' + end.endRepeatedItem.label + '" with same END boundaries !');
		}		
		end.endRepeatedItem = this; // NOTE MARKER HERE
		// end.endRepeatLabel = 'endRepeat'; //DEBUG IE			
		leftImg.markRepeatedEditor = this;	
		rightImg.markRepeatedEditor = this;	
		
		if (start.xttOpenLabel) {
			xtiger.cross.log('warning', 'Repeat "' + this.label + '" and use with same START boundaries !');
		}		
		if (end.xttCloseLabel) {
			xtiger.cross.log('warning', 'Repeat "' + this.label + '" and use with same END boundaries !');
		}		
		var _this = this; // closure
		xtdom.addEventListener (leftImg, 'click', function (ev) { _this.handleRepeat(ev)}, true);
		xtdom.addEventListener (rightImg, 'click', function (ev) { _this.handleRepeat(ev)}, true);
		// creates a clone of the repeated content (linked with its repeated editors)
		// it will resides outside of the tree
		// if (this.max > 1) {
			this.model = this.shallowClone (container); 
		// }
		this.items.push ( [start, end, leftImg, rightImg] ); // first slice  
		this.configureMenuForSlice (0);
		if (0 == this.min) {
			this.unactivateSliceAt (0);
		}
	},			
	
	// The shallow clone used as a model only contains seeds for reinstantiating the editors
	shallowFinishCloning : function (clone, node, dict) {
		// use labels seeds
		if (node.xttOpenLabel)	clone.xttOpenLabel = node.xttOpenLabel;		
		if (node.xttCloseLabel)	clone.xttCloseLabel = node.xttCloseLabel;				
		// repeat editors	seeds
		if (node.markRepeatedEditor)	clone.markRepeatedEditor = node.markRepeatedEditor.makeSeed(this, dict);
		if (node.startRepeatedItem)	clone.startRepeatedItem = node.startRepeatedItem.makeSeed(this, dict);
		if (node.endRepeatedItem)	clone.endRepeatedItem = node.endRepeatedItem.makeSeed(this, dict);
		// choice editors seeds
		if (node.markChoiceEditor)	clone.markChoiceEditor = node.markChoiceEditor.makeSeed();		
		if (node.beginChoiceItem)	clone.beginChoiceItem = node.beginChoiceItem.makeSeed();				
		if (node.endChoiceItem)	clone.endChoiceItem = node.endChoiceItem.makeSeed();		
		// primitive editor seeds
		if (node.xttPrimitiveEditor)	clone.xttPrimitiveEditor = node.xttPrimitiveEditor.makeSeed();
		// service seeds
		if (node.xttService)	clone.xttService = node.xttService.makeSeed();
	},
		
	// FIXME: there is a bug when there are n repeat inside a repeat (n > 1), all the repeaters are merged and the last one wins
	// when the main repeater is cloned....
	shallowClone : function (node) {
		var dict = {}; // used to remap seeds
		var clone = xtdom.cloneNode (this.curDoc, node, false);  // "canonical tree" with "virgin" repeaters (should be unrepeated)
		this.seed = [-2, this.label, clone, xtdom.genId(), this.min, this.max, this.pseudoLabel]; // -2 is a convention (must be != from -1)		
		this.shallowFinishCloning (clone, node, dict);
		for (var i = 0; i < node.childNodes.length; i++) {
			this.shallowCloneIter (clone, node.childNodes[i], dict);
		}                                             
		return clone; // the clone is not saved in a document (dangling)
	},
	                        		
	// Creates a clone of the container including cloning of special attributes
	// This is a shallow clone because all the models set for the repeaters remain shared
	// set by XTigerTrans editor transformation algorithm
	shallowCloneIter : function (parent, node, dict) {   
		var clone = xtdom.cloneNode (this.curDoc, node, false);
		this.shallowFinishCloning (clone, node, dict);		
		parent.appendChild(clone);
		for (var i = 0; i < node.childNodes.length; i++) {
			this.shallowCloneIter (clone, node.childNodes[i], dict);
		}
	},
	
	// Cloning of the XttChoiceEditor(s) from the model sub-tree
	getChoiceEditorClone : function (dict, editorSeed) {
		var m = dict[editorSeed];  // find it's duplicated version
		if (! m) {
			var m = new xtiger.editor.Choice ();
			m.initFromSeed (editorSeed, this.curDoc); // FIXME : use a better hash key than another object ?
			dict[editorSeed] = m;
		}                     
		return m;
	},

	// Cloning of the Repeat editor(s) from their seed
	// Dict key is taken from the unique Repeat editor id saved into the seed
	getRepeatEditorClone : function (dict, editorSeed) {
	  var m = dict[editorSeed[3]];  // find it's duplicated version
		if (! m) {
			var m = new xtiger.editor.Repeat ();
			m.initFromSeed (editorSeed, this.curDoc);
			dict[editorSeed[3]] = m; // FIXME : use a better hash key than another object ?
			xtiger.cross.log('stack-trace', 'cloning repeat editor', m.dump(), '(' + editorSeed[3] + ')');
		}                     
		return m;
	},	
	
	deepFinishCloning : function (clone, node, modelDict, masterRepeater, accu) {
		// xt:use labels cloning
		if (node.xttOpenLabel)	clone.xttOpenLabel = node.xttOpenLabel;		
		if (node.xttCloseLabel)	clone.xttCloseLabel = node.xttCloseLabel;		
		
 		// repeat editor cloning if it is linked to an editor different than the current master
		if (node.startRepeatedItem) {
			if (node.startRepeatedItem[0] == -1) {  // it's not the current repeater
			  var m = this.getRepeatEditorClone(modelDict[0], node.startRepeatedItem);  // find it's duplicated version
				m.setStartItem (clone);
				clone.startRepeatedItem = m; 
			} else {
				clone.startRepeatedItem =  this; // it belongs to the repeater beeing clone
				accu[0] = clone;
			}
		}  
 		if (node.endRepeatedItem) {
			if (node.endRepeatedItem[0] == -1) {  // it's not the current repeater
		  	var m = this.getRepeatEditorClone(modelDict[0], node.endRepeatedItem);  // find it's duplicated version
				m.setEndItem (clone);
				clone.endRepeatedItem = m; 
			} else {
				clone.endRepeatedItem =  this; // it belongs to the repeater beeing clone
				accu[1] = clone;
			}
		}
 		if (node.markRepeatedEditor) {
			if (node.markRepeatedEditor[0] == -1) {  // it's not the current repeater
	  		var m = this.getRepeatEditorClone(modelDict[0], node.markRepeatedEditor);  // find it's duplicated version
				m.setMarkItem (clone); // must do the addEventListener stuff as below (!)
				clone.markRepeatedEditor = m; 
			} else {
				// the following is equivalent to this.setMarkItem(clone) but it does not alter the repeater items list
				// because the accumulated index will be appended to it at the end
				clone.markRepeatedEditor =  this; // it belongs to the repeater beeing clone
				var _this = this; // closure
				xtdom.addEventListener (clone, 'click', function (ev) { _this.handleRepeat(ev)}, true);
				if (accu[2]) { // mark1 was already set, sets mark2
					accu[3] = clone;
				} else {
				 	accu[2] = clone;
				}
			}
		}		
			
		// choice editor cloning						
		if (node.markChoiceEditor) {
		  var m = this.getChoiceEditorClone (modelDict[1], node.markChoiceEditor);
			m.setChoiceMenu (clone);
			clone.markChoiceEditor = m; 				
		}
		if (node.beginChoiceItem) {
		  var m = this.getChoiceEditorClone (modelDict[1], node.beginChoiceItem);
			m.setBeginChoiceItem (clone);
			clone.beginChoiceItem = m; 				
		}
		if (node.endChoiceItem) {
		  var m = this.getChoiceEditorClone (modelDict[1], node.endChoiceItem);
			m.setEndChoiceItem (clone);
			clone.endChoiceItem = m; 				
		}
		
		// primitive editor cloning
		if (node.xttPrimitiveEditor) {
			var seed = node.xttPrimitiveEditor;
			var factory = seed[0];			
			clone.xttPrimitiveEditor = factory.createEditorFromSeed (seed, clone, this.curDoc, this);
		}

		// service cloning
		if (node.xttService) {
			var seed = node.xttService;
			var factory = seed[0];			
			clone.xttService = factory.createServiceFromSeed (seed, clone, this.curDoc, this);
		}
	},
	
	// Creates a clone of the container including cloning of special attributes
	// This is a deep clone because all the models set for the repeaters are also cloned
	// Returns the clone which dangling
	deepClone : function (node, accu) {
		var clone = xtdom.cloneNode (this.curDoc, node, false);  
		var modelDict = [{}, {}]; // first hash for Repeat editor and second for Choice editor
		this.deepFinishCloning (clone, node, modelDict, this, accu); 
		for (var i = 0; i < node.childNodes.length; i++) {
			this.deepCloneIter (clone, node.childNodes[i], modelDict, this, accu);
		}    
		return clone;
	},
	                    
	// modelDict contains translation table to duplicate nested Repeat editors
	// masterRepeater is the repeater which initiated the cloning          
	// accu stores the indexical elements (start, end, mark) for the masterRepeater
	deepCloneIter : function (parent, node, modelDict, masterRepeater, accu) {		
		if (node.xttPrimitiveEditor) { // FIXME: leaf cloning behavior (to be verified)
			var clone = xtdom.cloneNode (this.curDoc, node, true);		
			parent.appendChild (clone); // parent and clone MUST BE in the same document
			this.deepFinishCloning (clone, node, modelDict, masterRepeater, accu); 
			return;
		} 
		var clone = xtdom.cloneNode (this.curDoc, node, false);		
		parent.appendChild (clone); // parent and clone MUST BE in the same document
		this.deepFinishCloning (clone, node, modelDict, masterRepeater, accu); 
		for (var i = 0; i < node.childNodes.length; i++) {
			this.deepCloneIter (clone, node.childNodes[i], modelDict, masterRepeater, accu);
		}
	},
	
	// Returns a new slice copied from the repeater model
	getOneCopy : function (index, position) {
		return this.deepClone(this.model, index);
	},   
	    
	// Keeps only one slice and updates this.total
	// not used at that time
	reset : function () {                 
		var start = this.min + 1;
		for (var i = start; i < this.total; i++ ) { // extra slices to delete
			this.removeItemAtIndex (i, false);
		}                  
		this.total = this.min; 
		this.configureMenuForSlice (0);
	},
	
	// Inserts a slice index into the list of slices of the repeater at a given position
	// to be called after the slice nodes have been inserted into the DOM
	plantSlice : function (index, position) {
		if (this.items.length == 1) { 
			// there was only one item, now there will be two so they both can be deleted
			xtdom.removeClassName(this.items[0][2], 'axel-core-off');
		}
		this.items.splice(position + 1, 0, index);			
	},     
	  
	// Called by the generator each time a new slice has been loaded
	// Must be done explicitely (and not in appendSlice) because optional repeater (min=0)
	// have a state with 1 slice and 0 data
	sliceLoaded : function () {                
		this.total++;                                                 
		if ((0 == this.min ) && (1 == this.total)) { // transition from 0 to 1
			this.activateSliceAt (0);
		} 		
		if (((0 == this.min ) && (2 == this.total)) 
			  || ((this.min > 0) && (this.total == (this.min + 1))))
		{                                
			// special transition
			for (var i = 0; i <= this.min; i++) {
				this.configureMenuForSlice (i);
			}
		}
		// updates menu configuration for the 1st item, added item and last item        
		this.configureMenuForSlice (this.total-1); // configuration for last item			
	},
		
	// Adds a new Slice copied from the repeater model at the end of the slices
	// Returns the index of the new slice
	appendSlice : function () {		
		var lastIndex = this.items.length - 1;
		var lastNode = this.getLastNodeForSlice(lastIndex);
		var index = [null, null, null, null];
		this.originPosition = -1; // lastIndex; because currently load follows document order
		var copy = this.getOneCopy (index); // clones the model and creates a new slice
 		xtdom.moveChildrenOfAfter (copy, lastNode);
		this.plantSlice (index, lastIndex);	   		
		this.dispatchEvent(index, 'duplicate');
		return lastIndex + 1;  
	},
	
	// Manages the "menu" of the Repeater (i.e. plus and minus buttons)
	handleRepeat : function (ev) {		
		var appended = false;
		var target = xtdom.getEventTarget(ev);
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i][2] == target) {
				if ((0 == this.min) && (0 == this.total)) {
					this.unsetOption (); // in that case + was on the left (i.e. unchecked option)
					appended = true;
				}	else if ((this.min > 0) && (1 == this.total)) { // in that case + was on the left...
					this.addItem(target, i, ev.shiftKey);
					appended = true;					
		 		} else {      
					if ((0 == this.min) && (1 == this.total)) {
						this.setOption (); // not a real delete
					} else {
						this.deleteItem(target, i, ev.shiftKey);
					}
				}
				break;
			} else if (this.items[i][3] == target) {  
				this.addItem(target, i, ev.shiftKey);
				appended = true;				
				break; // avoid recursion !
			}
		}
		if (appended) { 
			xtiger.editor.Repeat.autoSelectRepeatIter (this.getFirstNodeForSlice(0)); // propagates it 			
		}
	},     
	  
	// Transition from 0 item to 1 item (was optional, becomes part of the document)   
	// Only for repeated elements with a min of 0  !
	unsetOption : function () {
		this.total++; 
		this.configureMenuForSlice (0);
		this.activateSliceAt(0);
	},           
	
	activateNodeIter : function (node, curInnerRepeat) {
		if ((!curInnerRepeat) || (curInnerRepeat.total >= 1)) { // restores it if current repetition nb >= 1
			xtdom.removeClassName(node, 'axel-repeat-unset'); 
		}
	},
	                     
	// Removes the class 'axel-repeat-unset' on all the top elements of the slice at position index
	activateSliceAt : function (index) {
		this.mapFuncToSliceAt(xtiger.editor.Repeat.prototype.activateNodeIter, index, false);
	},

	// Transition from 1 item to 0 item (1st item is removed from the document)
	// Only for repeated elements with a min of 0 !	
	setOption : function () {    
		this.total--;
		this.configureMenuForSlice (0);		
		this.unactivateSliceAt (0);
	},      
	
	unactivateNodeIter : function (node, curInnerRepat) {
		xtdom.addClassName(node, 'axel-repeat-unset'); 
		// if (curInnerRepat) { window.console.log('unactivate ' + curInnerRepat.label);	}
	},

	// Adds class 'axel-repeat-unset' on all the top elements of the slice at position index
	unactivateSliceAt : function (index) {
		this.mapFuncToSliceAt(xtiger.editor.Repeat.prototype.unactivateNodeIter, index, true);
	},
	           
	/** 
	 * Calls the method named 'action' on all the primitive editors in the 'top' tree
	 * Passes the repeater to the action
	 */
	callPrimitiveEditors : function (top, action) {             
		var treeWalker = xtiger.cross.makeTreeWalker (top, xtdom.NodeFilter.SHOW_ELEMENT,
				function (n) { 
						if (n.xttPrimitiveEditor && n.xttPrimitiveEditor.can(action)) {
							return xtdom.NodeFilter.FILTER_ACCEPT
						} else {
							return xtdom.NodeFilter.FILTER_SKIP; 
						}
				} );
		while(treeWalker.nextNode()) {
			treeWalker.currentNode.xttPrimitiveEditor.execute(action, this);
		}		
	}, 
	  
	// Dispatches an event (which is converted to a builtin method call) on a slice
	dispatchEvent : function (slice, name) {
        var cur = slice[0];
        do {
			this.callPrimitiveEditors(cur, name);
			cur = cur.nextSibling;                          
        } while (cur && (cur != slice[1]));
		
	},  
	
	addItem : function (mark, position, useTrash) {    
		var saved, slice, end, n, newIndex, i;
		var preceeding = this.items[position];		
		if (useTrash) { // checks for a previously deleted item for this Repeater		
			for (i = 0; i < this.trash.length; i++) {
				if (this.trash[i][0] == this) {
					saved = this.trash[i];
					break;
				}
			}		
		}		                                  
		this.originPosition = position; // set up origin for event dispacthing to primitive editors
		if (saved) { // pastes the latest deleted item from this Repeater
			newIndex = saved[2];
			slice = saved[1];			
			xtdom.moveNodesAfter (slice, preceeding[1]);
			this.trash.splice(i, 1);
			// Replaced with 'duplicate' event (see infra)
			// cur = newIndex[0]; // dispatches a kind of 'paste' event to interested primitive editors
			// 			this.callPrimitiveEditors(cur, 'paste');
			// 			end = newIndex[1];      
			// 			while (cur != end) {    
			// 				this.callPrimitiveEditors(cur, 'paste');				
			// 				cur = cur.nextSibling;
			// 			}
		} else { // creates and pastes a default item (from the Repeater's model)
			newIndex = [null, null, null, null];
			n = this.getOneCopy (newIndex, position);
 			xtdom.moveChildrenOfAfter (n, preceeding[1]);
		}          
		this.originPosition = -1;		
		this.plantSlice (newIndex, position);   
		this.total++; 
		// updates menu configuration for the 1st item, added item and last item        
		if (0 == position) {
			this.configureMenuForSlice (0);	// configuration for 1st item
		}       
		this.configureMenuForSlice (position + 1); // configuration for added item            
		this.configureMenuForSlice (this.total-1); // configuration for last item		
		this.dispatchEvent(newIndex, 'duplicate'); // FIXME: add a 'fromClipboard' arg ?
	},
	
	// FIXME: prevoir d'iterer sur tous les editeurs (choice, repeat, primitive) et d'appeler une methode
	// deleteEditor() pour qu'ils se désabonnent
	deleteItem : function (mark, position, useTrash) {
		this.removeItemAtIndex (position, useTrash);
		if (this.total <= 1) {
			this.configureMenuForSlice (0);	// configures menu for 1st item
		} else {
			this.configureMenuForSlice (this.total-1); // configures menu for last item		
		}
	},            
	  
	removeItemAtIndex : function (position, useTrash) {   
		var cur, next;
		this.originPosition = position;			
		// must delete node between start and end
		var index = this.items[position];    
		var slice = useTrash ? [] : null;
		if (index[0] == index[1]) { // start == end  (i.e. the repeated use was auto-wrapped)
			if (useTrash) {	slice.push (index[0]);	} 
			this.callPrimitiveEditors(index[0], 'remove');
			index[0].parentNode.removeChild(index[0]);			
		} else {
			// deletes the forest between index[0] and index [1], including themselves
			// PRE-CONDITION: works only if index[0] and index [1] are siblings ! (should be the case by construction)       
			this.dispatchEvent(index, 'remove');
			// do the real thing			
			next = index[0].nextSibling;
			if (useTrash) {	slice.push (index[0]); }
			// this.callPrimitiveEditors(index[0], 'remove');
			index[0].parentNode.removeChild(index[0]);
			while (next && (next != index[1])) {
				cur = next;
				next = next.nextSibling;
				if (useTrash) {	slice.push (cur); }        
				// this.callPrimitiveEditors(cur, 'remove');
				index[1].parentNode.removeChild(cur);
			}
			if (useTrash) {	
				slice.push (index[1]); 
			}
			index[1].parentNode.removeChild(index[1]);
		}  
		this.originPosition = -1;		
		this.items.splice(position, 1);	 
		if (useTrash) {	this.trash.push([this, slice, index]); } 		
		this.total--;		
	},                                    
	                            
	// Traverses each top node in the slice, and calls func on it iff it is an ELEMENT node
	// func should not change the slice 
	mapFuncToSliceAt : function (func, index) {    
		var cur, slice, curInnerRepeat, stackInnerRepeat;    
		var opened = 0;       
		slice = this.items[index]; // FIXME: no sanity check on index ?
		cur = slice[0];
		curInnerRepeat = null;
		if (slice[0] == slice[1]) { // manages the case when the slice starts and ends on the same node
			if (xtdom.ELEMENT_NODE == cur.nodeType) {
				func.call(this, cur, curInnerRepeat);			
			}
		} else {
			while (cur && (cur != slice[1])) {
				if (cur.startRepeatedItem && (cur.startRepeatedItem != this)) { // tracks inner repeat
					if (curInnerRepeat) { // there was already some, stacks them
						if (! stackInnerRepeat) {
							stackInnerRepeat = [ curInnerRepeat ];
						} else {
							stackInnerRepeat.push(curInnerRepeat);
						}
					}
					curInnerRepeat = cur.startRepeatedItem;
					if (cur.endRepeatedItem && (cur.endRepeatedItem == cur.startRepeatedItem)) { 
						// special case with an innerRepeat that starts and ends on the same node
						// we push it so that the next test will set curInnerRepeat to it
						if (! stackInnerRepeat) {
							stackInnerRepeat = [ curInnerRepeat ];
						} else {
							stackInnerRepeat.push(curInnerRepeat);
						}
					}
				}      
				if (cur.endRepeatedItem && (cur.endRepeatedItem != this)) {			    
					if (stackInnerRepeat && (stackInnerRepeat.length > 0)) {
						curInnerRepeat = stackInnerRepeat.pop();
					} else {
						curInnerRepeat = null;
					}
				}
				if (xtdom.ELEMENT_NODE == cur.nodeType) {
					func.call(this, cur, curInnerRepeat);
				}
				cur = cur.nextSibling;
			} // FIXME: shouldn't we iterate too on the last slice ?
		}		
	}
}

// Resource registration
xtiger.resources.addBundle('repeat', 
	{ 'plusIconURL' : 'plus.png',
	  'minusIconURL'  : 'minus.png',	
	  'uncheckedIconURL' : 'unchecked.png',
	  'checkedIconURL' : 'checked.png'	} );/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Manages  the different types in an iterated component (a xt:use with multiple types)
 */
xtiger.editor.Choice = function () {
	this.items = [];
	// each of the type identified as { 'typeName' : [beginNode, endNode], ...  }
	this.curItem = -1; // special value (see selectChoiceItem)
	// this.items must be garnished by calling addItem (name, begin, end)
	this.curDoc = null; // will be in initFromTree or initFromSeed	
}            

xtiger.editor.Choice.prototype = {  
	
	initFromTree : function (menu, types, doc) { 
		this.curDoc = doc;
		this.menu = menu; // select menu
		menu.markChoiceEditor = this; // for future cloning		
		this.types = types; // pre-condition: it must be an array ... coming from xtigercore.js
	},
	
	getTypes : function () {
		return this.types;
	},		

	getSelectedChoiceName	: function () {
		return this.types[this.curItem];
	},
		
	// The seed is a data structure that should allow to "reconstruct" a cloned editor
	makeSeed : function () {
		if (! this.seed) {
			this.seed = [this.items.length, this.types];
		}
		return this.seed;
	},
			
	// Clone this editor from another one
	// setChoiceMenu, setBeginChoiceItem and setEndChoiceItem should be called shortly after
	initFromSeed : function (editorSeed, doc) { 
		this.curDoc = doc;
		this.expectedLength = editorSeed[0];
		this.types = editorSeed[1];
	},
		
	setChoiceMenu : function (clone) { 
		this.menu = clone;
		var _this = this;
		xtdom.addEventListener (clone, 'change', function (ev) { _this.handleSelect(ev); }, false);
	},
	
	setBeginChoiceItem : function (clone) { 
		this.items.push ([clone, null]);
	},
	
	setEndChoiceItem : function (clone) { 
		this.items [this.items.length - 1][1] = clone;
		if (this.items.length == this.expectedLength) {
			xtiger.cross.log('stack-trace', 'Choice initialization terminated after cloning, size=' + this.expectedLength);
			this.initializeSelectedItem (0);  // FIXME : check that it's not too early
		}
	},	
	
	addChoiceItem : function (name, begin, end) {
		// console.log('addChoiceItem name=' + name + ' start=' + begin.nodeName + ' end=' + end.nodeName);
		this.items.push([begin, end]);
		if (begin.beginChoiceItem) {
			xtiger.cross.log('warning', 'Choice <', name, '> ends with an already existing choice');
		}
		if (end.endChoiceItem) {
			xtiger.cross.log('warning', 'Choice <', name, '> ends with an already existing choice end');
		}
		begin.beginChoiceItem = this; // for future cloning		
		// begin.beginChoiceLabel = 'beginChoice ' + name; // DEBUG
		end.endChoiceItem = this; // for future cloning
		// end.endChoiceLabel = 'endChoice ' + name; // DEBUG
	},
			
	initializeSelectedItem : function (rank) {
		// memorizes the state of the previous display style properties of everyone to be able to restore it
		for (var i = 0; i < this.items.length; i++) {
			var memo = [];
			var item = this.items[i];
			var begin = item[0];
			var end = item[1];
			var cur = begin;			
			memo.push(xtdom.getInlineDisplay(cur));
			if (i != rank) { // hides it
				if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = 'none';
			}	
			while (cur != end) {				
				cur = cur.nextSibling;
				memo.push(xtdom.getInlineDisplay(cur));				
				if (i != rank) { // hides it
					if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = 'none';
				}				
			}
			item.push (memo); // saves current state
		}
		this.curItem = rank;
	},
	
	// Changes class attribute of the node span corresponding to the type item 'name' so that it becomes visible
	// Changes class attribute of the previously visible type item 'name' so that it becomes invisible 
	selectChoiceItem : function (rank) {
		xtiger.cross.log('plant', 'Choice.selectChoiceItem ' + rank);
		if (this.curItem == rank)	return;
		if (this.curItem != -1) {
			// hides last selection
			var item = this.items[this.curItem];
			var begin = item[0];
			var end = item[1];
			var memo = [];
			var cur = begin;
			memo.push(xtdom.getInlineDisplay(cur));			
			if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = 'none';			
			while (cur != end) {				
				cur = cur.nextSibling;
				memo.push(xtdom.getInlineDisplay(cur));				
				if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = 'none';
			}		
			item[2] = memo; // replaces with current state
		}
		// shows current selection (i.e. restores the display style to what it was before)		
		var item = this.items[rank];
		var begin = item[0];
		var end = item[1];
		var memo = item[2];
		var i = 0;
		var cur = begin;
		if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = memo[i];
		while (cur != end) {				
			i++;
			cur = cur.nextSibling;
			if (cur.nodeType == xtdom.ELEMENT_NODE)	cur.style['display'] = memo[i];
		}		
		this.curItem = rank;		
	},	
	
	selectChoiceForName : function (name) {		
		xtiger.cross.log('plant', 'Choice.selectChoiceForName ' + name);		
		var i;
		for (i = 0; i < this.types.length; i++) {
			if (this.types[i] == name) {
				break
			}
		}
		if (i != this.types.length) {
			this.selectChoiceItem (i);
			xtdom.setSelectedOpt (this.menu, i);			
			return i;			
		} else {
			return this.curItem;
		}
	},
	
	// Menu event handler
	handleSelect : function (ev) {
		var option = xtdom.getSelectedOpt (this.menu);
		this.selectChoiceItem(option);
		
	}
}/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

// open issue: should we create one keyboard instance per document or not ?

/**
 * Centralizes keyboard input among several input devices (e.g. each <input> or <textarea>)
 * This is useful in particular to factorize the tab management code
 * 
 * @class Keyboard
 */
xtiger.editor.Keyboard = function () {
	this.tabGroupManager = false;
	this.currentDevice = false;   
	this.allowRC = false;
}

// FIXME: dans register memoriser tous les abonnements pour les desabonner sur une method (reset)
// à appeler quand on change de document // frame (?)
xtiger.editor.Keyboard.prototype = {
		
		/**
		 * 
		 * @param t
		 * @return
		 */
	setTabGroupManager : function (t) {
		this.tabGroupManager = t;
	},
	
	/**
	 * Allows a device to register to keyboard events on its handle.
	 * 
	 * @param {Device}
	 *            aDevice
	 * @param {DOMElement|DOMDocument}
	 *            aAltHandle Optional. A handle listening to DOM events. If not
	 *            submitted, the device's default handle (device.getHandle()) is
	 *            used.
	 * @return {[function]} Handler's references to unregister
	 */
	register : function (aDevice, aAltHandle) {
		
		var _handle = aAltHandle ? aAltHandle : aDevice.getHandle();
		
		// closure variables
		var _this = this;
		var _device = aDevice;
		
		var _handlers = {
				keydown: function (ev) { _this.handleKeyDown(ev, _device) },
				keyup: function (ev) { _this.handleKeyUp(ev, _device) }
		}
		xtdom.addEventListener(_handle, 'keydown', _handlers.keydown, false);
		xtdom.addEventListener(_handle, 'keyup', _handlers.keyup, false);
		return _handlers;
	},
	
	/**
	 * 
	 * @param device
	 * @param handlers
	 * @return
	 */
	unregister : function (aDevice, handlers, aAltHandle) {			
		var _handle = aAltHandle ? aAltHandle : aDevice.getHandle();
		xtdom.removeEventListener(_handle, 'keydown', handlers.keydown, false);
		xtdom.removeEventListener(_handle, 'keyup', handlers.keyup, false);
	},
	
	// Esc does not trigger keyPress on Safari, hence we need to intercept it with keyDown
	handleKeyDown : function (ev, device) {
		if (device.isEditing()) {
			if (this.tabGroupManager) {
				this.tabGroupManager.filterKeyDown(ev);
			}                              
			// On FF ctrlKey+ RC sends an event but the line break is not added to the textarea hence I have selected shiftKey                       
			var validate = (this.allowRC && (ev.keyCode == 13) && (! ev.shiftKey)) || ((!this.allowRC) && (ev.keyCode == 13));
			if (validate) {
				device.stopEditing(false);
			} else if (ev.keyCode	== 27) {
				device.cancelEditing ();
			}			
			device.doKeyDown (ev);			
		}	
	},
	handleKeyUp : function (ev, device) {
		if (device.isEditing()) {
			if (this.tabGroupManager && this.tabGroupManager.filterKeyPress(ev)) {      
				xtdom.preventDefault(ev);
				xtdom.stopPropagation(ev);
			} else {
				device.doKeyUp (ev);
			}
		}
	},
	grab : function (device, editor) {
		if (this.tabGroupManager) {
			this.tabGroupManager.startEditingSession (editor);
			// window.console.log('TabGroupManager start editing ' + editor);
		}
	},
	release : function (device, editor) {
		if (this.tabGroupManager) {
			this.tabGroupManager.stopEditingSession ();
			// window.console.log('TabGroupManager stop editing');
		}
	},
	enableRC : function () {  
		this.allowRC = true;     
	}, 
	disableRC : function () {
		this.allowRC = false;
	}
}
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Manages tab navigation between basic string editors.
 */
xtiger.editor.TabGroupManager = function (rootNode) {
	this.root = rootNode;
	this.isChangingFocus = false;	  
	this.direction = 0;
}

xtiger.editor.TabGroupManager.prototype = {
	
	startEditingSession : function (editor) {
		if (this.isChangingFocus)	return; // guard
		this.tabs = [];		
		var treeWalker = xtiger.cross.makeTreeWalker (this.root, xtdom.NodeFilter.SHOW_ELEMENT,
				function (node) { 
						if (node.xttPrimitiveEditor && node.xttPrimitiveEditor.isFocusable()) {
							return xtdom.NodeFilter.FILTER_ACCEPT
						} else {
							return xtdom.NodeFilter.FILTER_SKIP; 
						}
				} );
		while(treeWalker.nextNode()) {
			// FIXME: how to avoid input nodes within unselected XttChoiceEditor control ?
			this.tabs.push(treeWalker.currentNode.xttPrimitiveEditor);		
		}		
		this.curEditor = editor;
	},

	stopEditingSession : function () {
		if (this.isChangingFocus)	return; // guard
		this.tabs = undefined;
		this.curEditor = undefined;
	},
	
	// Intercepts Tab KeyDown events
	// Returns true if it has intercepted it
	filterKeyDown : function (ev) {       
		this.direction = 0; // For firefox
		if (ev.keyCode == 9) { // it's a Tab
				if (xtiger.cross.UA.gecko)	{ // we must wait for KeyPress event because canceling will not work
					this.direction = ev.shiftKey ? -1 : 1;					
				} else { // we can act immediatly
					this._focusNextInput(ev.shiftKey ? -1 : 1);
				}               
				try {
					xtdom.preventDefault(ev);
					xtdom.stopPropagation(ev);
				} catch (e) {
  				// on IE !					
				}
				return true
		} else {
			return false;
		}
	},			
	
	// For some certain kinds of browsers filterKeyDown does not cancel the Tab event
	// in that case we get a chance to modify its effect in KeyPress event handling
	// This is the case with Firefox (v2 on OS X at least)
	filterKeyPress : function (ev) {
		if (xtiger.cross.UA.gecko && (this.direction != 0)) {
			// window.console.log('Focused next input');
			return (this._focusNextInput(this.direction));
		}
		return false;
	},	
	
	_focusNextInput : function (direction) {
		var res = false;
		if (!this.tabs)
			return; // safety guard
		for (var i = 0; i < this.tabs.length; i++) {
			if (this.tabs[i] == this.curEditor) {
				break;
			}
		}
		if (i < this.tabs.length) {
			var next;
			if ((i + direction) < 0) {
				next = this.tabs.length - 1;
			} else {
				next = (i + direction) % this.tabs.length;
			}
			this.isChangingFocus = true;  
			this.tabs[i].unfocus();       
			this.tabs[next].focus ();
			this.isChangingFocus = false;
			this.curEditor = this.tabs[next];
			res = true;
		}		     
		this.direction = 0;
		return res;
	}	
}	
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Jonathan Wafellman
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Model class for a String editor
 * Can be styled with a 'class' parameter in param XTiger attribute
 * Does not support filters use 'text' primitive editor instead
 */
xtiger.editor.StringModel = function () {
}

xtiger.editor.StringModel.prototype = {	
	
	// Returns the DOM node where the editor will be planted
	// This node must be the last one required to recreate the object from its seed
	// because seeding will occur as soon as this node is found
	createModel : function (container, useNode, curDoc) {
		var wrapper = useNode.getAttribute('wrapper');
		var viewNode = xtdom.createElement (curDoc, 'span');
		var content = xtdom.createTextNode(curDoc, ''); // will be set in editor constructor
		var inputNode = xtdom.createElement(curDoc, 'input');
		viewNode.appendChild (content);
		xtdom.addClassName (viewNode , 'axel-core-on');
		xtdom.addClassName (viewNode, 'axel-core-editable');
		xtdom.addClassName (inputNode, 'axel-core-off');
		var wrap = wrapper && ("embedded" != wrapper);
		if (wrap)  { // TO BE DEPRECATED !
			var tag = wrapper
			if ("auto" == wrapper) { // uses the types of the use as holder (must be a unique)
				tag = useNode.getAttribute('types');		
			}		
			var holder = xtdom.createElement (curDoc, tag);
			if ("auto" == wrapper) {
				xtdom.addClassName (holder, 'xtt-auto-wrapped'); // TODO replace with axel-auto-wrapped
			}
			holder.appendChild(viewNode);
			holder.appendChild(inputNode);
			container.appendChild(holder);
		} else {
			container.appendChild(viewNode);
			container.appendChild(inputNode);
		}	
		// manages optional editor
		var option = useNode.getAttribute('option');
		if (option) {
			var check = xtdom.createElement (curDoc, 'input');
			xtdom.setAttribute(check, 'type', 'checkbox');			       
			xtdom.addClassName(check, 'axel-option-checkbox');			       
			viewNode.parentNode.insertBefore(check, viewNode); 
		}
		return inputNode;
	},
	
	createEditorFromTree : function (handleNode, xtSrcNode, curDoc) {
		var data = xtdom.extractDefaultContentXT(xtSrcNode);           		
		if (data) {
			if (data.search(/\S/) == -1) { // empty string
				data = null;
			} else {
				// removes potential tags surrounding initial value (for wrapper="auto" mode)	
				var m = data.match(/^\s*\<.*\>(.*?)\<\/\w*\>\s*$/);
				if (m) {
					data = m[1];
				}
			}
		} 
		var param = xtSrcNode.getAttribute('param');
		var s = new xtiger.editor.String ();
		s.initFromTree (handleNode, curDoc, data, param, xtSrcNode.getAttribute('option') || false);
		return s;
	},
	
	createEditorFromSeed : function (seed, clone, curDoc) {
		var s = new xtiger.editor.String ();
		s.initFromSeed (seed, clone, curDoc);
		return s;		
	}		
}

/**
 * Manages primitive String editor.
 * It can receive default content from the <xt:use> node that created it
 * It can have parameters declared in an xt:param attribute 
 * These both data are transmitted through the seed to any clone of the String editor 
 */
xtiger.editor.String = function () {
	this.defaultContent = null;
	this.param = null;  
	this.isOptional = null; // 'set' or 'unset' if the editor is optional
	this.isSelected = false; // used iff this.isOptional is not null 
	this.doEdit = false;
	// this event handler is frequently subscribed/unsubscribed
	var _this = this;
	this.lostFocusHandler = function (ev) { _this.unfocus() };		
}

xtiger.editor.String.prototype = {  
	
	/////////////////////////////////
	// Input Device API part
	/////////////////////////////////
	
	isEditing : function () {
		return this.doEdit;
	},
	            
	// isMouseAction is true if the editing session starts from a mouse click
	// doSelectAll is true if the session should start with a pre-selection of all the text
	startEditing : function (isMouseAction, doSelectAll) {
		var l = this.editor.value.length;
		this.doEdit = true;
		this.keyboard.grab (this, this);		
		xtdom.setAttribute(this.editor, 'size', l + Number(this.param['lookahead']));
		xtdom.replaceClassNameBy (this.handle, 'axel-core-on', 'axel-core-off');
		xtdom.replaceClassNameBy (this.editor, 'axel-core-off', 'axel-core-on');
		if (doSelectAll || (this.editor.value == this.defaultContent)) {
			xtdom.focusAndSelect(this.editor);
		} else {
			xtdom.focusAndMoveCaretTo(this.editor, l);
		}
		xtdom.addEventListener (this.editor, 'blur', this.lostFocusHandler, true);		
	},	
	
	stopEditing : function (willEditAgain, value, isCancel) {
		this.doEdit = false;		
		var content = value || this.editor.value;		
		if (content.search(/\S/) == -1) { // empty
			content = this.defaultContent;
		}
		var isEdited = (content != this.defaultContent);
		this.setData (content);
		xtdom.replaceClassNameBy (this.handle, 'axel-core-off', 'axel-core-on');
		xtdom.replaceClassNameBy (this.editor, 'axel-core-on', 'axel-core-off');
		this.keyboard.release(this, this);							
		xtdom.removeEventListener(this.editor, 'blur', this.lostFocusHandler, true);
		if ((! isCancel) && isEdited) // do not auto-select if content set to default or cancel
		{
			if ((this.isOptional) && (! this.isSelected)) {
				this.setSelectionState (true); // FIXME: could be factorized with autoSelectRepeatIter below ?
			}
			xtiger.editor.Repeat.autoSelectRepeatIter (this.getHandle());
		}
		if (! isEdited) { // back to default content: unselects it if optional !
			this.setSelectionState (false);
		}		         
		if (xtiger.cross.UA.IE) {
			this.editor.blur(); // IE
		}
	},
	
	cancelEditing : function () {
		this.stopEditing(false, this.dump(), true);		
	},
	
	doKeyDown : function (ev) {			
		// nop
	},		
	
	doKeyUp : function (ev) {	
		// nop
	},		
	
	getHandle : function (ev) {
		return this.editor;	// in this context the handler is the input device
	},

	/////////////////////////////////
	// Pure Editor API part
	/////////////////////////////////
	
	// Returns a hash of attribute/value pairs from a string of the form "a=1;b=2..." 
	decodeParameters : function (res, params) {
		var tokens = params.split(';');
		for (var i=0; i<tokens.length; i++ ) {
			var p = tokens[i].split('=');
			if (p.length == 2) {
				res[p[0]] = p[1];
			}
		}
	},
	
 // handleNode is the node that represents the String
 // It is followed by the input field by construction
	initFromTree : function (handleNode, doc, userdata, parameters, option) {		
		this.param = {
			'lookahead' : 2
		}
		this.curDoc = doc;
		this.handle = handleNode.previousSibling;        
		this.editor = handleNode;
		this.defaultContent = userdata || 'click to edit';
		if (parameters) {	this.decodeParameters(this.param, parameters) }
		if (option) { // editor is optional
			this.isOptional = option.toLowerCase();
		}
		this.awake ();	
	},
	
	awake : function () {
		this.keyboard = xtiger.session(this.curDoc).load('keyboard');		
		var _this = this;		
		xtdom.addEventListener (this.handle, 'click', function (ev) { _this.handleClick(ev) }, true);	
		this.setData (this.defaultContent);
		this.editor.defaultValue = this.defaultContent;
		this.keyboard.register (this);
		if (this.isOptional) {       
			var check = this.handle.previousSibling;
			xtdom.addEventListener (check, 'click', function (ev) { _this.handleSelect(ev) }, true);	
			this.setSelectionState ('set' == this.isOptional);			
		}		
		// FIXME: we must call unregister too when destroying the editor
	},

	// The seed is a data structure that should allow to "reconstruct" a cloned editor
	makeSeed : function () {
		if (! this.seed) { // lazy creation
			var factory = xtiger.editor.Plugin.prototype.pluginEditors['string']; // see last line of file
			this.seed = [factory, this.defaultContent, this.param, this.isOptional];
		}
		return this.seed;
	},
			
	// clone is the clone of DOM node where the editor has been planted
	initFromSeed : function (seed, clone, doc) {		
		this.curDoc = doc;
		this.handle = clone.previousSibling;
		this.editor = clone;
		this.defaultContent = seed[1];
		this.param = seed[2];				           
		this.isOptional = seed[3];
		this.awake ();
	},  
	
	setSelectionState : function (isSel) {
		if (this.isOptional) {    
			var check = this.handle.previousSibling;
			this.isSelected = isSel;
			check.checked = isSel;  
			if (isSel) {
				xtdom.replaceClassNameBy (this.handle, 'axel-option-unset', 'axel-option-set');
			} else {
				xtdom.replaceClassNameBy (this.handle, 'axel-option-set', 'axel-option-unset');
			}
		}
	},
	
	load : function (point, dataSrc) {    
		if (point !== -1) {
			var value = dataSrc.getDataFor(point);
			this.setData(value);
			this.setSelectionState (true);
		} else {                 
			this.setData(this.defaultContent);			
			this.setSelectionState (false);
		}
	},   
	
	save : function (logger) {
		if ((! this.isOptional) || (this.isSelected)) {
			logger.write(this.dump());
		} else {   
			logger.discardNodeIfEmpty();
		}
	},
	        
	dump : function () {
		return this.handle.firstChild.data;
	},	
	
	setData : function (value) {
		// FIXME: could parameterize whether or not to normalize
		var norm = value ? value.replace(/\s+/g,' ') : 'click to edit';
		this.handle.firstChild.data = norm;
		this.editor.value = norm;		
		this.editor.size = norm.length;
	},    
	  
	// Checks if an editor can do a given action
	can : function (action) {
		return false;
	},

	// User clicked on the handle
	handleClick : function (ev) {       
		this.startEditing (true, ev.shiftKey);
	},

	// Optional editor and user clicked on the checkbox
	handleSelect : function (ev) {    
		this.isSelected = this.handle.previousSibling.checked; // saves new state
		if (this.isSelected) {
			xtdom.replaceClassNameBy (this.handle, 'axel-option-unset', 'axel-option-set');
			xtiger.editor.Repeat.autoSelectRepeatIter (this.getHandle()); // propagation
		} else {
			xtdom.replaceClassNameBy (this.handle, 'axel-option-set', 'axel-option-unset');
		}
	},
	
	isFocusable : function () {
		return true;
	},
            
	// User (or program) gave focus (e.g. tab group manager)
	focus : function () {
		this.startEditing(false, false);
	},
	
	// Removes focus from the editor
	unfocus : function () {
		this.stopEditing(false);		
	}
}

// Registers the atomic string editor
xtiger.editor.Plugin.prototype.pluginEditors['string'] = new xtiger.editor.StringModel();
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Basic XML loading algorithm exposed as a loadData function
 * Starts iterating on any XTiger XML DOM tree which must have been transformed first 
 * Feed the tree with XML data stored in a DOMDataSource
 * You can share this class as it doesn't maintain state information between loadData calls
 */
xtiger.editor.BasicLoader = function () {
}

xtiger.editor.BasicLoader.prototype = {

	// walks through the tree and renders model data as it encounters it
	loadData : function (n, dataSrc) {
		var curSrc = dataSrc.getRootVector ();
		var stack = [ curSrc ];
		this.loadDataIter (n, dataSrc, stack);
	},

	// checks that all the repeated items have been consumed on the stack at the point
	hasDataFor : function (repeater, point, dataSrc) {
		var doMore = false;
		if (repeater.hasLabel()) { // in that case repeater Tag was popped out
			doMore = (0 != dataSrc.lengthFor(point));
		} else {
			doMore = dataSrc.hasDataFor(repeater.getRepeatableLabel(), point);
			// window.console.log('Checked (%s) anonymous repeat with pseudo label %s', doMore, repeater.getRepeatableLabel());
		}
		return doMore;
	},
				
	makeRepeatState : function (repeater, size, useStack, useReminder) {
		return [repeater, size, useStack, useReminder];		
	},
		
	loadDataSlice : function (begin, end, dataSrc, stack, point, origin, repeatedRepeater) {
		var repeats = []; // stack to track repeats
		var cur = begin;
		var go = true;
		var next; // anticipation (in case repeatExtraData is called while iterating as it insert siblings)
		while (cur && go) {			
			if (cur.startRepeatedItem && (cur.startRepeatedItem != repeatedRepeater)) {
				if ((repeats.length == 0) || ((repeats[repeats.length - 1][0]) != cur.startRepeatedItem)) { // new repeat					
					var state;
					// cur.startRepeatedItem.reset(); // resets repeat (no data) => cannot alter it while iterating !
					if (cur.startRepeatedItem.hasLabel()) {
						var nextPoint = dataSrc.getVectorFor (cur.startRepeatedItem.dump(), point);
						if ((nextPoint instanceof Array) && (dataSrc.lengthFor(nextPoint) > 0)) { // XML data available
							stack.push(nextPoint); // one level deeper
							point = nextPoint;
							state = this.makeRepeatState(cur.startRepeatedItem, cur.startRepeatedItem.getSize(), true, true);
						}	else { // No XML data available
							cur = cur.startRepeatedItem.getLastNodeForSlice(cur.startRepeatedItem.getSize()); // skips repeat
							cur = cur.nextSibling; // in case cur has children, no need to traverse them as no slice is selected
							continue
						}
					} else { 
						if (this.hasDataFor(cur.startRepeatedItem, point, dataSrc)) { //  XML data available
							state = this.makeRepeatState(cur.startRepeatedItem, cur.startRepeatedItem.getSize(), false, true);
						} else {                                         
							cur = cur.startRepeatedItem.getLastNodeForSlice(cur.startRepeatedItem.getSize()); // skips repeat
							cur = cur.nextSibling;  // in case cur has children, no need to traverse them as no slice is selected
							continue
						}  
					}
					repeats.push(state);
				}
			}
			
			// restricts iterations on the current chosen item (if it is in the point)
			if (cur.beginChoiceItem && (cur.beginChoiceItem != origin)) {
				var c = cur.beginChoiceItem;
				point = dataSrc.getVectorForAnyOf (c.getTypes(), point);	
				if (point instanceof Array) { // implies (point != -1)
					stack.push(point); // one level deeper
					var curItem = c.selectChoiceForName (dataSrc.nameFor(point));
					if (c.items[curItem][0] != c.items[curItem][1]) {
						this.loadDataSlice(c.items[curItem][0], c.items[curItem][1], dataSrc, stack, point, c); // [SLICE ENTRY]
						cur = c.items[c.items.length - 1][1]; // jumps to the last Choice item end boundary
						// in case it closes a label containing the choice, closes it 
						if ((cur.xttCloseLabel && (! cur.xttOpenLabel)) && (curItem != (c.items.length - 1))) {
							// this.loadDataIter (cur, dataSrc, stack); // the last Choice element may close a label
							stack.pop ();
							point = stack[stack.length -1]; 
						}	                           							
					} else {					
						// a choice slice starts and end on the same node
						this.loadDataIter(c.items[curItem][0], dataSrc, stack);  // [SLICE ENTRY]
						stack.pop(); // restores the stack and the point  [SLICE EXIT]
						point = stack[stack.length -1];					
						cur = c.items[c.items.length - 1][1]; // jumps to the last Choice item end boundary						
					}
				} // otherwise do not change Choice content (no data)
			} else {
				// FIXME: see serializeDataIter
				this.loadDataIter (cur, dataSrc, stack); // FIXME: first interpretation
				point = stack[stack.length -1];
				if (origin) {  // checks if iterating on the current slice of a choice
					if (cur == origin.items[origin.curItem][1]) { // checks that the end of the slice/choice has been reached						
						stack.pop(); // restores the stack and the point
						point = stack[stack.length -1];					
						return;  // [SLICE EXIT] ~ internal repeats are closed by callee (because repeat is handled 1st)
										 // there may also be a label associated with the last Choice element that will be closed by callee
					}					
				}
				// FIXME: second interpretation
				// this.loadDataIter (cur, dataSrc, stack);
				// point = stack[stack.length -1]; // recovers the point as loadDataIter may change the position in the stack
			}				
			if (cur == end) {
				go = false;
			}								
			next = cur.nextSibling;
			
			// checks repeat section closing i.e. the last item has been traversed
			if (cur.endRepeatedItem && (cur.endRepeatedItem != repeatedRepeater)) { 
				var state = repeats[repeats.length - 1]; // current repeat state
				if (true || (cur.endRepeatedItem == state[0])) {   // true: at the moment always 1 repeat end by node					
					--(state[1]);  
					if (state[1] < 0) { // optional repeater (total = 0) was set during this iteration 
						if (cur.endRepeatedItem.getSize() == 0) {
							cur.endRepeatedItem.sliceLoaded();
						}
						// otherwise it has been configured/activated through autoSelectRepeatIter call
						// from a service filter set to askUpdate on load
					}
					if (state[1] <= 0) { // all the items have been repeated (worth if min > 1)
						if (state[3] && this.hasDataFor(cur.endRepeatedItem, point, dataSrc)) { // did we exhaust the data source ?
							var repeater = cur.endRepeatedItem;
							while (this.hasDataFor(repeater, point, dataSrc)) {
								xtiger.cross.log('stack-trace', '>>[ extra ]>> start repetition for', repeater.dump());		
								var tmpStack = [point]; // simulates stack for handling the repeated repeat
								var pos = repeater.appendSlice();
								var begin = repeater.getFirstNodeForSlice(pos);
								var end = repeater.getLastNodeForSlice(pos);
								this.loadDataSlice (begin, end, dataSrc, tmpStack, point, undefined, repeater);		
								repeater.sliceLoaded(); // 1 slice of extra data added to repeater during this iteration	 
						 	}
						}
						if (state[2]) {
							stack.pop(); // restores the stack and the point
							point = stack[stack.length -1];
						}
						repeats.pop();		
					}
				}
			}
			cur = next;
		}		
	},
		
	// Manages xttOpenLabel, xttCloseLabel and atomic primitive editors
	// Recursively call loadDataSlice on the children of the node n	
	loadDataIter : function (n, dataSrc, stack) {
		var curFlow, curLabel;
		var point = stack[ stack.length - 1 ];
		if (n.xttOpenLabel) {     
			curLabel = n.xttOpenLabel;
			if (curLabel.charAt(0) == '!') { // double coding "!flow!label" to open a separate flow
				var m = curLabel.match(/^!(.*?)!(.*)$/); // FIXME: use substr...
				curFlow = m[1];
				curLabel = m[2];
				// window.console.log('Open Flow ' + curFlow + ' at point ' +  dataSrc.nameFor(point));
				point = dataSrc.openFlow(curFlow, point, curLabel) || point; // changes the point to the separate flow
				// FIXME: what to do if no flow, theoritically it is possible to ignore it 
				// then we should also ignore it in closeFlow (that means data aggregation was done server side)
			}
			var attr = false;
			// moves inside data source tree
			if (curLabel.charAt(0) == '@') {          
				point = dataSrc.getAttributeFor(curLabel.substr(1, curLabel.length - 1), point);
				attr = true;
			} else {
				point = dataSrc.getVectorFor(curLabel, point);
			}
			if (attr || ((point instanceof Array) && (dataSrc.lengthFor(point) > 0))) {
				stack.push(point); // one level deeper
			} else {
				// FIXME: handle optional element it (make them turned off)
				point = -1; // -1 for "End of Source Data" (xttCloseLabel should be on a sibling)
				stack.push(point);				
			}
		}
		if (n.xttPrimitiveEditor) {
			n.xttPrimitiveEditor.load (point, dataSrc);
			point = -1; // to prevent iteration on children of n below as n should be atomic
		}
		if (n.firstChild) {
				// FIXME: iterates on child even if point -1 to be robust to incomplete XML (not sure this is exactly required)
				this.loadDataSlice (n.firstChild, n.lastChild, dataSrc, stack, point);
		}
		if (n.xttCloseLabel) { 
			curLabel = n.xttCloseLabel;
			if (curLabel.charAt(0) == '!') { // double coding "!flow!label" to open a separate flow
				var m = curLabel.match(/^!(.*?)!(.*)$/); // FIXME: use substr...
				curFlow = m[1];
				curLabel = m[2];
				dataSrc.closeFlow(curFlow, point); // restores point to the previous flow (or top)
			}
			stack.pop ();
		}
	}		
}

// Registers as default XML loader (file must be included after generator.js)
xtiger.editor.Generator.prototype.defaultLoader = new xtiger.editor.BasicLoader ();
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Basic XML serialization algorithm exposed as a serializeData function
 * Starts iterating on any XTiger XML DOM tree which must have been transformed first 
 * Serializes data while iterating to a DOMLogger instance
 * You can share this class as it doesn't maintain state information between serializeData calls
 */
xtiger.editor.BasicSerializer = function (baseUrl) {
}

xtiger.editor.BasicSerializer.prototype = {

	// Walks through the tree starting at n and renders model data as it encounters it
	// Accepts an optional rootTagName for the document, uses 'document' by default
	serializeData : function (n, logger, rootTagName) {
		logger.openTag(rootTagName || 'document');
		this.serializeDataIter (n, logger);
		logger.closeTag(rootTagName || 'document');	
	},
	
	// Manage the Choice current slice
	// origin is optional, it is the Choice editor from where a recursive call has been initiated
	serializeDataSlice : function (begin, end, logger, origin) {
		var repeats = []; // stack to track repeats		
		var cur = begin;
		var go = true;
		while (cur && go) {
			// manage repeats
			if (cur.startRepeatedItem) {
				if ((repeats.length == 0) || ((repeats[repeats.length - 1][0]) != cur.startRepeatedItem)) {
					// repeats.push ([cur.startRepeatedItem, cur.startRepeatedItem.getSize()]); // AAA
					if (cur.startRepeatedItem.getSize() == 0) { // nothing to serialize in repeater (min=0)   
						// jumps to end of the repeater
						cur = cur.startRepeatedItem.getLastNodeForSlice(0);						
						// in case cur has children, no need to serialize them as the slice is unselected (found on IE8)
						cur = cur.nextSibling;
						continue;							
					} else if (cur.startRepeatedItem.hasLabel()) {
							logger.openTag (cur.startRepeatedItem.dump());
					}  
					repeats.push ([cur.startRepeatedItem, cur.startRepeatedItem.getSize()]); // AAA					
				} 				
			}			
			if (cur.beginChoiceItem && (cur.beginChoiceItem != origin)) {
				var c = cur.beginChoiceItem;
				logger.openTag(c.getSelectedChoiceName()); // [OPEN -A- ]
				if (c.items[c.curItem][0] != c.items[c.curItem][1]) {
					this.serializeDataSlice(c.items[c.curItem][0], c.items[c.curItem][1], logger, c);				
				} else {
					// a choice slice starts and end on the same node
					this.serializeDataIter(c.items[c.curItem][0], logger);				
					// closes the choice
					logger.closeTag(c.getSelectedChoiceName()); // [CLOSE -A- ]									
				}
				cur = c.items[c.items.length - 1][1]; // sets cur to the last choice				
				// the last node of the Choice (if it was not active) may coincide with an xttCloseLabel
				// closes it as serializeDataIter will not be called on that node
				if (cur.xttCloseLabel && (c.curItem != (c.items.length - 1))) {
					logger.closeTag(cur.xttCloseLabel);
				}	                           		
			} else {
				// FIXME: we have an ambiguity <xt:use types="a b"><xt:use label="within_a"...
				// and <xt:use label="within_a"><xt:use types ="a b"....
				/// The current implementation will privilege First interpretation
				this.serializeDataIter (cur, logger);				// FIXME:  first interpretation
				if (origin) {  // we are iterating on the current slice of a choice 
					if (cur == origin.items[origin.curItem][1]) {
						// closes tag for the current choice (we must do it before serializeDataIter in case it closes a outer use)
						logger.closeTag(origin.getSelectedChoiceName()); // [CLOSE -A- ]									
					}					
				}
				// this.serializeDataIter (cur, logger);   // FIXME: second interpretation
			}			
			if (cur.endRepeatedItem) {
				if (true || (cur.endRepeatedItem == repeats[repeats.length - 1][0])) {
					--(repeats[repeats.length - 1][1]);
					if (repeats[repeats.length - 1][1] <= 0) { 
						if ((cur.endRepeatedItem.getSize() != 0) && (cur.endRepeatedItem.hasLabel())) {						
							logger.closeTag(cur.endRepeatedItem.dump());
						}
						repeats.pop();
					}
				}
			}			
			if (cur == end) {
				go = false;
			}
			cur = cur.nextSibling;
		}		
	},
	
	serializeDataIter : function (n, logger) { 
		var curFlow, curLabel;		   
		if (n.xttOpenLabel) {            
			curLabel = n.xttOpenLabel;
			if (curLabel.charAt(0) == '!') { // double coding "!flow!label" to open a separate flow
				var m = curLabel.match(/^!(.*?)!(.*)$/); // FIXME: use substr...
				curFlow = m[1];
				curLabel = m[2];
				logger.openFlow(curFlow, curLabel);
			}
			if (curLabel.charAt(0) == '@') {
				logger.openAttribute(curLabel.substr(1, curLabel.length - 1));				
			} else {
				logger.openTag(curLabel);
			}
		}
		if (n.xttPrimitiveEditor) {			
			// logger.write(n.xttPrimitiveEditor.dump());         
			n.xttPrimitiveEditor.save(logger);
		}		 
		// FIXME: do not need to call next line if xttPrimitiveEditor ?
		if (n.firstChild) {
			this.serializeDataSlice(n.firstChild, n.lastChild, logger);		
		}
		if (n.xttCloseLabel) {         
			curFlow = false;
			curLabel = n.xttCloseLabel;
			if (curLabel.charAt(0) == '!') { // double coding "!flow!label" to open a separate flow
				var m = curLabel.match(/^!(.*?)!(.*)$/); // FIXME: use substr...
				curFlow = m[1];
				curLabel = m[2];
		  }
			if (curLabel.charAt(0) == '@') {
				logger.closeAttribute(curLabel.substr(1, curLabel.length - 1));				
			} else {
				logger.closeTag(curLabel);
			}
			// now closes separate flow if necessary
			if (curFlow) {
				logger.closeFlow(curFlow);
			}
		}			                           		
	}
}

// Registers as default XML serializer (file must be included after generator.js)
xtiger.editor.Generator.prototype.defaultSerializer = new xtiger.editor.BasicSerializer ();

/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*      
 * TextDevice is a controller class that manages interactions between an XTiger primitive editor, 
 * an input field wrapper (a class that wraps a DOM <input> or <textarea> used for input) and 
 * the keyboard manager for the application.
 * You need to instantiate only one TextDevice per type of primitive editor per document
 * 
 * @input is the wrapper of the HTML input field, which is either an <input> or a <textarea> element
 * @kbd is the keyboard manager
 * @doc is the document for which the TextDevice is instantiated   
 *                             
 * TODO
 * - find a way to put the cursor at the end of a textarea device (like input)
 */         
             
(function () {    

  /**
   * Private class that wraps a <div> element to be used with an edit field (textarea or input), 
   * in order to compute the text metrics for a given text extract and apply (some) of them 
   * to the edit field.The input field must grab / release the instance before making any computation 
   * so that the <div> element used for computation is inserted into the DOM to inherit the style attributes
   * before computing text metrics. The computation works only if the CSS attributes of the div 
   * (with a axel-text-shadowbuffer class) are set to inherit (cf. axel.css).
   *  
   * @class _TextMetrics
   */
  var _TextMetrics = function _TextMetrics (doc) {     
  	// _TextMetrics Constructor code
  	this.div = xtdom.createElement (doc, 'div');
  	xtdom.addClassName(this.div, 'axel-text-shadowbuffer');
  	this.divText = xtdom.createTextNode(doc, '');
  	this.div.appendChild (this.divText);       
  }
  
  _TextMetrics.prototype = {
    
  	// Sets initial bounding box constraints of the shadow <div> and on the handle
  	setBBox : function setBBox (w, h, handle, shape, type) {
  		var wpx = w + 'px';
  		var hpx = h + 'px'; 
  		this.lastWidth = w;
  		this.lastHeight = h;

  		// 1. initializes shadow div 
  		if ((type == 'input') || (shape == 'self')) { // surface will grow horizontaly
  			this.div.style.width = ''; 
  			this.div.style.height = '';
  		} else { // surface will grow vertically
  			this.div.style.width = wpx; // blocks width to that value
  			this.div.style.height = 'auto'; 
  				// text will overflow verticaly once filled
  				// 'auto' is required for FF and Opera
  		}

  		// 2. initializes text entry field
  		handle.style.width = wpx;
  		handle.style.height = hpx;
  	},

  	// Sets text content for which to compute metrics
  	setText : function setText (text) {    
  		this.divText.data = text + 'm';
  		// FIXME: try with replaceData and appenData of CharacterData ?
  	},

  	// sets the width of the handle to the width of the shadow <div>
  	adjustWidth : function adjustWidth (handle) {     
  		var w = Math.max(this.div.offsetWidth, this.div.clientWidth, this.div.scrollWidth); 		
  		if (w > this.lastWidth) {
  			handle.style.width = w - (w % 20)  + 20 + 'px';  // FIXME: +20 too empirical ?
  			this.lastWidth = w;
  		}
  	},

  	// sets the height of the handle to the height of the shadow <div>
  	adjustHeight : function adjustHeight (handle, init) {    
  		var h = Math.max(this.div.offsetHeight, this.div.clientHeight, this.div.scrollHeight);
  		if (h > this.lastHeight) {
  			handle.style.height = h + "px";
  			this.lastHeight = h;
  		}		 
  	},

  	grab : function grab (field) {     
  		field.hook.appendChild(this.div);
  	},

  	release : function (field, willEditAgain) {   
  		field.hook.removeChild(this.div);
  	}    
  };
  
  
  //////////////////////////////////////////////////////////
  //                   TextDevice                        ///
  //////////////////////////////////////////////////////////
  
  xtiger.editor.TextDevice = function (input, kbd, doc) {
  	this.keyboard = kbd;
  	this.field = input; // managed input field wrapper  
  	// assigns unique object per-document for text metrics computations
  	this.metrics = xtiger.session(doc).load('metrics');
  	if (! this.metrics) {  
  		this.metrics = new _TextMetrics (doc);
  		xtiger.session(doc).save('metrics', this.metrics);
  	}
  	this.currentEditor = null;
  	var _this = this; // event callback to subscribe / unscribe later
  	this.blurHandler = function (ev) { _this.handleBlur(ev); };	
  }; 

  xtiger.editor.TextDevice.prototype = {

  	// Returns the DOM input field managed by the device (should be a <textarea> or an <input>)
  	getHandle : function () {
  		return this.field.getHandle();
  	},	 
	
  	// Returns true if the text is actually editing data (hence its DOM input field is visible)
  	isEditing : function () {
  		return (null != this.currentEditor);
  	},	   
	    
  	// Returns the cursor offset inside the entry field or -1 if it fails
  	_computeOffset : function (mouseEvent, editor) {  
  		var offset = -1;
  		var selObj, selRange;
  		// the following code used to work at least on Firefox
  		// but for now the getRangeAt(0) throws an exception because there are no range defined for a click !
  		if (mouseEvent && window.getSelection &&          
  		      (editor.getParam('clickthrough') == 'true')) {
        selObj = window.getSelection();  
        if (selObj && (selObj.rangeCount > 0)) {     
        	selRange = selObj.getRangeAt(0);
        	if (selRange) {
        		offset = selRange.startOffset;     
        	}
        }
  		}
  		return offset;
  	},
	
  	////////////////////////////////
  	// Core methods
  	////////////////////////////////	  
	
  	startEditing : function (editor, mouseEvent, doSelectAll) {  
  	  var ghost, // node to use for geometry computation when shape="parent"
  		    offset; // initial cursor position (-1 means at the end)
      var constw, consth;
      var shape;
      var redux = false;
  		var handle = this.field.getHandle();
  		var coldStart = false;
		
  		if (this.currentEditor) { 
  			// another editing was in progress with the same device
  			// this is unlikely to happen as when directly clicking another field will trigger unfocus first
  			 this.stopEditing (true);  			
  		} else {
  			// registers to keyboard events
  			this._kbdHandlers = this.keyboard.register(this);
  			this.keyboard.grab(this, editor);
  			// transfers class attribute
  			if (editor.getParam('hasClass')) {
  				xtdom.addClassName(handle, editor.getParam('hasClass'));
  			}
  			// saves cursor offset (where the user has clicked)
  			if (!doSelectAll) { 
          offset = this._computeOffset(mouseEvent, editor);
  			}
  			coldStart = true;			
  			this.field.show (editor);  
  		}		
		
  		this.currentEditor = editor;     
  		ghost = editor.getGhost();
		
  		// computes current geometry of the editor to apply it to the buffer later on
  		constw = Math.max(ghost.offsetWidth, ghost.clientWidth, ghost.scrollWidth);
  		consth = Math.max(ghost.offsetHeight, ghost.clientHeight, ghost.scrollHeight);
  		// installs the input field which may change the DOM and break editor.getGhost()
  		this.field.grab (editor);  
      this.metrics.grab(this.field); // to get same CSS properties
    
  		if (editor.getParam('enablelinebreak') == 'true') {
  			this.keyboard.enableRC();
  		}  

  		// cursor positioning and initial text selection
			if (doSelectAll) {
				xtdom.focusAndSelect(handle);
			} else if (offset) {        
				xtdom.focusAndMoveCaretTo(handle,
					(offset == -1) ? handle.value.length : offset);
			}

  		shape = this.currentEditor.getParam('shape');
  		if (shape.charAt(shape.length - 1) == 'x') { // a bit tricky: shape=parent-XXXpx
  			var m = shape.match(/\d+/);
  			if (m) {
  				constw = constw - parseInt(m[0]);
  				redux = true;
  			}
  		}       
		              
  		// applies initial geometry to the input field handle		                                                           
  		this.metrics.setBBox (constw, consth, handle, shape, this.field.deviceType); 
  		this.metrics.setText(this.field.getValue());      
  		if ((this.field.deviceType == 'input') || (shape == 'self')) { // 'auto' may give a too large field
  			this.metrics.adjustWidth(handle);
  		}                
  		if (redux) { // need to adjust height as width was reduced
  			this.metrics.adjustHeight(handle);
  		}
  		if (coldStart) {
  			// must be called at the end as on FF 'blur' is triggered when grabbing
  			xtdom.addEventListener(handle, 'blur', this.blurHandler, false);
  		}
  	},	
	
  	/**
  	 * Stops the edition process on the current model
  	 * 
  	 * @param willEditAgain
  	 * @param isCancel
  	 */
   	stopEditing : function (willEditAgain, isCancel) {
  		if (! this.currentEditor)
  			return;
   		if (! this.stopInProgress) {  
   			// FIXME: guarded because in some cases (for instance if printing an alert for debugging)
   			// stopEditing maybe called twice as the blurHandler is triggered even if removed in 1st call
   			this.stopInProgress = true; 
   			var model = this.currentEditor; // simple alias                              
   			this.currentEditor = null;   			
   			this.field.release(model, willEditAgain); // releases the input field wrapper
   			this.metrics.release(this.field);
   			if (! isCancel) {
   				model.update(this.field.getValue()); // updates model with new value
   			}
   			if (! willEditAgain) {	// uninstalls text device 		        
   				if (model.getParam('enablelinebreak') == 'true') {
   					this.keyboard.disableRC();
   				}                                                 
   				// FIXME: uncomment these lines if the 'release' extension is used from filters ?
  		        // if (model.can('release')) { // gives a chance to the filter to restore keybord behavior
  		        //   model.execute('release', [this.keyboard, this]);
  		        // }
   				this.keyboard.unregister(this, this._kbdHandlers);
   				this.keyboard.release(this, model);						
   				xtdom.removeEventListener(this.getHandle(), 'blur', this.blurHandler, false);
   				if (model.getParam('hasClass')) {
   					xtdom.removeClassName(this.getHandle(), model.getParam('hasClass'));
   				}
   			}
        // this.field.release(model, willEditAgain); // releases the input field wrapper
        // this.currentEditor = null;
   			this.stopInProgress = false;
   	 	}
   	},
	
  	getCurrentModel: function () {
  		return this.currentEditor;
  	},
	
  	cancelEditing : function () {
  		this.stopEditing(false, true);
  	},
	
  	handleBlur : function (ev) {    
  		this.stopEditing (false);
  	},	
	
  	doKeyDown : function (ev) {	
  		if (this.currentEditor && (this.currentEditor.getParam('expansion') == 'grow')) {
  			this.curLength = this.field.getValue().length; // to detect paste in doKeyUp
  			this.adjustShape ();                    
  		}                
  	},		
	
  	doKeyUp : function (ev) {	
  		if (this.currentEditor && this.currentEditor.can('onkeyup')) {
  			this.currentEditor.execute('onkeyup', this.field.getHandle());
  		}
  		if (this.currentEditor && (this.currentEditor.getParam('expansion') == 'grow')) {			
  			if (this.field.getValue().length > (this.curLength + 1)) { // paste detection
  				this.adjustShape();
  				// => ca ne marche pas, comment déclencher un refresh de l'affichage ?
  			}
  		}		
  	},  
		
  	adjustShape : function () {		              
  		this.metrics.setText(this.field.getValue());
  		var h = this.field.getHandle();
  		this.metrics.adjustWidth(h);
  		if (this.field.deviceType == 'textarea') {
  			this.metrics.adjustHeight(h);
  		} 
  	}
  };                
                      
  //////////////////////////////////////////////////////////
  //                   Floating Field                    ///
  //////////////////////////////////////////////////////////
         
/**
 * FloatingField is a wrapper for an HTML element used for text input that can be shared 
 * between all the XTiger editors of a given document. This input field will "float"
 * on top of the primitive editor when the user activates editing mode.
 * You need to instantiate only one FloatingField of each kind for each document
 *
 * @kind is the type of HTML element used for input ('textarea' or 'input')          
 */
xtiger.editor.FloatingField = function (kind, doc) {
	this.deviceType = kind;          
	this.handle = this.createHandleForDoc (kind, doc);
	this.hook = xtdom.createElement (doc, 'div');
	xtdom.addClassName(this.hook, 'axel-text-container');	
	this.hook.appendChild(this.handle);  
	this.hook.style.display = 'none';
};
          
xtiger.editor.FloatingField.prototype = {

	// Creates an HTML input field to be controlled by a device
	createHandleForDoc : function (kind, doc) {   
		var device = xtiger.session(doc).load('ff_' + kind);
		if (! device) {
			// creates the shared <input> or <textare> DOM node for editing
      // var body = doc.getElementsByTagName('body')[0]; // FIXME: body or BODY ? (use a hook for insertion ?)
			device = xtdom.createElement (doc, kind);
			xtdom.addClassName(device, 'axel-text-float');
      // body.appendChild (device);
			xtiger.session(doc).save('ff_' + kind, device);
		}
		return device;
	},	
	
	// Returns the DOM element used for editing (basically a <textarea> or <input>)
	getHandle : function () {
		return this.handle;
	},	         

	getValue : function () {
		return this.handle.value;
	},

	show : function () {
		this.hook.style.display = 'inline';	    
	},           
            
  // Inserts as first child into the handle a hook which is an inline div container 
  // styled as a relative positioned element that contains an input or textarea 
  // edit field positioned as absolute    
  // FIXME: hides the handle during editing
	grab : function (editor) {     
		this.handle.value = editor.getData();
		this.editorHandle = editor.getHandle();
		this.editorHandle.parentNode.insertBefore (this.hook, this.editorHandle);	
		  // FIXME: before and not inside 1st child, not all styling will reach it (e.g. <pre>)
    editor.getHandle().style.visibility = 'hidden';
    // DEPRECATED: var ghost = editor.getGhost(); // moves the handle at the ghost position    
    // this.setPosition (ghost); 
	},

  // Removes the first child that was inserted inside the handle 
  // Restore the visibility of the handle
	release : function (editor, willEditAgain) {   
    this.editorHandle.parentNode.removeChild(this.hook);
    editor.getHandle().style.visibility = 'visible';
		if (! willEditAgain) {
			this.hook.style.display = 'none';
		}                
	},
	
	setPosition : function (ghost) {	
	  var pos = xtdom.findPos(ghost);
	  with (this.handle.style) {
	      left = pos[0] + 'px';
	      top = pos[1] + 'px';
	  }      
	}
	                            	
};

//////////////////////////////////////////////////////////
//                Placed Field                         ///
//////////////////////////////////////////////////////////

xtiger.editor.PlacedField = function (kind, doc) {
 	this.myDoc = doc;
	this.deviceType = kind;          
	this.handle = this.createHandleForDoc (kind, doc);
	this.handle.style.display = 'none';  
	this.cache = {};
	this.hook;
};

xtiger.editor.PlacedField.prototype = {
	
	// Static method that creates the HTML input field (the handle)
	// FIXME: where to insert the editor into the target documentation + 'body' or 'BODY' ?
	createHandleForDoc : function (kind, doc) {   
		var device = xtiger.session(doc).load('pf_' + kind);
		if (! device) {
			// creates the shared <input> or <textarea> DOM node for editing
			device = xtdom.createElement (doc, kind);
      xtdom.addClassName(device, 'axel-text-placed');
			xtiger.session(doc).save('pf_' + kind, device);
		}				   
		return device;
	},
	
	// Returns the DOM element used for editing (basically a <textarea> or <input>)
	getHandle : function () {
		return this.handle;
	},	         

	getValue : function () {
		return this.handle.value;
	},

	show : function (editor) {             
		this.handle.style.display = 'inline';	   
	},           
        
  // Replaces the handle with a hook that has the same root element as the handle
  // and that contains an input or textarea edit field
	grab : function (editor) {     
	  var _htag;
		this.handle.value	= editor.getData();
		this.editorHandle = editor.getHandle();
		_htag = xtdom.getLocalName(this.editorHandle); 
		if (! this.cache[_htag]) {
		  this.hook = xtdom.createElement(this.myDoc, _htag);
		  this.cache[_htag] = this.hook;
		} else {
		  this.hook = this.cache[_htag];
		}
		var parent = this.editorHandle.parentNode;  
		if (this.hook.firstChild != this.handle) {
		  this.hook.appendChild(this.handle);
		}
		parent.insertBefore (this.hook, this.editorHandle, true);
		parent.removeChild(this.editorHandle);   
	},
          
  // Restores the handle that was replaced in release
	release : function (editor, willEditAgain) {   
		var parent = this.hook.parentNode;      
		parent.insertBefore (this.editorHandle, this.hook, true);
		parent.removeChild(this.hook);
		if (! willEditAgain) {
			this.handle.style.display = 'none';
		}       	
	}
};           

/* Manages dynamic creation of TextDevice with different parameters
 * There is one TextDeviceFactory per application
 */
xtiger.editor.TextDeviceFactory = function () {
	this.devKey = 'TextDeviceCache';
	//this.filters = {}; // filter constructors
}	

xtiger.editor.TextDeviceFactory.prototype = {  
	
	// Gets or create cache to store devices on a per-document basis
	_getCache : function (doc) {
		var cache = xtiger.session(doc).load(this.devKey);
		if (! cache) {
			cache = {'input' : { 'float' : null, 'placed' : null},
			         'textarea' : { 'float' : null, 'placed' : null},
					 'filtered' : {} // instantiated filtered devices per-document
					};
			xtiger.session(doc).save(this.devKey, cache);
		}
		return cache;
	},
	
	// filter is an optional filter name (which must have been registered with registerFilter)
	getInstance : function (doc, type, layout) {
		// Parameters sanitization			
		var t = type || 'input';
		if ((t != 'input') && (t != 'textarea')) {
			xtiger.cross.log('error', "AXEL error : unkown text device type '" + t + "' requested !");
			t = 'input';
		}
		var l = layout || 'placed';
		if ((l != 'float') && (l != 'placed')) {
			xtiger.cross.log('error', "AXEL error : unkown text device layout '" + l + "' requested !");
			l = 'float';
		}			
		// Get or create device corresponding to parameters
		var cache = this._getCache(doc);
		var fConstructor;
		var device = cache[t][l];
		if (! device) {
      var wrapper = (l == 'float') ? new xtiger.editor.FloatingField (t, doc) : new xtiger.editor.PlacedField (t, doc);
			device =  new xtiger.editor.TextDevice (wrapper, xtiger.session(doc).load('keyboard'), doc);	
			if (fConstructor) {
				device.addFilter( fConstructor(doc) ); // create and add filter (1 filter per device type per document)
			}
			cache[t][l] = device; // stores device for reuse in same document
		}
		return device;
	}
}	

xtiger.registry.registerFactory('text-device', new xtiger.editor.TextDeviceFactory());           

})();
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/**    
 * PopupDevice displays a popup menu.     
 * You should create only one device per-document which can be shared between multiple editor's
 */
xtiger.editor.PopupDevice = function (aDocument) {
	
	/**
	 * The document containing *this* device
	 */
	this._document = aDocument;
	
	/**
	 * The device's edition handle
	 */
	this._menu = xtiger.session(aDocument).load('popupmenu'); // shared on a per-document basis
	if (!this._menu) {
		this._menu = new xtiger.editor.PopupMenu(aDocument);
		xtiger.session(aDocument).save('popupmenu', this._menu);
	}
	
	/**
	 * A reference to the keyboard device
	 */
	this._keyboard = xtiger.session(aDocument).load('keyboard');
	
	/**
	 * The currently edited model
	 */
	this._currentModel = null;
	
	/**
	 * The handlers for keyboard events
	 */
	this._keyboardHandlers = null;
	
	/**
	 * The current selection
	 */
	this._currentSelection = null;
	
	// event callback to subscribe / unscribe later
	var _this = this; 
	this.clickHandler = function(ev) {
		_this.handleClick(ev);
	};
}

xtiger.editor.PopupDevice.prototype = {   
	
	MAX_HEIGHT : 150, // FIXME: should become a popup_max_heigth parameter
	
	/**
	 * Displays the popup menu below the editor's handle
	 * Available choices are listed in choices with the current one in curSel
	 * 
	 * @param aModel
	 * @param aChoices
	 * @param aSelection
	 * @param aHandle
	 */
	startEditing : function(aModel, aChoices, aSelection, aHandle) {
		var coldStart = true;
		var popupDiv = this._menu.getHandle();
		
		if (this._currentModel != null) {
			// another editing was in progress with the same device
			this.stopEditing(true);
			coldStart = false;
		}     
		
		// Resets Width/Height constraints that will be adjusted after display                                
		popupDiv.style.width = '';
        popupDiv.style.maxHeight = this.MAX_HEIGHT + 'px'; // will be adjusted later
        
		this._menu.setOptions(aChoices, aSelection);
		this._menu.setPosition(aHandle);
		if (coldStart) {
			this._menu.show();
			xtdom.addEventListener(this._document, 'mousedown',
					this.clickHandler, true); // to detect click or lost of focus
			
			// registers to keyboard events
			this._keyboardHandlers = this._keyboard.register(this, this._document);
		}
		this._currentModel = aModel;
		this._currentSelection = null; 
		
		// Width/Height adjustments
		try {
	        this._menu.adjustHeight(popupDiv, this.MAX_HEIGHT);          
	        if (this._menu.isScrollbarInside()) {
	          this._menu.adjustWidthToScrollbar(popupDiv);
	        }                
   		} catch (e) { /* nop */ }
	},

	/**
	 * Stops the edition process. Updates the model if this is not a cancel.
	 * 
	 * @param {boolean}
	 *            willEditAgain If true, the device is kept visible and awakened
	 *            to events.
	 * @param {boolean}
	 *            isCancel If true, the model is not updated nor set.
	 */
	stopEditing : function (willEditAgain, isCancel) {
		// Safety guard in case of consecutive stops (may arise in case of chaned device, such as with the autocomplete)
		if (!this._currentModel) 
			return;
		
		// Updates the model
		if (!isCancel) {
			if (this.getSelection()) {
				if (this._currentModel.onMenuSelection)
					this._currentModel.onMenuSelection(this.getSelection()); // FIXME: deprecated (update select.js)
				else
					this._currentModel.update(this.getSelection());
			}
		}
		
		// Uninstalls text device
		if (!willEditAgain) { 
			xtdom.removeEventListener(this._document, 'mousedown', this.clickHandler, true);
			this._menu.hide();
			
			// Unregisters to keyboard events
			this._keyboard.unregister(this, this._keyboardHandlers, this._document);
		}
		
		// Sets the editor FIXME deprecated ! (an update should )
		if ((!isCancel) && (this._currentModel.isOptional)
				&& (!this._currentModel.isSelected)) {
			if (this._currentModel.setSelectionState)
				this._currentModel.setSelectionState(true);
			else
				this._currentModel.set(); 
		}
		
		// Releases the device
		this._currentModel = null;
	},
	
	/**
	 * Cancels the edition process, that is, releases the device without
	 * updating the model.
	 */ 
	cancelEditing : function() {
		this.stopEditing(false, true);
	},
	
	/**
	 * Returns true if the device is in an edition process.
	 * 
	 * @return {boolean}
	 */
	isEditing : function () {
		return this._currentModel ? true : false;
	},
	
	/////////////
	// Getters //
	/////////////

	/**
	 * Returns the currently selected item
	 * 
	 * @return
	 */
	getSelection : function() {
		return this._currentSelection;
	},
	
	/**
	 * Sets the currently selected item
	 * 
	 * @param {any}
	 */
	setSelection : function(aSelection) {
		this._currentSelection = aSelection;
	},
	
	/**
	 * Retruns the 
	 * 
	 * @return
	 */
	getHandle : function () {
		return this._menu.getHandle();
	},
	
	/////////////////////
	// Event listeners //
	/////////////////////

	/**
	 * Hnadler for the click event on the document while the popup menu is
	 * active (displayed). Catches the event and delegates its actual handling
	 * to the popup menu (the object who wraps the HTML structure).
	 */
	handleClick : function (ev) {
		this._menu.handleClick(ev, this);
	},
	
	/**
	 * Handler for keyboard events. Mainly listen for up and down arrows, escape
	 * or return keystrockes.
	 * 
	 * @param aEvent
	 */
	doKeyDown : function (aEvent) {
		switch (aEvent.keyCode) {
		case 38 : // arrow up
			this._menu.selectPrev();
			xtdom.preventDefault(aEvent);
			xtdom.stopPropagation(aEvent);
			break;
		case 40 : // arrow down
			this._menu.selectNext();
			xtdom.preventDefault(aEvent);
			xtdom.stopPropagation(aEvent);
			break;
		default :
			// nope
		}
		this._currentSelection = this._menu.getSelected();
	},
	
	/**
	 * Handler for keyboard events. Mainly listen for up and down arrows, escape
	 * or return keystrockes.
	 * 
	 * @param aEvent
	 */
	doKeyUp : function (aEvent) {
		// nope
	}
}


/**
 * Utility class to wrap the DOM construction
 *
 * @param {DOMDocument}
 *            aDocument
 */
xtiger.editor.PopupMenu = function(aDocument) {
	
	this._document = aDocument;
	
	
	this._handle = this._createMenuForDoc(aDocument);
	
	
	this._handle.style.visibility = 'hidden';
	
	/*
	 * The position (from 0 to length-1) of the selected choice.
	 * 
	 * If -1, no element is selected
	 */
	this._currentSelection = -1;
	
	/**
	 * the current options *values* displayed by the menu
	 */
	this._options = null;
}

xtiger.editor.PopupMenu.prototype = {

	/**
	 * Creates the DOM elements (the handle) to display the choices.
	 * 
	 * @param {DOMDocument}
	 *            aDocument
	 * @return {DOMElement}
	 */
	_createMenuForDoc : function(aDocument) {
		var body = aDocument.getElementsByTagName('body')[0]; // FIXME: body or BODY ? (use a hook for insertion ?)
		var device = xtdom.createElement(aDocument, 'div');
		xtdom.addClassName(device, 'axel-popup-container'); // Must be positioned as absolute in CSS !!!
		body.appendChild(device);
		return device;
	},
	
	/**
	 * Creates a &gt;li&lt; element to insert into the popup menu.
	 * 
	 * @param {any|{value:any,display:InnerHTML}|{section:[...], header: InnerHTML}}
	 *            aOption The option value from which build a HTML element. This
	 *            value may be of three different kind:
	 *            - a single value: the displayed value is returned to the model
	 *            when selected.
	 *            - a pair display/value: the popup element shows the display
	 *            field but returns the value to the model.
	 *            - a section (hash): defines a section. The hash contains one mandatory
	 *            field, section, which contains an array of option, one optional, header,
	 *            which contains a valid html string to use as a section's header.
	 * @param {[HTMLElement]}
	 *            aOptionsList The list of options for this menu. Passed as
	 *            parameter such as option element (li element that are a choice
	 *            in the list) can add themselves in that list.
	 * @return {HTMLElement} a &lt;li&gt; element to insert in the list
	 */
	_createMenuElement: function (aOption, aOptionsList) {
		var _li = xtdom.createElement(this._document, 'li');
		_li.isNestedList = false; // Only true for sub list (as in a segmented list)
		switch (typeof aOption) {
		case 'object' : 
			if (aOption.value && aOption.display) {
				_li.selectionvalue = aOption.value;
				xtdom.addClassName(_li, 'axel-popup-selectable');
				aOptionsList.push(_li);
				try {
					_li.innerHTML = aOption.display;
				}
				catch (_err) {
					xtiger.cross.log('warning', 'The following text is not proper HTML code ' +
							"\n\t" + '"' + aOption.display + '"' + "\n\t" +
							'Cause : ' + _err.message);
					var _text = xtdom.createTextNode(this._document, aOption.display);
					_li.appendChild(_text);
				}
				break;
			}
			else if (aOption.section) { // Nested list (header is optional)
				_li.selectionvalue = null; // No value for a section
				_li.isNestedList = true;
				try {
					_li.innerHTML = '<table class="axel-popup-sublist"><tbody><tr>' +
						'<td class="axel-popup-sublistheader"></td>' + 
						'<td class="axel-popup-sublistbody"><ul style="margin-left:0"></ul></td>' + 
						'</tr></tbody></table>'; // margin-left: for IE8						
					_header = _li.firstChild.firstChild.firstChild.firstChild;
					_body = _header.nextSibling.firstChild;
					if (aOption.header) {
						_header.innerHTML = aOption.header;
					}
					for (var _i = 0; _i < aOption.section.length; _i++) {
						var _subelement = this._createMenuElement(aOption.section[_i], aOptionsList); // Recurse
						_body.appendChild(_subelement);
					}
				}
				catch (_err) {
					xtiger.cross.log('warning', 'The following text is not proper HTML code ' +
							"\n\t" + '"' + aOption.header + '"' + "\n\t" +
							'Cause : ' + _err.message);
					var _text = xtdom.createTextNode(this._document, aOption.display);
					_li.appendChild(_text);
				}
				break;
			}
		case 'string' :
		default:
			_text = xtdom.createTextNode(this._document, aOption);
			_li.selectionvalue = aOption;
			_li.appendChild(_text);
			xtdom.addClassName(_li, 'axel-popup-selectable');
			aOptionsList.push(_li);
		}
		return _li;
	},

	_setPositionXY : function(x, y) {
		with (this._handle.style) {
			left = x + 'px';
			top = y + 'px';
		}
	},

	/**
	 * Returns the menu's handle.
	 * 
	 * @return {HTMLElement} The HTML top container of the popup menu
	 */
	getHandle : function() {
		return this._handle;
	},

	////////////////////////////////////////////////////////////////
	// Methods controlling the appearance of the popup menu device
	////////////////////////////////////////////////////////////////
	
    // Returns true if the browser displays scroll bars inside their container 
    // false if it adds them outside
    isScrollbarInside : function() {    
      return xtiger.cross.UA.gecko || xtiger.cross.UA.webKit || xtiger.cross.UA.IE;
    },
                                     
	// Detects if there is a scrollbar, adjusts the handle width in case it's inside
	// also adjusts width in case the scrollbar would be out of the window
    adjustWidthToScrollbar : function(n) { 
      var tmp, 
		  sbWidth = 20, // scrollbar width (FIXME)
		  rightMargin = 10 + sbWidth; // includes potential window scroll bar
			// space we would like to leave to the right of the popup in case it touches the border
			// note that depending on the browser it may include the window scrollbar itself
	
      if (n.scrollHeight > n.clientHeight) { // tests if there is a scrollbar
          // adjusts width so that scrollbar is inside the window
		  // also adjusts it so that there is a little space left on the right
          var pos = xtdom.findPos(n);
          var size = xtdom.getWindowLimitFrom(n);             
          var freeV = size[0] - pos[0] - rightMargin;
          tmp = ((n.scrollWidth + sbWidth) < freeV) ? n.scrollWidth + sbWidth : freeV;
          n.style.width = tmp + 'px';
      } 
	  // FIXME: we should also adjusts width to apply rightMargin in case there is no scrollbar
    },  
                           
	// Adjusts the height of the handle taking as much space is available till the bottom 
	// of the window or max otherwise
    adjustHeight : function(n, max) { 
      var curMaxH,                     
		  bottomMargin = 20,
		  newMaxH = max;
      var pos = xtdom.findPos(n);
      var size = xtdom.getWindowLimitFrom(n);             
      var freeH = size[1] - pos[1] - bottomMargin;
	  if ((freeH < n.clientHeight) || (n.scrollHeight > n.clientHeight)) { // not engouh space to show all popup
		newMaxH = (freeH > max) ? freeH : max;  // don't go below max height
		newMaxH = newMaxH + 'px';
	   	curMaxH = n.style.maxHeight || '';
	   	if (curMaxH != newMaxH) {      
			n.style.maxHeight = newMaxH;
	   	}    
	  }
    },    

	/**
	 * Initialize popup menu content with options and creates as many
	 * &gt;li&lt; as necessary
	 */
	setOptions : function(aOptions, aSelection) {
		this._currentSelection = -1;
		this._options = [];
		this._handle.innerHTML = '<ul style="margin-left:0"></ul>'; // margin-left: for IE8
		for (var _i = 0; _i < aOptions.length; _i++) {
			var _opt = this._createMenuElement(aOptions[_i], this._options);
			if (aSelection && _opt.selectionvalue == aSelection) {
				xtdom.addClassName(_opt, 'selected');
			} else {
				xtdom.removeClassName(_opt, 'selected');
			}
			this._handle.firstChild.appendChild(_opt);
		}
	},

	/** 
	 * Position the menu just below the provided handle (an HTML DOM node)
	 * 
	 * @param aHandle
	 */
	setPosition : function(aHandle) {
		var pos = xtdom.findPos(aHandle); // FIXME use another positionment algo
		this._setPositionXY(pos[0], aHandle.offsetHeight + pos[1])
	},

	/**
	 * Select the next element in the list
	 * 
	 * @TODO manage sub lists
	 */
	selectNext : function () {
		if (this._currentSelection != -1)
			xtdom.removeClassName(this._options[this._currentSelection], 'selected');
		this._currentSelection++;
		this._currentSelection %= (this._options.length);
		xtdom.addClassName(this._options[this._currentSelection], 'selected');
	},

	/**
	 * Select the previous element in the list
	 * 
	 * @TODO manage sub lists
	 */
	selectPrev : function () {
		if (this._currentSelection != -1)
			xtdom.removeClassName(this._options[this._currentSelection], 'selected');
		else
			this._currentSelection = 1;
		this._currentSelection--;
		if (this._currentSelection < 0)
			this._currentSelection = this._options.length - 1;
		xtdom.addClassName(this._options[this._currentSelection], 'selected');
	},
	
	/**
	 * Returns the value of the currently selected element, if any. If none,
	 * returns false.
	 * 
	 * @return {string|boolean} The value of the selected element or false if no
	 *         element is selected.
	 */
	getSelected : function () {
		if (this._currentSelection == -1)
			return false;
		var _sel = this._options[this._currentSelection];
		if (_sel.value)
			return _sel.selectionvalue;
		return _sel.firstChild.data;
	},
	
	/**
	 * Shows the popup menu
	 */
	show : function() {
		this._handle.style.visibility = 'visible';
	},

	/**
	 * Hides the popup menu
	 */
	hide : function() {
		this._handle.style.visibility = 'hidden';
	},
   
	/**
	 * Analyses the event provided as parameter and returns the selected option
	 * as a string if the event is targeted at one of the menu options. Returns
	 * false otherwise.
	 * 
	 * @param {DOMMouseEvent}
	 *            aEvent A mouse event to analyse.
	 */
	handleClick : function (aEvent, aDevice) {
		// find the first <li> target in event target ancestors chain
		var target = xtdom.getEventTarget(aEvent);
		// xtiger.cross.log('debug', 'peekEvent(' + xtdom.getLocalName(target) + ')');
		while (target.parentNode) {
			if (xtdom.getLocalName(target).toLowerCase() == 'li' && target.selectionvalue) {
				aDevice.setSelection(target.selectionvalue);
				xtdom.preventDefault(aEvent);
				xtdom.stopPropagation(aEvent);
				aDevice.stopEditing(false, false);
				return;
			}
			if (target == this._handle) {
				return; // Do nothing
			}
			target = target.parentNode;
		}
		// Out of the device, stops the event and the edition process
		xtdom.preventDefault(aEvent);
		xtdom.stopPropagation(aEvent);
		aDevice.stopEditing(false, true);
	}
}
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */							 
		
/**
* <p>
* A LayoutManager encapsulates different algorithms for dynamically replacing
* a Model Handle with an editor. Once the layout manager is invoked with a layout
* method such as insertAbove or insertInline, it retains a state which is restored
* with a call to restoreHandle. So basically a possible use is to encapsulate 
* one layout manager per device. 
* </p>
* 
* @class LayoutManager
*/
xtiger.editor.LayoutManager = (function LayoutManager() {
	
	/* trick to reserve the lens size into the document */		
	var _fakeDiv; // iff display="inline"
	
	/* Outer container for positioning above a model's handle */
	var _posContainer; 
	
	var _document;
	
	/*
	 *	Lazy creation of _fakeDiv
	 */
	var _initFakeDiv = function _initFakeDiv() {
		_fakeDiv = xtdom.createElement(_document, 'img');
		_fakeDiv.setAttribute('src', xtiger.bundles.lens.whiteIconURL); // FIXME: use a "lens" bundles ?
		// _fakeDiv.style.verticalAlign = "top"; // FIXME: style could be "copied" from the editor handle
	}
	
	return function(aDocument) {	 
										 
		_document = aDocument;
		_posContainer = xtdom.createElement(aDocument, 'div');
		xtdom.addClassName(_posContainer, 'axel-layout-container');
		
		this.getFakeDiv = function() {
			if (! _fakeDiv) {
				_initFakeDiv();
			}
			return _fakeDiv;
		};

		this.getLayoutHandle = function() {													
			return _posContainer;
		};
		
	}

})();		

xtiger.editor.LayoutManager.prototype = { 
																												 
	// Computes the style distance for aNode set in aDirection
	// Returns a number or 0 if aDirection  is 'auto' it will return 0
	// e.g.: _getDistanceFor(handle, 'top')
	_getDistanceFor : function(aNode, aDirection) {
		var style = xtdom.getComputedStyle(aNode, aDirection),				
				tmp = style.match(/\d*/),
				value = (tmp && tmp[0] && (tmp[0] != '')) ? parseInt(tmp) : 0; 
		return (! isNaN(value)) ? value : 0;
	},
	
	/*
	 * For a given model, computes the left and top offsets for the positionable div
	 * 
	 * @return {int[]} the left and top offset, in an array
	 */
	 _getOffset : function (aTarget) {
		var _topOffset = 0,
		 		_leftOffset = 0,
				_hmt, 
				_hml;     
		switch (xtdom.getComputedStyle(aTarget, 'position')) {
			case 'absolute': // unsupported
			case 'fixed': // unsupported
				break;
			case 'relative':
				_topOffset = this._getDistanceFor(aTarget, 'top');
				_leftOffset = this._getDistanceFor(aTarget, 'left');   
				// fall through !
			case 'static':
			default:										
				_hmt = this._getDistanceFor(aTarget, 'margin-top');
				_hml = this._getDistanceFor(aTarget, 'margin-left');
				_topOffset += (_hmt > 0) ? _hmt : 0;
				_leftOffset += (_hml > 0) ? _hml : 0;
		}													 
		return [_leftOffset, _topOffset];
	},     
	      
	_confirmInsertion : function(aModelHandle) {
		var doIt = (! this.curHandle) || (this.curHandle != aModelHandle);
		if (this.curHandle && (this.curHandle != aModelHandle)) { 
			// already in use with another handle, restores it first 
			this.restoreHandle();
		}
		return doIt;
	},
		
	// Gets the display property from a handle and applies it to the top container
	_setDisplay : function (top, aSrcHandle) {
		var _disp = xtdom.getComputedStyle(aSrcHandle, 'display');
		_disp = (/^block$|^inline$/.test(_disp)) ? _disp : 'block';
		top.style.display = _disp;			
	},    
	
	// That methods requires specific axel-layout-container CSS rules in axel.css 
	_setOrigin : function (top, offset, padding) {
		// applies left margin because even 'auto' left margins are not applied
		top.style.left = '' + (offset[0] - padding[0]) + 'px';
		// does not apply top margin because we need to filter getComputedStyle
		// results to detect those who are due to 'auto' margins
		// actually only IE returns 'auto' when no margins have been set
		top.style.top = '' + (offset[1] - padding[1]) + 'px';
	},	     
	
	_insert : function(aStyle, aModelHandle, aLensContent, aPadding, aGrabCallback) {
		var top, offset, img,
				padding = aPadding,
				doit = this._confirmInsertion(aModelHandle);
		if (doit) {
			top =  this.getLayoutHandle();
			offset = this._getOffset(aModelHandle);
			this._setDisplay(top, aModelHandle); // FIXME: useless ?
			top.style.visibility = 'hidden';
			if (aStyle == 'above') {
				// inserts the lens inside the document
				aModelHandle.parentNode.insertBefore(top, aModelHandle);
			} else {
				img = this.getFakeDiv();
				// replaces handle with empty image that will "reserve" space
				aModelHandle.parentNode.replaceChild(img, aModelHandle);
				img.parentNode.insertBefore(top, img);				
			}
			// inserts wrapper top level element inside lens 
			top.appendChild(aLensContent);
			if (aGrabCallback)
				padding = aGrabCallback();
			this._setOrigin(top, offset, padding);	
			top.style.visibility = 'visible';
			this.curDisplay = aStyle;
			this.curHandle = aModelHandle;			
			this.curLensContent = aLensContent;
		}
		return doit;
  },
	 
 	insertAbove : function(aModelHandle, aLensContent, aPadding, aGrabCallback) {
		this._insert('above', aModelHandle, aLensContent, aPadding, aGrabCallback);
	}, 
	
	// Replaces the model handle by the lens container filled 
	// with the lens content, followed by an empty image
	// This works only if the model handle is an inline element 
	insertInline : function(aModelHandle, aLensContent, aPadding, aGrabCallback) { 
		var bbox, w, h, img;
		if (this._insert('inline', aModelHandle, aLensContent, aPadding, aGrabCallback)) {
			// adjusts space filler
			bbox = aLensContent.getBoundingClientRect(); 
			w = bbox ? (bbox.right - bbox.left) : 1;
			h = bbox ? (bbox.bottom - bbox.top) : 1;
			img = this.getFakeDiv();			
			img.style.width = w	 + 'px';
			img.style.height = h	+ 'px';  
		}
	},
	
	// Restores editor handle view
	restoreHandle : function () { 
		var img;
		if (this.curHandle) {
			if (this.curDisplay == 'inline') {												
				img = this.getFakeDiv();				
				img.parentNode.replaceChild(this.curHandle, img);
			} else {
				this.curHandle.style.visibility = 'visible';
			}
			xtdom.removeElement(this.curLensContent);
			xtdom.removeElement(this.getLayoutHandle()); // FIXME opera inserts a <br> tag !
			this.curHandle = this.curDisplay = this.curLensContent = undefined;
		}
	}
	
}

/**
 * <p>
 * LensDevice
 * </p>
 * 
 * @class LensDevice
 */
xtiger.editor.LensDevice = function (aDocument) {

	/* the document containing the device */
	var _document = aDocument;

	/* reference to the keyboard device */
	var _keyboard = xtiger.session(aDocument).load('keyboard');

	/* This is a reference to the current edited model (editor in Stephane's terminology) */
	var _currentModel;
	
	/* Currently used lens content wrapper */
	var _currentLCW;

	/* Current lens wrapper top container */
	var _lensView;
	
	/* Layout manager that caches the editor model when it is removed from the DOM */
	var _layoutManager;
	
	/* default values for lens parameters (in case they are not defined in the editor/model) */
	var _defaultParams = {
		trigger : 'click', // 'click' or 'mouseover' DOM events (see awake)			
		display : 'above',
		padding : "10px"
	};
	
	/* To desactivate lens mouse out detection when homing back from a modal dialog */
	var _checkMouseReturn = false;
	
	/* If true, the wrapper is never released. The value is set with the keepAlive() method */
	var _keepAlive = false;
	
	/* closure variable */
	var _this = this;
	
	/* named event handlers */
	var _dismissHandlers = {
		'click' : ['click', function (ev) { _this._onClick(ev) }],
		'mouseover' : ['mousemove', function (ev) { _this._onMouseMove(ev) }]
	};
	
	/*
	 * Returns the parameter holds by the given model
	 */
	var _getParam = function(name, aModel) {
		return (aModel.getParam && aModel.getParam(name)) || _defaultParams[name];
	};
	
	var _getLayoutManager = function() {
		if (! _layoutManager) {
			_layoutManager = new xtiger.editor.LayoutManager(_document);
		}
		return _layoutManager; 
	};
	
	var _getWrapperFor = function(aName) {	 
		var w = xtiger.factory('lens').getWrapper(_document, aName);		
		if (!w) {
			xtiger.cross.log('warning', 'Missing wrapper "' + aWrapperName + '" in lens device, startEditing aborted')
		}
		return w;
	};
	
	var _grabWrapper = function(aDeviceLens, aWrapperName, doSelect, aPadding) {		
		var res;
		try {
			res = _currentLCW.grab(aDeviceLens, doSelect, aPadding);			
		} catch (e) {
			xtiger.cross.log('error ( ' + e.message + ' ) "', aWrapperName + '" failed to grab the lens device, startEditing compromised' );
		}                                                         
		return res || aPadding;
	};
	
	var _terminate = function(that, doUpdateModel) {
		if (! that.isEditing())
				return; // was not in an edition process

		if (_currentLCW.isFocusable()) {
			_keyboard.unregister(that, that._handlers);
		}			
		_getLayoutManager().restoreHandle();

		// end of event management to control when to dismiss the lens
		var mode = _getParam('trigger', _currentModel);
		if (_dismissHandlers[mode]) { 
			xtdom.removeEventListener(_document, _dismissHandlers[mode][0], _dismissHandlers[mode][1], true);
			_checkMouseReturn = false;
		}
					
		if (doUpdateModel) {
			// transfers data from the lens to the editor model
			_currentModel.update(_currentLCW.getData());
		}

		// release MUST make the lens invisible
		// not that this is not symmetrical with grab as it was done in the layout manager
		_currentLCW.release();

		// resets lens sate
		_currentModel = null;			
		_currentLCW = null;
		_lensView = null;		 
	}; 
			
	/* ##################################
	 * ###### EDITION PROCESS MGMT ######
	 */
	
	/**
	 * Starts an edition process on the given model, using the lens content
	 * specified in parameter.
	 * 
	 * @param {Model}
	 *						aModel A model containing the data to edit
	 * @param {string}
	 *						aWrapperName The name of the lens content to use
	 * @param {boolean}
	 *						aDoSelect Select the field at grabbing time
	 */
	this.startEditing = function startEditing (aModel, aWrapperName, aDoSelect) {		
		// xtiger.cross.log('debug', 'startEditing');
		var display, tmp, padding, mode;	 
		var doSelect = aDoSelect ? true : false; // sanitization
		
		if (this.isEditing())
			this.stopEditing();			
		_currentLCW = _getWrapperFor(aWrapperName);		
		if (_currentLCW) {
			_currentModel = aModel;
			
			// keyboard focus management
			if (_currentLCW.isFocusable()) {
				this._handlers = _keyboard.register(this);
				_keyboard.grab(this, aModel);
			}								
															
			// extracts desired padding for the model parameters
			tmp = _getParam('padding', aModel).match(/\d*/)[0];
			tmp = (padding && padding != '') ? parseInt(padding) : 10; 
			padding = [tmp, tmp];
			
			// replaces handle with lens and asks wrapper to grab the device
			_lensView = _currentLCW.getHandle();
			display = _getParam('display', _currentModel)
			if (display == 'above') {
				_getLayoutManager().insertAbove(_currentModel.getHandle(), _lensView, padding,
					function() { return _grabWrapper(_this, aWrapperName, doSelect, padding) }); 
			} else if (display == 'inline') {
				_getLayoutManager().insertInline(_currentModel.getHandle(), _lensView, padding, 
					function() { return _grabWrapper(_this, aWrapperName, doSelect, padding) });
			} else {
				 xtiger.cross.log('error', 'unkown display "' + display + '" in lens device, startEditing compromised');
			}                                   
			
			// activates wrapper
			_currentLCW.activate(this, aDoSelect);
			
			mode = _getParam('trigger', aModel);
			if (_dismissHandlers[mode]) { 
				// currently we do our own event peeking at the document level !
				xtdom.addEventListener(_document, _dismissHandlers[mode][0], _dismissHandlers[mode][1], true);
				_checkMouseReturn = false;
			} else {
				xtiger.cross.log('error', 'unkown trigger mode "' + mode + '" in lens device, startEditing compromised');
			} 
		}
	};

	/**
	 * <p>
	 * Stops the edition process on the current model. Fetches the data from
	 * the device and update the model.
	 * </p>
	 */
	this.stopEditing = function stopEditing () {
		// xtiger.cross.log('debug', 'stopEditing');
		_terminate(this, true); 
	};
	
	/**
	 * <p>
	 * Stops the current editing process without making any changes to the
	 * model. A further version may even want to restore the "original"
	 * state of the model, that is, the state the model had at device's
	 * grabbing time.
	 * </p>
	 */
	this.cancelEditing = function cancelEditing () {
		_terminate(this, false); 
	};

	/**
	 * <p>
	 * Returns true if the device is in an edition process, false otherwise.
	 * </p>
	 * 
	 * @return {boolean} True if the device is editing
	 */
	this.isEditing = function isEditing () {
		return _currentModel ? true : false;
	};
	
	/**
	 * <p>
	 * Returns the handle of the device if the later is in an edition
	 * process. Returns null otherwise. The handle is the one belonging to
	 * the editing facility, not the one belonging to the model.
	 * </p>
	 * 
	 * @return {HTMLElement} The handle of the wrapped field
	 */
	this.getHandle = function getHandle () {
		if (_currentLCW)
			return _currentLCW.getHandle();
		return null;
	};
	
	/**
	 * <p>
	 * Returns the current model using this device, null if the device is
	 * unused.
	 * </p>
	 * 
	 * @return {Model} The model using this device
	 */
	this.getCurrentModel = function getCurrentModel () {
		if (_currentModel)
			return _currentModel;
		return null;
	};
	
	/**
	 * <p>
	 * The method is used to tell the device to stay alive whatever event
	 * may occurs, at the exception of the grabbing of the device by another
	 * model.
	 * </p>
	 * 
	 * @param {boolean}
	 *						aAlive If true, the device stays alive even if the events
	 *						tells it to disappear
	 */
	this.keepAlive = function keepAlive (aAlive) {
		_keepAlive = aAlive;
	};

	/* ##############################
	 * ###### EVENTS LISTENERS ######
	 */
	
	this._onClick = function (ev) {
		if(_keepAlive)
			return;
		// any click outside of the _lensView will stop editing
		var outside = true;
		var target = xtdom.getEventTarget(ev);
		while (target.parentNode) {
			if (target == _lensView) {
				outside = false;
				break;
			}				
			target = target.parentNode;
		} 
		if (outside) { // FIXME: not sure what happens if the user clicked on another lens
			this.stopEditing();
		}
	};

	/**
	 *	Handler to detect when the mouse is leaving the lens
	 */		
	this._onMouseMove = function (ev) {
		if(_keepAlive || (! _lensView))
			return;
		var _mouseX = ev.clientX;
		var _mouseY = ev.clientY;
		var _bb = _lensView.getBoundingClientRect();
		if (_checkMouseReturn) {
			if (! (_bb.left > _mouseX || _bb.top > _mouseY || _bb.right <= _mouseX || _bb.bottom <= _mouseY)) {
				_checkMouseReturn = false; // ok mouse is back
			}
		} else if (_bb.left > _mouseX || _bb.top > _mouseY || _bb.right <= _mouseX || _bb.bottom <= _mouseY) {
			this.stopEditing();
			xtdom.stopPropagation(ev);				
		}
	}

	this.doKeyUp = function doKeyUp (ev) {
		// nope
	};
	
	/**
	 * Handler for intercepting arrow keys' actions. Asks the lens content wrapper to toggle between
	 *the fields.
	 *
	 * @param {KeyboardEvent} ev The event where to fetch the key code
	 */
	this.doKeyDown = function doKeyDown (ev) {
		if (!this.isEditing())
			return; // Safety guard
		if (ev.keyCode == "38" || ev.keyCode == "40")
			_currentLCW.toggleField();
		if (ev.keyCode == "27") // ESC
			this.cancelEditing();
		xtdom.stopPropagation(ev);
	};
	
	// A wrapper should call this method in case it opens a modal dialog box that may cause 
	// the mouse to move outside the lens (e.g. an input form file input dialog)
	// In that case the device should be careful not to close the lens when the mouse is moving out
	this.mouseMayLeave = function mouseMayLeave () {
		_checkMouseReturn = true; // Flag set to not dismiss lens on mouse move
	};
	
}

/** 
 * <p>
 * Manages dynamic creation of LensDevice, one per application.
 * </p>
 * 
 * @class LensDeviceFactory
 */
xtiger.editor.LensDeviceFactory = function () {
	this.devKey = 'LensDeviceCache';
	this.wrappers = {}; // wrapper constructors
} 

xtiger.editor.LensDeviceFactory.prototype = {
	
	/* 
	 * Gets or create cache to store devices and wrappers on a per-document basis
	 * @private
	 */
	_getCache : function (doc) {
		var cache = xtiger.session(doc).load(this.devKey);
		if (! cache) {
			cache = {'device' : null,
							 'wrappers' : {} // instantiated wrappers per-document
					};
			xtiger.session(doc).save(this.devKey, cache);
		}
		return cache;
	},
	
	/**
	 * <p>
	 * Registers a lens wrapper <em>factory</em> for the lens device.
	 * </p>
	 *	
	 * @param {string} aKey
	 * @param {function} aWrapperFactory
	 * 
	 * @see #getWrapper()
	 */
	registerWrapper : function (aKey, aWrapperFactory) {
		if (this.wrappers[aKey]) {
			xtiger.cross.log('error', "Error (AXEL) attempt to register an already registered wrapper : '" + aKey + "' with 'lens' device !");
		} else {
			this.wrappers[aKey] = aWrapperFactory;
		}
	},
	
	/**
	 * 
	 * @param {DOMDocument} aDocument 
	 * @param {string} aKey
	 * @return {LensWrapper}
	 */
	getWrapper : function (aDocument, aKey) {
		var cache = this._getCache(aDocument);
		var wrapper = cache['wrappers'][aKey];
		if (! wrapper) {
			var wConstructor = this.wrappers[aKey]; // Checks that constructor is known
			if (wConstructor) {
				wrapper = cache['wrappers'][aKey] = wConstructor(aDocument);
			}
		}
		if (! wrapper) {
			xtiger.cross.log('error', "Error (AXEL) : unkown wrapper '" + aKey + "' requested in 'lens' device !");
		}
		return wrapper;
	},
	
	/**
	 * <p>
	 * Gets the device's instance. At first call, the device is instanciated
	 * and the created object is stored. This object will be returned for
	 * every further calls given <em>the same document</em>. That is to
	 * say, one device is (lazily) created per document.
	 * </p>
	 * 
	 * @param {DOMDocument}
	 *						aDocument A DOM document to contain the device
	 * @return {LensDevice} The device for the given document
	 */
	getInstance : function (aDocument) {
		var cache = this._getCache(aDocument);
		var device = cache['device'];
		if (! device) {
			device = cache['device'] = new xtiger.editor.LensDevice(aDocument);				
		}
		return device;
	}
}

// Resource registration
xtiger.resources.addBundle('lens', 
	{ 'whiteIconURL' : 'white.png' } );

xtiger.registry.registerFactory('lens', new xtiger.editor.LensDeviceFactory()); /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */


// Creates and manages several potentially parallel data uploading processes
// Manages a pool of Upload objects, queues request to upload and serve them one at a time
// Possibility to serve in parallel (asynchonous)
xtiger.editor.UploadManager = function (doc) {
	// this.inProgress = []; // uploading
	// this.queued = []; // waiting for uploading
	this.available = []; // available
	this.curDoc = doc;
}

xtiger.editor.UploadManager.prototype = {
	
	_reset : function (uploader) {
		if (this.inProgress != uploader) { alert('Warning: attempt to close an unkown transmission !')}
		uploader.reset();
		this.available.push(uploader);
		this.inProgress = null;
	},
	
	// Returns an available uploader to an editor which can use it to upload a file
	getUploader : function () {
		return (this.available.length > 0) ? this.available.pop() : new xtiger.editor.FileUpload(this);
	},
	
	// Returns true if the manager is ready to transmit (no other transmission in progress)
	isReady : function () {
		return (null == this.inProgress);
	},
	
	// Returns false if uploader is null or if it is currently not transmitting
	// Returns true if it is actually transmitting
	isTransmitting : function (uploader) {
		return (uploader && (uploader == this.inProgress));
	},
	
	// Asks the manager to start uploading data with the given uploader
	// The manager may decide to queue the transmnission
	startTransmission : function (uploader, client) {
		// var key = this._genTransmissionKey();
		this.inProgress = uploader; // only one at a time
		// as there may be an error while starting we save inProgress before
		uploader.start(client);		
	},
	
	// Must be called by the target iframe at the end of a transmission
	// status 1 means success and in that case result must contain either 
	// a string with the URL of the photo (for displaying in handle)
	// or a hash with 'url' and 'resource_id' keys
	// status 0 means error and in that case result is an explanation
	// FIXM: currently only one transmission at a time (this.inProgress)
	reportEoT : function (status, result) {
		if (! this.inProgress) { // sanity check
			// maybe the transmission was simply cancelled hence we cannot say...
			// alert('Warning: attempt to report an unkown file upload termination !');
		} else {
			if (status == 1) {
				this.notifyComplete(this.inProgress, result);
			} else {
				this.notifyError(this.inProgress, 0, result); // code not used (0)
			}
		}
	},
		
	notifyComplete : function (uploader, result) {
 		var tmp = uploader.client;
		this._reset (uploader);
		tmp.onComplete (result); // informs client of new state		
	},	

	// FIXME: code not used
	notifyError : function (uploader, code, message) {	  
		var tmp = uploader.client;
		this._reset (uploader);
		tmp.onError (message); // informs client of new state
	},
	
	// Asks the manager to cancel an ongoing transmission
	cancelTransmission : function (uploader) {
		var tmp = uploader.client;
		uploader.cancel ();		
		this._reset (uploader);
		tmp.onCancel (); // informs client of new state 
	}			
}

// Simple XHR based file upload
// See https://developer.mozilla.org/en/Using_files_from_web_applications
xtiger.editor.FileUpload = function (mgr) {
	this.manager = mgr;	
	this.xhr = null;   
	this.defaultUrl = "/upload"; // FIXME: default action URL
}

xtiger.editor.FileUpload.prototype = {
  
  reset : function() {
    delete this.url;
  },
	
	setDataType : function (kind) {
		this.dataType = kind; // 'dnd' or 'formular'
	},        
	  
	// Sets the url of the server-side upload script, should be on the same domain
	setAction : function(aUrl) {
	  this.url = aUrl;
	},
		
	getClient : function () {
		return this.client;		
	},
	
	setClient : function (c) {
		this.client = c;		
	},	
	
	start : function (client) {
		this.client = client;
		try {
			if (this.dataType == 'dnd') { // HTML 5 version with DnD 
				this.startXHR();
			} else {
				var form = this.client.getPayload();
				if (this.url) {
          xtdom.setAttribute(form, 'action', this.url);
				} else if (! form.getAttribute('action')) {
				  xtdom.setAttribute(form, 'action', this.defaultUrl);
				}
				form['documentId'].value = this.client.getDocumentId() || 'noid';
				form.submit(); // Form based upload
			}		
		} catch (e) {
			this.manager.notifyError(this, e.name, e.message); // e.toString()
		}
	},
		
	startXHR : function () {		
		this.xhr = new XMLHttpRequest();  // creates one request for each transmission (not sure XHRT is reusable)
		var _this = this;  
		this.xhr.onreadystatechange = function () {
			try {
				if (4 == _this.xhr.readyState) {
					if (_this.xhr.status  == 201) { // Resource Created
						_this.manager.notifyComplete(_this, _this.xhr.responseText);
					} else {
						_this.manager.notifyError(_this, _this.xhr.status, _this.xhr.statusText);							
					}
				} 
				_this.xhr = null; // GC
			} catch (e) {
				_this.manager.notifyError(_this, e.name, e.message); // e.toString()
			}
		}	
		this.xhr.open("POST", this.url || this.defaultUrl); // FIXME: store URL in base parameter of editor 
		this.xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');  
		// Document id should have been set through a 'documentId' filter 
		// Document id is sent then "$$$" then photo data 
		// If I knew how to send a multipart message with XMLHTTPRequest that would be cleaner !
		var id = this.client.getDocumentId() || 'noid';
		this.xhr.sendAsBinary(id + "$$$" + this.client.getPayload().getAsBinary());
		// FIXME: encode parameters in URL ?
	},
		
	cancel : function () {
		// NOT SURE HOW TO DO IT ?
		if (this.xhr) {
			this.xhr.abort();
		} else {
			// FIXME: how to cancel a form submission ? 
			// window.stop stops everything including animated gif...			
			var form = this.client.getPayload();
			form.reset(); // naive trial to cancel transmission
		}
	}	
}	

// UploadManager Device creation - one per document
var _UploadFactory = {
	getInstance : function (doc) {
		var cache = xtiger.session(doc).load('upload');
		if (! cache) {
			cache = new xtiger.editor.UploadManager(doc);
			xtiger.session(doc).save('upload', cache);
		}		
		return cache;
	}
}

xtiger.registry.registerFactory('upload', _UploadFactory); /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stéphane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Class TextFactory (static)
 * 
 * @class TextFactory
 * @version beta
 */
xtiger.editor.TextFactory = (function TextFactory() {

	/**
	 * @name _TextModel
	 * @class _TextModel
	 */
	var _TextModel = function(aHandleNode, aDocument) {

		/*
		 * Default parameters for the video editor. Parameters meaning and
		 * possible values are documented below.
		 */
		var _DEFAULT_PARAMS = {
			device : 'text-device',
			type : 'input',
			layout : 'placed',
			shape : 'self',
			expansion : 'grow',
			clickthrough : 'true', // FIXME: use a real boolean ?
			enablelinebreak : 'false'
		};

		/**
		 * The HTML node used as handle by the editor.
		 */
		this._handle = aHandleNode;

		/**
		 * The data handled by *this* model
		 */
		this._data = null;

		/**
		 * The default data as specified in the xt:use node
		 */
		this._defaultData = this._data;

		/**
		 * HTML element to represents an editor containing no data
		 */
		this._noData = this._handle.firstChild;

		/**
		 * A reference to the DOM document containing the editor
		 */
		this._document = aDocument;

		/**
		 * The actual parameters used by *this* instance
		 */
		this._params = _DEFAULT_PARAMS;

		/**
		 * If true, the editor is optional
		 */
		this._isOptional = false;

		/**
		 * If true, the optional editor is set. Irrelevant if not optional
		 */
		this._isOptionSet = false;

		/**
		 * The HTML checkbox for optional editors. Sets in init() method
		 */
		this._optCheckBox;

		/**
		 * The device object used to edit this model. It is sets in init()
		 * function
		 */
		this._device = null;
		
		/**
		 * A stored seed for this model
		 */
		this._seed = null;

		/**
		 * if true, the model's data was modified and is no longer equals to the
		 * default data.
		 */
		this._isModified = false;

		/**
		 * A unique string that identifies *this* instance
		 */
		this._uniqueKey;

		/* Call the create method for delegation purposes */
		this.create();

	};    
	
	/** @memberOf _TextModel */
	_TextModel.prototype = {

		/*
		 * Sets *this* instance data. Takes the handle and updates its DOM content.
		 */
		_setData : function (aData) {
			if (this._handle.firstChild)
				this._handle.firstChild.data = aData;
			this._data = aData;
		},

		/**
		 * This method is called at the instance's creation time. It may serves
		 * as a "hook" to add a custom behavior by the means of the delegation
		 * pattern.
		 */
		create : function () {
			// nope
		},

		/**
		 * <p>
		 * Initialization function, called by the model's factory after object's
		 * instanciation. Cares to sets the default content, to parse and sets
		 * the various parameters and to call the awake() method.
		 * </p>
		 * 
		 * @param {string}
		 *            aDefaultData
		 * @param {string|object}
		 *            aParams Either the parameter string from the <xt:use> node
		 *            or the parsed parameters object from the seed
		 * @param {string}
		 *            aOption If the parameter is not null, the editor is
		 *            optional. If its value equals "set", the editor is set by
		 *            default
		 * @param {string}
		 *            aUniqueKey A unique string (no two editor have the same)
		 *            to provide an unambiguous identifier even among repeated
		 *            editor
		 */
		init : function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
			if (aParams) { /* parse parameters */
				if (typeof (aParams) == 'string')
					xtiger.util.decodeParameters(aParams, this._params);
				else if (typeof (aParams) == 'object')
					this._params = aParams;
			}
			/* sets up initial content */
			if (aDefaultData && typeof aDefaultData == 'string') { 
				this._defaultData = aDefaultData;
			} else {
				this._defaultData = 'click to edit';
			}                              
			this._data = this._defaultData; // Quirck in case _setData is overloaded and checks getDefaultData()
			this._setData(this._defaultData);
			this._isOptional = aOption ? true : false;
			if (aOption) { /* the editor is optional */
				this._optCheckBox = this._handle.previousSibling;
				if (aOption == 'unset')
					this._isOptionSet = true; // Quirk to prevent unset to return immediately
				(aOption == 'set') ? this.set(false) : this.unset(false);
			}
			this._uniqueKey = aUniqueKey;
			if (this.getParam('hasClass')) {
				xtdom.addClassName(this._handle, this.getParam('hasClass'));
			}
			var _deviceFactory = this._params['device'] ? 
					xtiger.factory(this._params['device']) : 
					xtiger.factory(this._params['defaultDevice']);
			this._device = _deviceFactory.getInstance(this._document,
					this._params['type'], this._params['layout']);
			this.awake();
		},

		/**
		 * Creates (lazy creation) an array to "seed" *this* model. Seeding
		 * occurs in a repeat context. 
		 * 
		 * @return
		 */
		makeSeed : function () {
			if (!this._seed)
				this._seed = [ xtiger.editor.TextFactory, this._defaultData,
					this._params, this._isOptional ];
			return this._seed;
		},
		
		/**
		 * Called when the editor is removed by a repeater. Does nothing by default,
		 * it is declared so that it can be filtered.
		 * 
		 * @return
		 */
		remove : function () {
		},

		/**
		 * <p>
		 * Returns true if *this* object is able to perform the function whose
		 * name is given as parameter.
		 * </p>
		 * 
		 * <p>
		 * This function implements the can/execute delegation pattern, this
		 * pattern allows a filter to easily extend the instance API with
		 * specific methods. Those methods are called from various devices such
		 * as the text device.
		 * </p>
		 * 
		 * @param {string}
		 *            aFunction The name of the function
		 * @return {boolean} True if *this* object as a function property with
		 *         the given name, false otherwise.
		 */
		can : function (aFunction) {
			return typeof this[aFunction] == 'function';
		},

		/**
		 * <p>
		 * Calls on *this* instance the function whose name is given as
		 * paramter, giving it the provided parameter (may be null). Returns the
		 * result.
		 * </p>
		 * 
		 * <p>
		 * This function implements the can/execute delegation pattern, this
		 * pattern allows a filter to easily extend the instance API with
		 * specific methods. Those methods are called from various devices such
		 * as the text device.
		 * </p>
		 * 
		 * @param {string}
		 *            aFunction The name of the function
		 * @param {any}
		 *            aParam A parameter whose type is not constrained
		 * @return {any} The return value of the called function.
		 */
		execute : function (aFunction, aParam) {
			return this[aFunction](aParam);
		},

		/**              
		 * <p>Loads the editor with data in the point in the data source passed as parameters.
		 * Unsets the editor and shows the default content if the point is -1 
		 * (i.e. it doesn't exists in the source tree). Shows the default content and considers
		 * the editor as set if the point is not -1 but is empty. This can happen for instance 
		 * with empty tags in the source tree (e.g. <data/>).</p>
		 *
		 *<p>Initializes the option status of the editor (set or unset),
		 * and the modification status (setModified)</p>
		 * 
		 * @param {Array}
		 *            aPoint
		 * @param aDataSrc
		 */
		load : function (aPoint, aDataSrc) {
			var _value;
			if (aPoint !== -1) { 
				_value = aDataSrc.getDataFor(aPoint);
			  this._setData(_value || this._defaultData);
			  this._isModified = (_value !=  this._defaultData);
			  this.set(false);
			} else {
		      this.clear(false);
  			}
		},    

		/**
		 * Writes the editor's current data into the given logger.
		 * 
		 * @param aLogger
		 */
		save : function (aLogger) {
			if (this.isOptional() && !this._isOptionSet) {
				aLogger.discardNodeIfEmpty();
				return;
			}
			if (!this._data)
				return;
			aLogger.write(this._data);
		},

		/**
		 * <p>
		 * Updates this model with the given data.
		 * </p>
		 * 
		 * <p>
		 * If *this* instance is optional and "unset", autocheck it.
		 * </p>
		 * 
		 * @param {string}
		 *            aData The new value to be stored by *this* model's
		 *            instance
		 */
		update : function (aData) {                             
			if (aData == this._data) { // no change
			  return; 
			}
			// normalizes text (empty text is set to _defaultData)
			if (aData.search(/\S/) == -1 || (aData == this._defaultData)) {
				this.clear(true);
				return;
			}
			this._setData(aData);
			this._isModified = true;
			this.set(true);
		},

		/**
		 * Clears the model and sets its data to the default data.
		 * Unsets it if it is optional and propagates the new state if asked to.     
		 *
		 * @param {doPropagate}
		 *            a boolean indicating wether to propagate state change
		 *            in the repeater chain, UNSUPPORTED at that time		 
		 */
		clear : function (doPropagate) {
			this._setData(this._defaultData);
			this._isModified = false;
			if (this.isOptional() && this.isSet())
				this.unset(doPropagate);
		},
		
		/* aliases the clear method */
		setDefaultData: this.clear,

		/**
		 * Returns the editor's current data
		 * 
		 * @return {String} The editor's current data
		 */
		getData : function () {
			return this._data;
		},
		
		/**
		 * Returns the default data for *this* model.
		 * 
		 * @return {String} The default data
		 */
		getDefaultData: function () {
			return this._defaultData;
		},

		/**
		 * Returns the editor's current handle, that is, the HTML element where
		 * the editor is "planted".
		 * 
		 * @return {HTMLElement} The editor's handle
		 */
		getHandle : function (inDOMOnly) {
			if(inDOMOnly) {
				// test if *this* instance is being edited and has a "placed" layout
				if (this._params['layout'] == 'placed' && this._device && this._device.getCurrentModel() == this)
					return this._device.getHandle();
			}
			return this._handle;
		},
		
		/**
		 * Getter for *this* instance owner document.
		 * 
		 * @return {DOMDocument} The DOM document holding *this* model
		 */
		getDocument : function () {
			return this._document;
		},

		/**
		 * Returns a DOM node used to set the device's handle size.
		 */
		getGhost : function () {
			var _s = this._params['shape']; // we only check first char is p
											// like 'parent'
			return (_s && _s.charAt(0) == 'p') ? this._handle.parentNode
					: this._handle;
		},

		/**
		 * Gets *this* instance's parameter whose name is given in arg
		 * 
		 * @return {any} The parameter stored under the given key
		 */
		getParam : function (aKey) {
			return this._params[aKey];
		},

		/**
		 * Returns the unique key associated with *this* instance. The returned
		 * key is unique within the whole document.
		 * 
		 * @return {string} The unique key
		 */
		getUniqueKey : function () {
			return this._uniqueKey;
		},

		/**
		 * Returns true if the model contains data which is no longer the defaut
		 * data, either because a load() call modified it or because an user's
		 * interaction has occured.
		 * 
		 * @return {boolean} True if the data was changed, false otherwise.
		 */
		isModified : function () {
			return this._isModified;
		},
		
		/**
		 * Sets the isModified flag. Useless unless the update or load methods
		 * are filtered by a filter which need to control the isModified
		 * behavior.
		 * 
		 * @param {boolean}
		 *            isModified The new value for the isModified flag
		 */
		setModified : function (isModified) {
			this._isModified = isModified;
		},

		/**
		 * Returns true if the model's editor is able to be put into a chain of
		 * focus. Chains of focus are a list of editor that can be accessed by
		 * iterating with the "tab" key (this feature is better known as the
		 * "tab-navigation" feature).
		 * 
		 * @return {boolean} True if the model should be put into a chain of
		 *         focus, false otherwise.
		 */
		isFocusable : function () {
			return !this._params['noedit'];
		},

		/**
		 * Gives the focus to *this* instance. Called by the tab navigation
		 * manager.
		 */
		focus : function () {
			this.startEditing({shiftKey: true}); // Hack to autoselect content
		},

		/**
		 * Takes the focus away from *this* instance. Called by the tab
		 * navigation manager.
		 */
		unfocus : function () {
			this.stopEditing();
		},

		/**
		 * Returns the optionality status of *this* instance. True if the model
		 * is optional, false otherwise.
		 */
		isOptional : function () {
			return this._isOptional;
		},

		/**
		 * Returns the optionality status of *this* model, that is, if it
		 * is set or unset. Only relevant if the model IS optional
		 * 
		 * @return {boolean} True if the model is optional and set, false
		 *         otherwise
		 *   
		 * @see #isOptional()
		 */
		isSet : function () {
			return this._isOptional && (this._isOptionSet ? true : false);
		},

		/**
		 * Sets the editor option status to "set" (i.e. true) if it is optional.
		 * Also propagates the change to the repeater chain if asked too and
		 * this either it is optional or not.
		 * 
		 * @param {doPropagate}
		 *            a boolean indicating wether to propagate state change in
		 *            the repeater chain
		 */
		set : function(doPropagate) {
			// propagates state change in case some repeat ancestors are unset
			// at that moment
			if (doPropagate) {
				if (!this._params['noedit']) {
					xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle(true));
				}
				xtdom.removeClassName(this._handle, 'axel-repeat-unset'); // fix if *this* model is "placed" and the handle is outside the DOM at the moment
			}
			if (this._isOptionSet) // Safety guard (defensive)
				return;
			this._isOptionSet = true;
			if (this._isOptional) {
				xtdom.removeClassName(this._handle, 'axel-option-unset');
				xtdom.addClassName(this._handle, 'axel-option-set');
				this._optCheckBox.checked = true;                          
			}            
		},
	
		/**
		 * Sets the editor option status to "unset" (i.e. false) if it is
		 * optional.
		 * 
		 * @param {doPropagate}
		 *            a boolean indicating wether to propagate state change in
		 *            the repeater chain, UNSUPPORTED at that time
		 */
		unset : function (doPropagate) {
			if (!this._isOptionSet) // Safety guard (defensive)
				return;
			this._isOptionSet = false;
			if (this._isOptional) {
				xtdom.removeClassName(this._handle, 'axel-option-set');
				xtdom.addClassName(this._handle, 'axel-option-unset');
				this._optCheckBox.checked = false;                    
			}
		},
	
		/**
		 * Awakes the editor to DOM's events, registering the callbacks for them.
		 * 
		 * TODO stores the callback to be able to remove them at will
		 */
		awake : function () {
			var _this = this;
			if (!this._params['noedit']) {
				xtdom.addClassName(this._handle, 'axel-core-editable');
				xtdom.addEventListener(this._handle, 'click', function(ev) {
					_this.startEditing(ev);
				}, true);
			}	
			if (this.isOptional()) {
				xtdom.addEventListener(this._optCheckBox, 'click', function(ev) {
					_this.onToggleOpt(ev);
				}, true);
			}
		},
	
		/**
		 * Starts an edition process on *this* instance's device.
		 * 
		 * @param {DOMEvent}
		 *            aEvent The event triggering the start of an edition
		 *            process
		 */
		startEditing : function (aEvent) {
			var _doSelect = aEvent ? (!this._isModified || aEvent.shiftKey) : false;
			this._device.startEditing(this, aEvent, _doSelect);
		},
	
		/**
		 * Stops the edition process on the device
		 */
		stopEditing : function () {
			this._device.stopEditing(false, false);
		},

		/**
		 * Handler for the option checkbox, toggles the selection state.
		 */
		onToggleOpt : function (ev) {
			this._isOptionSet ? this.unset(true) : this.set(true);
		}
	}; /* END of _TextModel class */

	/* Base string for key */
	var _BASE_KEY = 'text';

	/* a counter used to generate unique keys */
	var _keyCounter = 0;

	return {

		/**
		 * <p>
		 * Creates a DOM model for the text editor. This DOM model represents
		 * the default content for the text editor. If a default content is
		 * specified in the template, the content is updated later, in the
		 * init() function.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aContainer the HTML node where to implant the editor
		 * @param {XTNode}
		 *            aXTUse the XTiger use node that caused this editor to be
		 *            implanted here
		 * @param {HTMLDocument}
		 *            aDocument the current HTML document (in the DOM
		 *            understanding of a "document") being processed
		 * @return {HTMLElement} The created HTML element
		 */
		createModel : function createModel (aContainer, aXTUse, aDocument) {
			var _handletag = aXTUse.getAttribute('handle');
			_handletag = _handletag ? _handletag : 'span';
			var _handle = xtdom.createElement(aDocument, _handletag);
			var _content = xtdom.createTextNode(aDocument, '');
			_handle.appendChild(_content);
			xtdom.addClassName(_handle, 'axel-core-on');
			var option = aXTUse.getAttribute('option');
			if (option) {
				var check = xtdom.createElement(aDocument, 'input');
				xtdom.setAttribute(check, 'type', 'checkbox');
				xtdom.addClassName(check, 'axel-option-checkbox');
				aContainer.appendChild(check);
			}
			aContainer.appendChild(_handle);
			return _handle;
		},

		/**
		 * <p>
		 * Creates the editor's from an XTiger &lt;xt:use&gt; element. This
		 * method is responsible to extract the default content as well as the
		 * optional parameters from the &lt;xt:use&gt; element. See the method
		 * implementation for the supported default content formats.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aHandleNode The HTML node used as handle by the created
		 *            editor
		 * @param {XMLElement}
		 *            aXTUse element The &lt;xt:use&gt; element that yields the
		 *            new editor
		 * @param {DOM
		 *            document} aDocument A reference to the containing DOM
		 *            document
		 * @return {_TetModel} A new instance of the _TextModel class
		 */
		createEditorFromTree : function createEditorFromTree (aHandleNode, aXTUse, aDocument) {
			var _data = xtdom.extractDefaultContentXT(aXTUse);
			if (_data && (_data.search(/\S/) == -1)) { // empty string
				_data = null;
			}
			var _model = new _TextModel(aHandleNode, aDocument);
			var _param = {};
			xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _param);
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);
			_model.init(_data, aXTUse.getAttribute('param'), 
			  aXTUse.getAttribute('option'), this.createUniqueKey());
			return _model;
		},

		/**
		 * <p>
		 * Creates an editor from a seed. The seed must carry the default data
		 * content as well as the parameters (as a string) information. Those
		 * infos are used to init the new editor.
		 * </p>
		 * 
		 * @param {Seed}
		 *            aSeed The seed from which the new editor is built
		 * @param {HTMLElement}
		 *            aClone The cloned handle where to implant the editor
		 * @param {DOM
		 *            Document} aDocument the document containing the editor
		 * @return {_TextModel} The new instance of the _VideoModel class
		 * 
		 * @see _TextModel#makeSeed()
		 */
		createEditorFromSeed : function createEditorFromSeed (aSeed, aClone, aDocument, aRepeater) {
			var _model = new _TextModel(aClone, aDocument);
			var _defaultData = aSeed[1];
			var _params = aSeed[2];
			var _option = aSeed[3];
			if (_params['filter'])
				_model = this.applyFilters(_model, _params['filter']);
			_model.init(_defaultData, _params, _option, this.createUniqueKey(), aRepeater);
			return _model;
		},
	
		/**
		 * Create a unique string. Each call to this method returns a different
		 * one.
		 * 
		 * @return {string} A unique key
		 */
		createUniqueKey : function createUniqueKey () {
			return _BASE_KEY + (_keyCounter++);
		}
	}
})();

xtiger.editor.Plugin.prototype.pluginEditors['text']
  = xtiger.util.filterable('text', xtiger.editor.TextFactory);
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */


/**
 * Class SelectFactory (static)
 * @class TextFactory
 * @version beta
 */
xtiger.editor.SelectFactory = (function SelectFactory() {  
	
	var _DEFAULT_param = {    
		select_dispatch : 'value' // alternative is 'display'
	};
	
	var _getDevice = function _getDevice(doc) {
		var devKey = 'popupdevice';
		var device = xtiger.session(doc).load(devKey);
		if (! device) {  // lazy creation
			device = new xtiger.editor.PopupDevice(doc); // hard-coded device for this model
			xtiger.session(doc).save(devKey, device);
		}
		return device;
	};

	/**
	 * Model class for a list selection editor (i.e. select one item in a list)
	 * There should be only one model class per application per plugin type
	 * @name _SelectModel
	 * @class _SelectModel
	 */
	var _SelectModel = function(aHandleNode, aDocument) {
		this.handle = aHandleNode;
		this.isOptional = undefined; // otherwise 'set' or 'unset' when it is optional
		this.isOptionSet = false; // iff this.isOptional is not null 
		this._data = null; // contains the model data (not the i18n version)   	
	};               
	
	/** @memberOf _SelectModel */
	_SelectModel.prototype = {

		//////////////////////////
		// Plugin API accessors
		//////////////////////////

		getParam : function (name)  {
			return this.param ? (this.param[name] || _DEFAULT_param[name]) : _DEFAULT_param[name];
		},

		isFocusable : function () {
			return false; // no keyboard control
		},

		getHandle : function () {
			return this.handle;
		}, 

		// Checks if an editor can do a given action
		can : function (action) {
			return false;
		},
		
		//////////////////////////
		// Plugin API (filterable)
		//////////////////////////
		
		init : function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) { 
			this.param = aParams; // i18nFilter needs it
			this.defaultScreenData = aDefaultData; // directly in screen (localized) form
			this.device = _getDevice(this.handle.ownerDocument);
			
			if (this.getParam('hasClass')) {
				xtdom.addClassName(this.handle, this.getParam('hasClass'));
			}   
			                             
			this._setData(this.i18nFilter(this.defaultScreenData, false), this.defaultScreenData);
			
			if (aOption) { // editor is optional
				var check = this.handle.previousSibling;
				this.isOptional = aOption.toLowerCase();
				if (this.isOptional == 'unset')
					this.isOptionSet = true; // Quirk to prevent unset to return immediately
				(this.isOptional == 'set') ? this.set(false) : this.unset(false);
			}
			this.awake ();	
		},   

		awake : function () {     
    		var _this = this;		    
			xtdom.addEventListener(this.handle, 'click', 
				function (ev) { _this.startEditing(ev) }, true);	                                 
			if (this.isOptional !== undefined) {
				var check = this.handle.previousSibling;
				xtdom.addEventListener (check, 'click', 
					function (ev) { _this.isOptionSet ? _this.unset(true) : _this.set(true); },
				    true);	
			}				
		},
		
		duplicate : function() {
		},
		
		load : function (point, dataSrc) { 	
			if (point !== -1) {
				var value = dataSrc.getDataFor(point);
				if (value) {
					this._setData(value);
				}
				this.set(false);			
			} else {           
				this.clear(false);
			}
		},        

		save : function (logger) { 
			if ((this.isOptional === undefined) || (this.isOptionSet)) {
				logger.write(this._data);
			} else {   
				logger.discardNodeIfEmpty();
			}
		},		 
		
		// N/A not focusable
		// focus : function() {
		// },

		startEditing : function(aEvent) {			
			var options = this.getParam('values');
			var _options = ('string' != typeof(options[0])) ? options[0] : options; // checks if values contains [i18n, values]
			this.device.startEditing(this, _options, this.i18nFilter(this._data, true), this.getHandle());
				// uses this._data as the mode is the i18n version of the label
		},
                                                     
		// Returns model data (not the i18n version)
		getData : function() {  
			var val = (this.getParam('select_dispatch') == 'value') ? this._data : this.i18nFilter(this._data, true);
			return val;
		},
		
		// N/A not focusable
		// unfocus : function() {
		// },
		                   
		// NOT CALLED FOR THIS EDITOR
		stopEditing : function() {
		},
            
		                  
		// aData is the universal value and not the localized one
		update : function(aData) {                            
			var val = (this.getParam('select_dispatch') == 'value') ? aData : this.i18nFilter(aData, false);
			if (val == this._data) { // no change
				return;
			}
			this._setData(val);
			this.set(true);
		},
		
		_setData : function (value, display) {  
			var d = display || this.i18nFilter(value, true);
			if (this.handle.firstChild)
				this.handle.firstChild.data = d;
			this._data =  value;
		},
		
		clear : function(doPropagate) { 
			this._setData(this.i18nFilter(this.defaultScreenData, false), this.defaultScreenData);
			if (this.isOptional !== undefined)
				this.unset(doPropagate);
		},

		set : function(doPropagate) {
			// propagates state change in case some repeat ancestors are unset
			if (doPropagate) {
				xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle());
			}
			if (this.isOptionSet) // Safety guard (defensive)
				return;
			this.isOptionSet = true;
			if (this.isOptional !== undefined) {                     
				var check = this.handle.previousSibling;
				check.checked = true;
				xtdom.replaceClassNameBy(this.handle, 'axel-option-unset', 'axel-option-set');
			}            
		},

		unset : function(doPropagate) { 
			if (!this.isOptionSet) // Safety guard (defensive)
				return;
			this.isOptionSet = false;
			if (this.isOptional !== undefined) {
				var check = this.handle.previousSibling;
				xtdom.replaceClassNameBy(this.handle, 'axel-option-set', 'axel-option-unset');
				check.checked = false;
			}			
		},

		remove : function() {
		},     
		
		//////////////////////////
		// Internal methods
		//////////////////////////
		
		// The seed is a data structure that should allow to "reconstruct" a cloned editor in a <xt:repeat>
		makeSeed : function () {
			if (! this.seed) { // lazy creation
				this.seed = [xtiger.editor.SelectFactory, this.defaultScreenData, this.param, this.isOptional];
			}
			return this.seed;
		},		
			
		// Handles popup menu selection
		onMenuSelection : function (value) {  
			if (this.getParam('select_dispatch') == 'value') {
				this.update(this.i18nFilter(value, false));   
			} else {                                          
				this.update(value);
			}
		},  

		// Converts i18n choices to non-i18n values
		// If xmlToLabel is true conversion occurs from XML value to displayed label
		// the other way around otherwise
		i18nFilter : function (value, xmlToLabel) {
			var selected = value;
			var options = this.getParam('values');
			if (! options) {
				throw({name: 'TemplateError', 
					   message: 'missing "values" attribute in xt:attribute element'});
			}
			if ('string' != typeof(options[0])) { // values contains [i18n, values]
				var src = options[xmlToLabel ? 1 : 0];
				var target = options[xmlToLabel ? 0 : 1];
				for (var i = 0; i < src.length; i++) { // translate i18n value to XML value
					if (value == src[i]) {
						if (i < target.length ) { // sanity check
							selected = target[i];
						} else {
							selected = "**Error**";
						}
						break;
					}
				}
			} 
			return selected;
		}
		
	}   

	return {     

		// creates the list <select> with <option> based on content of values 
		createModel : function (container, useNode, curDoc) {
			var viewNode = xtdom.createElement (curDoc, 'span');
			var t = xtdom.createTextNode(curDoc, '');
			viewNode.appendChild(t);
			xtdom.addClassName (viewNode, 'axel-core-editable');
			// manages optional editor
			var option = useNode.getAttribute('option');
			if (option) {
				var check = xtdom.createElement (curDoc, 'input');
				xtdom.setAttribute(check, 'type', 'checkbox');			       
				xtdom.addClassName(check, 'axel-option-checkbox');			       
				container.appendChild(check);     			
			}
			container.appendChild(viewNode);     
			return viewNode;
		},       

		createEditorFromTree : function (handleNode, xtSrcNode, curDoc) {
			var data = xtdom.extractDefaultContentXT(xtSrcNode); // @default
			var _model = new _SelectModel(handleNode, curDoc);
			
			// creates a parameter set, implements filter(s)
			var _param = {}; 
			xtiger.util.decodeParameters(xtSrcNode.getAttribute('param'), _param);
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);
				
			// completes the parameter set
			var values = xtSrcNode.getAttribute('values');
			var i18n = xtSrcNode.getAttribute('i18n');        
			var _values = values ? values.split(' ') : 'null';
			var _i18n = i18n ? i18n.split(' ') : false;
			_param['values'] = _i18n ? [_i18n,  _values] : _values;
			
			// init
			_model.init(data, _param, xtSrcNode.getAttribute('option'), 'nokey'); 
				// FIMXE: add unique key
				
			return _model;
		},                          

		createEditorFromSeed : function (aSeed, aClone, aDocument, aRepeater) {
			var _model = new _SelectModel(aClone, aDocument);
			var _defaultScreenData = aSeed[1];
			var _param = aSeed[2];
			var _option = aSeed[3];
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);
			_model.init(_defaultScreenData, _param, _option, 'nokey', aRepeater);
			return _model;		
		}  		
	}
	
})();

xtiger.editor.Plugin.prototype.pluginEditors['select']
  = xtiger.util.filterable('select', xtiger.editor.SelectFactory);
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Antoine Yersin, Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */        
 
 ///////////////////////////////////////////////
 // First Part: Link Editor Factory and Model //
 ///////////////////////////////////////////////

/**
 * The LinkFactory object (singleton) acts as a factory for the link editor. 
 * It is responsible to create both the DOM model, the model class 
 * and the editing device(s). The link editor is used to edit in-line links.
 * 
 * @class LinkFactory
 */
xtiger.editor.LinkFactory = (function LinkFactory () {
	/*
	 * Devices' factories
	 */
	// var _deviceFactories = {};

	/**
	 * <p>LinkModel class (shadow class)</p>
	 * 
	 * <p>This class implements the data model for the link editor. It supports operation for data loading
	 *and serializing, event handling to switch to the actual editing process (handled in the LinkEditor
	 *object).</p>
	 *
	 * <p>This class is only instanciable through the dedicated factory.</p>
	 * 
	 * @class _LinkModel
	 * @name _LinkModel
	 * @constructor
	 * 
	 * @param {HTMLElement} aHandleNode The editor's handle (usually an &lt;a&gt; element)
	 * @param {DOM Document} aDocument The document that contains <code>this</code> editor
	 */
	var _LinkModel = function (aHandleNode, aDocument) {

		/*
		 * Default parameters for the link editor. Parameters meaning and possible values are documented below.
		 */
		var _DEFAULT_PARAMS = {
				defaultText: 'enter link\'s text here', /* {string} default text */
				defaultUrl: 'http://',
				defaultDevice: 'lens', /* {string} name of the device to use */
				wrapper: 'togglewrapper', /* {string} name of the field wrapper to use */
				linkRefTagName: "linkRef", /* {string} The label used by the load/save method for the url info */
				linkTextTagName: "linkText", /* {string} The label used by the load/save method for the text info */
				trigger: "click",
				padding: '10'
		};

		/**
		 * The HTML node used as handle by the editor. Usually it is
		 *a <span> element. The handle is created by the editor's factory
		 *prior to the instancation of *this* object
		 */
		this._handle = aHandleNode;
		
		/**
		 * The data handled by *this* model
		 */
		this._data = {
				text: _DEFAULT_PARAMS['defautText'],
				url: _DEFAULT_PARAMS['defautUrl']
		}
		
		/**
		 * The default data as specified in the xt:use node
		 */
		this._defaultData = this._data;
		
		/**
		 * A reference to the DOM document containing the editor
		 */
		this._document = aDocument;

		/**
		 * The actual parameters used by *this* instance
		 */
		this._params = _DEFAULT_PARAMS;
		
		/**
		 * If true, the editor is optional
		 */
		this._isOptional = false;
		
		/**
		 * If true, the optional editor is set. Irrelevant if not optional
		 */
		this._isOptionSet = false;
		
		/**
		 * The HTML checkbox for optional editors. Sets in init() method
		 */
		this._optCheckBox;
		
		/**
		 * The device object used to edit this model. It is sets in init() function
		 */
		this._device = null;
		
		/**
		 * A stored seed for this model
		 */
		this._seed = null;
		
		/**
		 * if true, the model's data was modified and is no longer equals to the
		 * default data.
		 */
		this._isModified = false;

		/**
		 * A unique string that identifies *this* instance
		 */
		this._uniqueKey;

		/* Call the create method for delegation purposes */
		this.create();
	};                   
	
	/** @memberOf _LinkModel */
	_LinkModel.prototype = {

			/**
			 * 
			 */
			_setData : function (aText, aUrl) {
				this._data = {text: aText, url: aUrl};
				this._handle.firstChild.data = aText; /* sets the handle's text */
			},

			/**
			 * This method is called at the instance's creation time. It may serves
			 * as a "hook" to add a custom behavior by the means of the delegation
			 * pattern.
			 */
			create : function () {
				// nope
			},
			
			/**
			 * Initialization function, called by the model's factory after object's instanciation.
			 *Cares to sets the default content, to parse and sets the various parameters and to call the
			 *awake() method.
			 *
			 * @param {object} aDefaultData The default data (url and text) given in the form of an hash
			 * @param {string | object} aParams Either the parameter string from the <xt:use> node or the parsed
			 *parameters object from the seed
			 * @param {string} aOption If the parameter is not null, the editor is optional. If its value equals "set", the
			 *editor is set by default
			 */
			init: function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
				if (aParams) { /* parse parameters */
					if (typeof(aParams) == 'string')
						xtiger.util.decodeParameters(aParams, this._params);
					else if (typeof(aParams) == 'object')
						this._params = aParams;
				}
				if (aDefaultData && aDefaultData.text && aDefaultData.url) { /* sets up initial content */
					this._setData(aDefaultData.text, aDefaultData.url);
					this._defaultData = aDefaultData;
				}
				if (aOption) { /* the editor is optional */
					this._isOptional = true;
					this._optCheckBox = this._handle.nextSibling;
					(aOption == 'set') ? this.set() : this.unset();
				}
				this._uniqueKey = aUniqueKey;
				var _deviceFactory = this._params['device'] ? 
						xtiger.factory(this._params['device']) :
						xtiger.factory(this._params['defaultDevice']);
				this._device = _deviceFactory.getInstance(this._document);
				this.awake();
			},
			
			/**
			 * Creates (lazy creation) an array to "seed" *this* model. Seeding
			 * occurs in a repeat context. 
			 * 
			 * @return
			 */
			makeSeed : function () {
				if (!this._seed)
					this._seed = [ xtiger.editor.LinkFactory, this._defaultData,
						this._params, this._isOptional ];
				return this._seed;
			},
			
			/**
			 * <p>
			 * Returns true if *this* object is able to perform the function whose
			 * name is given as parameter.
			 * </p>
			 * 
			 * <p>
			 * This function implements the can/execute delegation pattern, this
			 * pattern allows a filter to easily extend the instance API with
			 * specific methods. Those methods are called from various devices such
			 * as the text device.
			 * </p>
			 * 
			 * @param {string}
			 *            aFunction The name of the function
			 * @return {boolean} True if *this* object as a function property with
			 *         the given name, false otherwise.
			 */
			can : function (aFunction) {
				return typeof this[aFunction] == 'function';
			},

			/**
			 * <p>
			 * Calls on *this* instance the function whose name is given as
			 * paramter, giving it the provided parameter (may be null). Returns the
			 * result.
			 * </p>
			 * 
			 * <p>
			 * This function implements the can/execute delegation pattern, this
			 * pattern allows a filter to easily extend the instance API with
			 * specific methods. Those methods are called from various devices such
			 * as the text device.
			 * </p>
			 * 
			 * @param {string}
			 *            aFunction The name of the function
			 * @param {any}
			 *            aParam A parameter whose type is not constrained
			 * @return {any} The return value of the called function.
			 */
			execute : function (aFunction, aParam) {
				return this[aFunction](aParam);
			}, 

			/* XML data "getter/setters" */
			
			/**
			 * Loading function for setting the data stored in this model from an XML
			 *data source.
			 *
			 * @param {Point} aPoint A point in the data source
			 * @param {DOMDataSource} aDataSrc The data source to load into the editors
			 */
			load: function (aPoint, aDataSrc) {
				var _url, _text;
				try {
					_url = aDataSrc.getDataFor(aDataSrc.getVectorFor('linkRef', aPoint));
					_text = aDataSrc.getDataFor(aDataSrc.getVectorFor('linkText', aPoint));
				}
				catch (_err) {
					tiger.cross.log('warning', 'Unable to load the link editor with the following content :\n text=' + _text + ', url=' + _url);
				}
				if (this.isOptional()) {
					if (_url || _text)
						this.set();
					else
						this.unset();
				}
				// If the point didn't hold url or text values, use the default ones
				if (!_url)
					_url = this._defaultData.url;
				if (!_text)
					_text = this._defaultData.text;
				this._setData(_text, _url);
			},

			/**
			 * <p>Serialization function for saving the edited data to a logger. It is assumed that
			 *the XML node representing the label is produced by the caller function.</p>
			 *
			 * <p>The default behavior is to produced expanded nodes to represent the link. If the
			 *default parameters are kept untouched, the produced XML looks like :</p>
			 *	
			 * 	&lt;linkRef&gt;"the url of the link"&lt;/linkRef&gt; <br/>
			 * 	&lt;linkText&gt;"the text of the link"&lt;/linkText&gt;
			 * 
			 * <p>A different behavior can be obtained by superseding this method by the means of a filter. Note that
			 *would most probably mean the redefinition of the load() method as well.</p>
			 * 
			 * @param {Logger} aLogger A logger object supporting the write() method
			 * @see #load()
			 */
			save: function (aLogger) {
				if (this.isOptional() && !this._isOptionSet) {
					aLogger.discardNodeIfEmpty();
					return;
				}
				var _data = this.getData();
				aLogger.openTag(this._params['linkRefTagName']);
				aLogger.write(_data.url);
				aLogger.closeTag(this._params['linkRefTagName']);
				aLogger.openTag(this._params['linkTextTagName']);
				aLogger.write(_data.text);
				aLogger.closeTag(this._params['linkTextTagName']);
			},

			/* Editing facilities */
			
			/**
			 * Updates the model with the given data.
			 * 
			 * @param {Object} aData The new data to set
			 */
			update: function (aData) {
				if (aData.text == this._data.text && aData.url == this._data.url)
					return; // Do nothing if nothing was changed
				
				if (!aData || (aData.text == null && aData.url == null)) {
					this.clear(true);
					return;
				}
				
				this._setData(aData.text, aData.url);
				this._isModified = true;

				// Autoset
				this.set(true); 
			},
			
			/**
			 * Resets the editor into its default state.
			 */
			clear: function (doPropagate) {
				this._setData(this._defaultData.text, this._defaultData.url);
				this._isModified = false;
				if (this.isOptional() && this.isSet())
					this.unset(doPropagate);
			},
			
			/**
			 * Gets the data from the handle, that is, from the HTML element(s) that stores it.
			 * 
			 * @return {Object} A Hash containing two fields, "url" and "data".
			 */
			getData: function () {
				return this._data;
			},
			
			/**
			 * 
			 * @return
			 */
			getDefaultData: function () {
				return this._defaultData;
			},
			
			/*
			 * Other function
			 */
			
			/**
			 * Returns the model's handle. Usually this is a span element
			 * 
			 * @return {HTMLElement} The model's handle
			 */
			getHandle: function () {
				return this._handle;
			},
			
			/**
			 * Getter for *this* instance owner document.
			 * 
			 * @return {DOMDocument} The DOM document holding *this* model
			 */
			getDocument : function () {
				return this._document;
			},
			
			/**
			 * Returns the parameters associated with the given key
			 * 
			 * @param {string} aKey The name of the parameter
			 * @return {any} The parameter's value 
			 */
			getParam: function (aKey) {
				return this._params[aKey];
			},

			/**
			 * Returns the unique key associated with *this* instance. The returned
			 * key is unique within the whole document.
			 * 
			 * @return {string} The unique key
			 */
			getUniqueKey : function () {
				return this._uniqueKey;
			},

			/**
			 * Returns true if the model contains data which is no longer the defaut
			 * data, either because a load() call modified it or because an user's
			 * interaction has occured.
			 * 
			 * @return {boolean} True if the data was changed, false otherwise.
			 */
			isModified : function () {
				return this._isModified;
			},
			
			/**
			 * Sets the isModified flag. Useless unless the update or load methods
			 * are filtered by a filter which need to control the isModified
			 * behavior.
			 * 
			 * @param {boolean}
			 *            isModified The new value for the isModified flag
			 */
			setModified : function (isModified) {
				this._idModified = isModified;
			},
			
			/*
			 * OPTIONAL EDITOR MANAGEMENT
			 */
			
			/**
			 * Returns true if the editor is optional.
			 * 
			 * @return {boolean}
			 */
			isOptional: function () {
				return this._isOptional;
			},

			/**
			 * Returns the optionality status of *this* model, that is, if it
			 * is set or unset. Only relevant if the model IS optional
			 * 
			 * @return {boolean} True if the model is optional and set, false
			 *         otherwise
			 *   
			 * @see #isOptional()
			 */
			isSet : function () {
				return this._isOptional && (this._isOptionSet ? true : false);
			},
			
			/**
			 * Sets the optional state to "set".
			 * 
			 * @param {boolean}
			 *            doPropagate If true, iters on parent repeat to set
			 *            them.
			 */
			set: function (doPropagate) {
				if (doPropagate) {
					xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle(true));
					xtdom.removeClassName(this._handle, 'axel-repeat-unset'); // fix if *this* model is "placed" and the handle is outside the DOM at the moment
				}
				if (this._isOptionSet) // Safety guard (defensive)
					return;
				this._isOptionSet = true;
				if (this._isOptional) {
					xtdom.removeClassName(this._handle, 'axel-option-unset');
					xtdom.addClassName(this._handle, 'axel-option-set');
					this._optCheckBox.checked = true;
				}
			},

			/**
			 * Sets the optional state to "unset".
			 */
			unset: function () {
				if (!this._isOptional) // Safety guard (defensive)
					return;
				xtdom.removeClassName(this._handle, 'axel-option-set');
				xtdom.addClassName(this._handle, 'axel-option-unset');
				this._isOptionSet = false;
				this._optCheckBox.checked = false;
			},
			
			/*
			 * FOCUS MANAGEMENT (for tab navigation)
			 */
			
			/**
			 * Returns true if the model's editor is able to be put into a chain of
			 * focus. Chains of focus are a list of editor that can be accessed by
			 * iterating with the "tab" key (this feature is better known as the
			 * "tab-navigation" feature).
			 * 
			 * @return {boolean} True if the model should be put into a chain of
			 *         focus, false otherwise.
			 */
			isFocusable: function () {
				return true;
			},
			
			/**
			 * Gives the focus to *this* instance. Called by the tab navigation
			 * manager.
			 */
			focus: function () {
				this.startEditing(null);
			},
			
			/**
			 * Takes the focus away from *this* instance. Called by the tab
			 * navigation manager.
			 */
			unfocus: function () {
				this.stopEditing();
			},

			/* Events management */
			/**
			 * Registers event handlers for the handle node
			 */
			awake: function () {
				var _this = this; // closure
				if (this.isOptional()) {
					xtdom.addEventListener (this._optCheckBox, 'click', function (ev) {_this.onToggleOpt(ev);}, true);
				}
				xtdom.addEventListener (this._handle, this._params['trigger'], function (ev) {_this.startEditing(ev);}, true);
			},
			
			/**
			 * Event handler to manage a user's click on the edit button. Starts an edit action. If
			 * the editor is optional and unset, do nothing.
			 * 
			 * @param {Event} aEvent A DOM event.
			 */
			startEditing: function (aEvent) {
				var _doSelect = aEvent ? (!this._isModified || aEvent.shiftKey) : false;
				this._device.startEditing(this, 'linkLensWrapper', _doSelect);
				if (aEvent) {
					xtdom.stopPropagation(aEvent);// otherwise stopEditing gets called on IE
				}
			},
			
			/**
			 * Stops the edition process on the device
			 */
			stopEditing : function () {
				this._device.stopEditing();
			},
			
			/**
			 * Handler for the option checkbox, toggles the selection state.
			 */
			onToggleOpt: function (ev) {
				this._isOptionSet ? this.unset() : this.set();
			}
	}; /* end of _LinkModel class */

	/* Base string for key */
	var _BASE_KEY = 'link';

	/* a counter used to generate unique keys */
	var _keyCounter = 0;
	
	return { /* Public members for the LinkModelFactory object */
		
		/**
		 * Creates a model instance for the link editor. By default the model is a &lt;span&gt;
		 *HTML element displaying the link's anchor.
		 * 
		 * @param {HTMLElement} aContainer the HTML node where to implant the editor
		 * @param {XTNode} aXTUse the XTiger use node that caused this editor to be implanted here
		 * @param {HTMLDocument} aDocument the current HTML document (in the DOM understanding of a "document") being processed
		 * @return {HTMLElement}  The created HTML element
		 */
		createModel: function createModel (aContainer, aXTUse, aDocument)
		{
			var _h = xtdom.createElement(aDocument, 'span'); /* Creates the handle */
			xtdom.addClassName (_h , 'axel-core-on');
			xtdom.addClassName (_h, 'axel-core-editable');
			xtdom.addClassName (_h, 'axel-link-handle');
			_h.appendChild(xtdom.createTextNode(aDocument, ''));
			aContainer.appendChild(_h);
			var _optional = aXTUse.getAttribute('option');
			if (_optional) {
				var _checkbox = xtdom.createElement (aDocument, 'input');
				xtdom.setAttribute(_checkbox, 'type', 'checkbox');			       
				xtdom.addClassName(_checkbox, 'axel-option-checkbox');			       
				aContainer.appendChild(_checkbox);     			
			}
			return _h;
		},
		
		/**
		 * <p>Creates the editor's from an XTiger &lt;xt:use&gt; element. This method
		 *is responsible to extract the default content as well as the optional parameters
		 *from the &lt;xt:use&gt; element. See the method implementation for the supported
		 *default content formats.</p>
		 *
		 *@param {HTMLElement} aHandleNode The HTML node used as handle by the created editor
		 *@param {XMLElement} aXTUse element The &lt;xt:use&gt; element that yields the new editor
		 *@param {DOM document} aDocument A reference to the containing DOM document
		 *@return {_LinkModel} A new instance of the LinkModel class
		 */
		createEditorFromTree: function createEditorFromTree (aHandleNode, aXTUse, aDocument) {
			var _model = new _LinkModel(aHandleNode, aDocument);
			var _defaultData;
			var _aXTContent = aXTUse.childNodes; // FIXME awful parsing function. does not care about irrelevant text nodes.
			switch(_aXTContent.length) {
			case 2: /* <linkText>blah blah</linkText><linkRef>http://...</linkRef> */
				if (_aXTContent[0].nodeType == xtdom.ELEMENT_NODE
						&& _aXTContent[1].nodeType == xtdom.ELEMENT_NODE
						&& _aXTContent[0].nodeName == 'linkText'
						&& _aXTContent[1].nodeName == 'linkRef')
					_defaultData = {
						text: _aXTContent.childNodes[0].nodeValue,
						url: _aXTContent.childNodes[1].nodeValue 
					};
				break;
			case 1:
				if (_aXTContent[0].nodeType == xtdom.ELEMENT_NODE && (/^a$/i).test(_aXTContent[0].nodeName)) {
					_defaultData = {
							text: _aXTContent[0].firstChild.nodeValue,
							url: _aXTContent[0].getAttribute('href')
					};
				} else if (_aXTContent[0].nodeType == xtdom.TEXT_NODE) {
					_defaultData = {
							text: _aXTContent[0].nodeValue,
							url: 'http://'
					};
				}
				break;
			default:
				_defaultData = {
					text: 'link',
					url: 'http://'
				}
			}
			var _params = {};
			xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _params);
			if (_params['filter'])
				_model = this.applyFilters(_model, _params['filter']);
			_model.init(_defaultData, aXTUse.getAttribute('param'), aXTUse.getAttribute('option'), this.createUniqueKey());
			return _model;
		},
		
		/**
		 * <p>Creates an editor from a seed. The seed must carry the default data content as well
		 *as the parameters (as a string) information. Those infos are used to init the new editor.</p>
		 * 
		 * @param {Seed} aSeed The seed from which the new editor is built
		 * @param {HTMLElement} aClone The cloned handle where to implant the editor
		 * @param {DOM Document} aDocument the document containing the editor
		 * @return {_LinkModel} The new instance of the _linkModel class
		 * 
		 * @see _linkModel#makeSeed()
		 */
		createEditorFromSeed: function createEditorFromSeed (aSeed, aClone, aDocument, aRepeater) {
			var _model = new _LinkModel(aClone, aDocument);
			var _defaultData = aSeed[1];
			var _param = aSeed[2];
			var _option = aSeed[3];
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);
			_model.init(_defaultData, _param, _option, this.createUniqueKey(), aRepeater);
			return _model;
		},
		 	
		/**
		 * Create a unique string. Each call to this method returns a different
		 * one.
		 * 
		 * @return {string} A unique key
		 */
		createUniqueKey : function createUniqueKey () {
			return _BASE_KEY + (_keyCounter++);
		}
	};
})();

xtiger.editor.Plugin.prototype.pluginEditors['link'] 
  = xtiger.util.filterable('link', xtiger.editor.LinkFactory);

//////////////////////////////////////////////////
// Second Part: Len Wrapper for the Link Editor //
//////////////////////////////////////////////////

/**
 * Lens wrapper for the edition of links. Contains two editable fields and a "go" button that
 *follows the link.
 *
 * @class _LinkLensWrapper
 */
var _LinkLensWrapper = function (aDocument) {
	/* The wrapped HTML device */
	this._handle;
	
	/* The handle to restore when releasing */
	this._handleToRestore;
	
	/* the document containing the wrapper */
	this._document = aDocument;
	
	/* true if the focus is in one of the fields */
	this._isFocused = false;
	
	this._build();
};    

_LinkLensWrapper.prototype = {
		
		/**
		 * Initializes the wrapper. Creates the HTML elements and sets their style.
		 */
		_build: function () {
			this._topDiv = xtdom.createElement(this._document, 'div');
			xtdom.addClassName(this._topDiv, 'axel-lens-container');
			xtdom.addClassName(this._topDiv, 'axel-lens-containerstyle');
			this._topDiv.style.display = 'block';
			this._upperP = xtdom.createElement(this._document, 'p');
			with (this._upperP) {
				style['margin'] = '0 0 15px 0';
				style['padding'] = '0px';
				style['width'] = '100%';
			}
			this._anchorInput = xtdom.createElement(this._document, 'input');
			with (this._anchorInput) {
				type = 'text';
			}
			xtdom.addClassName(this._anchorInput, 'axel-link-handle'); // use same class than the model's handle
			this._upperP.appendChild(this._anchorInput);
			this._topDiv.appendChild(this._upperP);
			this._lowerP = xtdom.createElement(this._document, 'p');
			with (this._lowerP) {
				style['margin'] = '0px';
				style['padding'] = '0px';
				style['width'] = '100%';
			}
			this._urlInput = xtdom.createElement(this._document, 'input');
			with (this._urlInput) {
				style['width'] = '75%';
			}
			this._goButtonLink = xtdom.createElement(this._document, 'a');
			with (this._goButtonLink) {
				href = ''; // is set when grabing
				target = '_blank';
				style['margin'] = '0 10px';
				style['width'] = '25%';
			}
			this._goButton = xtdom.createElement(this._document, 'img');
			with (this._goButton) {
				src = xtiger.bundles.link.gotoURL;
				style.height = '20px';
				style.width = '30px';
				style.display = 'inline';
				style['verticalAlign'] = 'bottom';
			}
			this._goButtonLink.appendChild(this._goButton);
			this._lowerP.appendChild(this._urlInput);
			this._lowerP.appendChild(this._goButtonLink);
			this._topDiv.appendChild(this._lowerP);   
		}, 
		
		/**
		 * Sets the input fields value. If the given argument is null, the field
		 *is kept in its current state. Use reset() to clear the fields.
		 *
		 * @param {string} aText The text used by the anchor
		 * @param {string} aUrl The url of the link
		 * 
		 * @see #reset
		 */
		_setData: function (aText, aUrl) {
			if (aText && typeof(aText) == 'string')
				this._anchorInput.value = aText;
			if (aUrl && typeof(aUrl) == 'string') {
				this._urlInput.value = aUrl;
				this._goButtonLink.href = aUrl;
			}
		},		 
		
		/**
		 * Returns the wrapped device.
		 * 
		 * @return {HTMLElement} The wrapped device
		 */
		getHandle: function () {
			return this._topDiv;
		},		    
		
		/**
		 * Grabs the wrapper with the given device.
		 * 
		 * @param {Device} aDevice The device grabbing the wrapper
		 * @param {boolean} aDoSelect Selects the first input field
		 */
		grab: function (aDevice, aDoSelect, aPadding) {
			this._currentDevice = aDevice;
			var _data = this._currentDevice.getCurrentModel().getData();
			this._setData(_data.text, _data.url);
			var _handle = this._currentDevice.getCurrentModel().getHandle();			
			this._topDiv.style.padding = aPadding[0] + 'px ' + aPadding[1] + 'px';
			var _this = this;
			xtdom.addEventListener(this._anchorInput, 'focus', function (ev) {_this.onFocus(ev)}, false);
			xtdom.addEventListener(this._urlInput, 'focus', function (ev) {_this.onFocus(ev)}, false);
			xtdom.addEventListener(this._anchorInput, 'blur', function (ev) {_this.onBlur(ev)}, false);
			xtdom.addEventListener(this._urlInput, 'blur', function (ev) {_this.onBlur(ev)}, false);
			// adds principal input field margins and border to the padding			
			// FIXME: does not work - instead we use 4 which is empirical
			// var mtop = xtiger.editor.LayoutManager.prototype._getDistanceFor(this._urlInput, 'margin-top');
			// var btop = xtiger.editor.LayoutManager.prototype._getDistanceFor(this._urlInput, 'border-width-top');
			return [aPadding[0], aPadding[1] + 4];	 
		},      
		          
		// Terminates the wrapper installation after the lens has been made visible
		activate: function(aDevice, doSelectAll) {
			if (doSelectAll) {
				xtdom.focusAndSelect(this._anchorInput);
			} else { // simply focus
		    this._anchorInput.focus();
			}
		},
		
		/**
		 * Releases the wrapper, restores the handle
		 */
		release: function () {
			this._isFocused = false;
			xtdom.removeElement(this._topDiv);
			this._currentDevice = null;
		},
		
		/**
		 * Toggle the focus between the fields
		 */
		toggleField: function () {                 
			if (this._isFocused) {
				if (this._focusedField == this._anchorInput) {
					this._anchorInput.blur();
					xtdom.focusAndMoveCaretTo(this._urlInput, this._urlInput.value.length);
				} else {
					this._urlInput.blur();
					xtdom.focusAndMoveCaretTo(this._anchorInput, this._anchorInput.value.length);
				}
			}
		},
		
		/**
		 * Returns the data currently hold by the wrapper.
		 * 
		 * @return {Object} The data fields as an hash object
		 */
		getData: function () {
			return {
				url: this._urlInput.value,
				text: this._anchorInput.value
			}
		},
		
		isFocusable: function () {
			return true;
		},
		
		/**
		 * Handler for the bluring of input fields. Saves their state and updates
		 *the link button's url accordingly.
		 *
		 * @param {Event} ev The event that triggers this handler
		 */
		onBlur: function (ev) {
			var _target = xtdom.getEventTarget(ev);
			if (_target == this._urlInput)
				this._goButtonLink.href = this._urlInput.value;
			this._isFocused = false;
			this._focusedField = null;
			this._currentDevice.keepAlive(false);  
		},
		
		/**
		 * Handler for the focusing in an input field. Toggles the wrapper's state such as it
		 *does not disappear when the mouse leave it.
		 *
		 * @param {Event} ev The event that triggers this handler
		 */
		onFocus: function (ev) {
			this._isFocused = true;
			this._currentDevice.keepAlive(true);
			this._focusedField = xtdom.getEventTarget(ev);
		}
}; // End of wrapper class

xtiger.resources.addBundle('link', 
		{ 'gotoURL' : 'goto.png' } );

xtiger.factory('lens').registerWrapper('linkLensWrapper', function (aDocument) {return new _LinkLensWrapper(aDocument)});
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * 
 * NOTE : This editor is written using my own naming conventions and terminology. Please note the following points :
 * - SomeModel becomes SomeFactory
 * - SomeEditor becomes SomeModel (and is a shadow class)
 * - SomeDevice may become SomeEditor (finally not. A device stays a device. An editor is the combinaision of the
 * mentionned items.)
 */

/**
 * RichTextFactory object (static)
 * 
 * This object acts as a factory for the link editor. It is responsible to
 * create both the DOM model, the model class and the editing device(s).
 * 
 * This editor is used to edit rich text, that is, editable HTML content.
 * 
 * @class RichTextFactory
 * @version beta
 */
xtiger.editor.RichTextFactory = (function RichTextFactory() {

	/**
	 * _RichTextModel class (shadow class)
	 * 
	 * This class implements a model for handling and displaying the data of a
	 * rich text editor. It is only instanciable trough its factory method holds
	 * in the RichTextFactory object.
	 * 
	 * @class _RichTextModel
	 * @name _RichTextModel
	 * @constructor
	 * @param {HTMLElement}
	 *            aHandleNode The editor's handle (usually an &lt;div&gt;
	 *            element)
	 * @param {DOM
	 *            Document} aDocument The document that contains
	 *            <code>this</code> editor
	 */
	var _RichTextModel = function(aHandleNode, aDocument) {

		/*
		 * Default parameters for the link editor. Parameters meaning and
		 * possible values are documented below.
		 */
		var _DEFAULT_PARAMS = {
				defaultDevice: 'lens',
				trigger: "click",
				padding: '10'
		};

		/**
		 * The HTML node used as handle by the editor. Usually it is a <span>
		 * element. The handle is created by the editor's factory prior to the
		 * instancation of *this* object
		 */
		this._handle = aHandleNode;

		/**
		 * The data handled by *this* model
		 */
		this._data = {}
		
		/**
		 * Filter used at update() call time
		 */
		this._updateFilter = ['br', 'p', 'span', 'i', 'u', 'b', 'strong', 'em', 'a', 'font'];

		/**
		 * The default data as specified in the xt:use node
		 */
		this._defaultData = this._data;

		/**
		 * A reference to the DOM document containing the editor
		 */
		this._document = aDocument;

		/**
		 * The actual parameters used by *this* instance
		 */
		this._params = _DEFAULT_PARAMS;

		/**
		 * If true, the editor is optional
		 */
		this._isOptional = false;

		/**
		 * If true, the optional editor is set. Irrelevant if not optional
		 */
		this._isOptionSet = false;

		/**
		 * The HTML checkbox for optional editors. Sets in init() method
		 */
		this._optCheckBox;

		/**
		 * The device object used to edit this model. It is sets in init()
		 * function
		 */
		this._device = null;
		
		/**
		 * A stored seed for this model
		 */
		this._seed = null;
		
		/**
		 * if true, the model's data was modified and is no longer equals to the
		 * default data.
		 */
		this._isModified = false;

		/**
		 * A unique string that identifies *this* instance
		 */
		this._uniqueKey;

		/* Call the create method for delegation purposes */
		this.create();

	};
	/** @memberOf _RichTextModel */
	_RichTextModel.prototype = {
		
			/**
			 * Updates the model with the given data
			 * 
			 * @param {string} aData A inner HTML string to apply to the handle
			 * 
			 * @throw Exception if the argument does not contains vaild HTML
			 */
			_setData: function (aData) {
				this._handle.innerHTML = aData;
				this._treeFilter(this._handle, this._updateFilter); // Filters unwanted stuff
				this._removeTrailingBRNodes(this._handle, true);
			},
				
			/**
			 * <p>
			 * Sanitize an attribute content to ensure a valid XML
			 * </p>
			 * 
			 * @param {string} aString
			 * @return {string}
			 * @private
			 */
			_sanitizeAttribute: function (aString) {
				var _san = aString.replace(/"/g, '\'');
				_san = _san.replace(/&(?!\w{3,6};)/g, '&amp;'); // replaces & if not an entity
				return _san;
			},
			
			/**
			 * <p>
			 * Filters a node content, given a filter on to form of an array of
			 * authorized elements. If a node's child doesn't match an authorized
			 * element, it's content is inlined (i.e: inserted as sibling of the
			 * filtered node)
			 * </p>
			 * 
			 * @param {HTMLElement}
			 *            aNode an HTML node to filter. Note that only its content
			 *            is filtered, not the node itself
			 * @param {string[]}
			 *            aFilter a list of authorized tag name
			 * @param {boolean}
			 *            doRecursion Optional parameter (default=true)
			 */
			_treeFilter: function (aNode, aFilter, doRecursion) {
				if (!aNode || !aFilter)
					return aNode;
				if (doRecursion !== false)
					doRecursion = true;
				try {
					var _cur = aNode.firstChild;
					while (_cur) {
						var _next = _cur.nextSibling; // saves "next" reference as _cur may be deleted
						if (_cur.nodeType == xtdom.ELEMENT_NODE) {
							// first, recurse (if necessary) on the current node children
							if (doRecursion)
								this._treeFilter(_cur, aFilter, doRecursion);
							// then take care of the current node itself
							var _isFound = false;
							for (var _f in aFilter)
								if ((aFilter[_f]).toLowerCase() == (_cur.nodeName).toLowerCase()) {
									_isFound = true;
									break;
								}
							if (!_isFound) {
								var _curChild = _cur.firstChild;
								var _lastChild = _curChild;
								while (_curChild) { // move current node's children and current node siblings
									var _nextChild = _curChild.nextSibling;
									aNode.insertBefore(_curChild, _cur);
									_curChild = _nextChild;
								}
								xtdom.removeElement(_cur); // now get rid of old element
							}
						}
						_cur = _next;
					}
				} catch (err) {
					console.warn('(richtext.js: ' + err.lineNumber + ') Problem in tree conversion: ' + err.message);
					return aNode;
				}
			},
			
			/**
			 * Remove all trailing "br" nodes in the children of a given node.
			 * 
			 * @param {DOMElement} aNode The node to modify
			 * @param {boolean} isRecursive If true, the algorithm also recurse on the last non-br node of the given node. 
			 * @return {boolean} Tre if th node was modified, false otherwise.
			 */
			_removeTrailingBRNodes: function (aNode, isRecursive) {
				if (!aNode || !aNode.lastChild)
					return false;
				var _modified = false;
				for (var _i = aNode.childNodes.length - 1; _i >= 0 ; _i--) {
					if (aNode.childNodes[_i].nodeName.toLowerCase() == 'br') {
						xtdom.removeElement(aNode.childNodes[_i]);
						_modified = true;
					}
					else {
						if (isRecursive === true)
							return this._removeTrailingBRNodes(aNode.childNodes[_i], true);
						return _modified;
					}
				}
			},
	
			/**
			 * Recursive function to save data into a logger. The function takes as
			 * argument the parent node of the nodes to serialize. It iterates on
			 * the children and recursively call itself on them.
			 * 
			 * @param {HTMLElement}
			 *            aNode An HTML element node whose children will be
			 *            serialized. Note that the node itself <em>wont</em> be
			 *            serialized
			 * @param {Logger}
			 *            aLogger A logger object where to write the serialization
			 *            result
			 * 
			 * @private
			 */
			_saveData : function(aNode, aLogger) {
				var _cur = aNode.childNodes[0];
				var _hasElement = false;
				var _doNext = true;
				while (_cur) {
					_doNext = true;
					switch (_cur.nodeType) {
					case xtdom.ELEMENT_NODE:
						_hasElement = true;
						var _sName = _cur.nodeName;
						var _styleAttr = null;
						switch(_sName) {
						case 'b':
						case 'B':
						case 'STRONG':
							_sName = 'span';
							_styleAttr = 'font-weight: bold';
							break;
						case 'i':
						case 'I':
						case 'EM':
							_sName = 'span';
							_styleAttr = 'font-style: italic';
							break;
						case 'u':
						case 'U':
							_sName = 'span';
							_styleAttr = 'text-decoration: underline';
							break;
						}
						aLogger.openTag(_sName.toLowerCase());
						if (_cur.attributes.length) {
							// WARNING the attribute array is AWFULLY supported on IE, but I still not have found another way to lists all declared attributes of a node
							for ( var _i = 0; _i < _cur.attributes.length; _i++) {
								if (_cur.attributes[_i].nodeName == '_moz_dirty' ||
										_cur.attributes[_i].nodeName == 'xmlns' ||
										(!_cur.attributes[_i].specified && xtiger.cross.UA.IE))
									continue;
								aLogger.openAttribute(_cur.attributes[_i].nodeName);
								if(_cur.attributes[_i].nodeName == 'style' && xtiger.cross.UA.IE)
									aLogger.write(this._sanitizeAttribute(_cur.style.cssText.toLowerCase()));
								else
									aLogger.write(this._sanitizeAttribute(_cur.getAttribute(_cur.attributes[_i].nodeName)));
								aLogger.closeAttribute(_cur.attributes[_i].nodeName);
							}
						}
						if (_styleAttr) { // TODO merge with global attr mgmt
							aLogger.openAttribute('style');
							aLogger.write(_styleAttr);
							aLogger.closeAttribute('style');
						}						
						this._saveData(_cur, aLogger); /* recursion */
						aLogger.closeTag(_sName.toLowerCase());
						break;
					case xtdom.TEXT_NODE:
						if (!_cur.nodeValue.match(/\S/) && _cur.nodeValue != ' ') /* avoid useless lumps of void text, but keep single spaces */
							break;
						var _text_buffer = '';
						/* consume all siblings text nodes */
						while (_cur && _cur.nodeType == xtdom.TEXT_NODE) {
							_text_buffer += _cur.nodeValue;
							_cur = _cur.nextSibling;
							_doNext = false; // avoid next node skipping
						}
						if (_hasElement || _cur) // avoid mixed content
							aLogger.openTag('span');
						_text_buffer = _text_buffer.replace(/&(?!\w{3,5};)/g, '&amp;'); // Sanizize orphan &
						aLogger.write(_text_buffer);
						if (_hasElement || _cur)
							aLogger.closeTag('span');
						break;
					default:
					}
					if (_cur && _doNext)
						_cur = _cur.nextSibling;
				}
			},
	
			/**
			 * <p>
			 * Load recursively the data given as parameter into the given insertion
			 * point.
			 * </p>
			 * 
			 * @param {array}
			 *            aPoint A point in the data source to load into the
			 *            insertion point
			 * @param {DataSource}
			 *            aDataSrc The datasource where to fetch the XML data
			 * @param {HTMLElement}
			 *            aInsertPoint The point where to insert the parsed data
			 * 
			 * @private
			 */
			_loadData: function (aPoint, aDataSrc, aInsertPoint) {
				if (aDataSrc.isEmpty(aPoint))
					return;
				if (aPoint instanceof Array && aPoint.length == 2 && aPoint[1].nodeType == xtdom.TEXT_NODE) {
					aInsertPoint.appendChild(xtdom.createTextNode(this._document, xtdom.getTextContent(aPoint[1]))); //FIXME IE looses spaces
				} else if (aPoint instanceof Array && aPoint.length == 2 && typeof(aPoint[1]) == 'string') {
					aInsertPoint.appendChild(xtdom.createTextNode(this._document, aPoint[1])); // FIXME IE looses sapces
				} else if (aPoint instanceof Array && aPoint.length >= 2) {
					for (var _i = 1; _i < aPoint.length; _i++) {
						if (aPoint[_i].nodeType == xtdom.TEXT_NODE)
							continue; /* sanity check for trailing "empty" nodes */
						var _nodeName = xtdom.getLocalName(aPoint[_i]);
						switch (_nodeName) {
						case 'span' :
							if (aPoint[_i].attributes.length == 0) { /* this was a span created to avoid mixed content */
								aInsertPoint.appendChild(xtdom.createTextNode(this._document, xtdom.getTextContent(aPoint[_i])));
								break;
							}
							/* prevent default node generation for IE and Opera */
							if (xtiger.cross.UA.IE || xtiger.cross.UA.opera) {
								var _style = xtdom.getStyleAttribute(aPoint[_i]);
								if (_style && _style != '') {
									var _tokens = _style.split(';');
									var _newNode;
									var _insertPoint;
									var _otherStyles = '';
									for (var _j = 0; _j < _tokens.length; _j++) {
										switch (_tokens[_j]) {
										case 'font-weight: bold' :
											_newNode = xtdom.createElement(this._document, 'strong');
											if (_insertPoint)
												_insertPoint.appendChild(_newNode);
											_insertPoint = _newNode;
											break;
										case 'font-style: italic' :
											_newNode = xtdom.createElement(this._document, 'em');
											if (_insertPoint)
												_insertPoint.appendChild(_newNode);
											_insertPoint = _newNode;
											break;
										case 'text-decoration: underline' :
											_newNode = xtdom.createElement(this._document, 'u');
											if (_insertPoint)
												_insertPoint.appendChild(_newNode);
											_insertPoint = _newNode;
											break;
										default :
											if (/\S/.test(_tokens[_j]))
												_otherStyles += _tokens[_j] + ';';
										}
									}
									if (_otherStyles != '') {
										_newNode = xtdom.createElement(this._document, 'span');
										if (xtiger.cross.UA.IE)
											_newNode.style.setAttribute('cssText', _otherStyles);
										else
											_newNode.setAttribute('style', _otherStyles)
										if (_insertPoint)
											_insertPoint.appendChild(_newNode);
										_insertPoint = _newNode;
									}
									for (var _k = 0; _k < aPoint[_i].attributes.length; _k++) { // FIXME IE (still todo)
										if (aPoint[_i].attributes[_k].nodeName != 'style')
											_newNode.setAttribute(aPoint[_i].attributes[_k].nodeName, aPoint[_i].attributes[_k].nodeValue);
									}
									var _newVector = [null]; 
									for (var _l = 0; _l < aPoint[_i].childNodes.length; _l++) {
										_newVector.push(aPoint[_i].childNodes[_l]);
									}
									this._loadData(_newVector, aDataSrc, _newNode); /* recursion */
									aInsertPoint.appendChild(_newNode);
									break;
								}
							}
						default :
							var _newNode = xtdom.createElement(this._document, _nodeName);
							for (var _k = 0; _k < aPoint[_i].attributes.length; _k++) { // FIXME IE (still todo)
								_newNode.setAttribute(aPoint[_i].attributes[_k].nodeName, aPoint[_i].attributes[_k].nodeValue);
							}
							var _newVector = [null]; 
							for (var _j = 0; _j < aPoint[_i].childNodes.length; _j++) {
								_newVector.push(aPoint[_i].childNodes[_j]);
							}
							this._loadData(_newVector, aDataSrc, _newNode); /* recursion */
							aInsertPoint.appendChild(_newNode);
						}
					}
				}
			},
	
			/**
			 * This method is called at the instance's creation time. It may serves
			 * as a "hook" to add a custom behavior by the means of the delegation
			 * pattern.
			 */
			create : function () {
				// nope
			},
			
			/**
			 * <p>
			 * Initialization function, called by the model's factory after object's
			 * instanciation. Cares to sets the default content, to parse and sets
			 * the various parameters and to call the awake() method.
			 * </p>
			 * 
			 * @param {string}
			 *            aDefaultData The innerHTML to insert in the handle. Unhappy?
			 *            So what?
			 * @param {string|object}
			 *            aParams Either the parameter string from the <xt:use> node
			 *            or the parsed parameters object from the seed
			 * @param {string}
			 *            aOption If the parameter is not null, the editor is
			 *            optional. If its value equals "set", the editor is set by
			 *            default
			 * @public
			 */
			init : function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
				if (aParams) { /* parse parameters */
					if (typeof (aParams) == 'string')
						xtiger.util.decodeParameters(aParams, this._params);
					else if (typeof (aParams) == 'object')
						this._params = aParams;
				}
				if (aDefaultData) { /* sets up initial content */
					try {
						this._setData(aDefaultData);
						this._defaultData = aDefaultData;
					}
					catch (_err) {
						xtiger.cross.log('warning', 'Unable to init the rich text editor with the following content :\n' + aData);
					}
				}
				if (aOption) { /* the editor is optional */
					this._isOptional = true;
					this._optCheckBox = this._handle.previousSibling;
					(aOption == 'set') ? this.set() : this.unset();
				}
				this._uniqueKey = aUniqueKey;
				var _deviceFactory = this._params['device'] ? 
						xtiger.factory(this._params['device']) :
						xtiger.factory(this._params['defaultDevice']);
				if (_deviceFactory)
					this._device = _deviceFactory.getInstance(this._document);
				else
					xtiger.cross.log('warning', 'no device for this editor ' + this);
				/* register buttons */
				//var _bf = xtiger.factory('button').getInstance();
				//this._device.registerButtonFactory('rte-bold', _bf.createButtonFactory( {
				//		click : function(that) {
				//			that.getDocument()
				//					.execCommand('bold', false, false);
				//		}
				//	}, 66 /* b */, '../editor/images/rte-bold.png', 'bold'));
				//this._device.registerButtonFactory('rte-italic', _bf.createButtonFactory( {
				//		click : function(that) {
				//			that.getDocument().execCommand('italic', false, false);
				//		}
				//	}, 73 /* i */, '../editor/images/rte-italic.png', 'italic'));
				//this._device.registerButtonFactory('rte-underline', _bf.createButtonFactory( {
				//		click : function(that) {
				//			that.getDocument().execCommand('underline', false, false);
				//		}
				//	}, null, '../editor/images/rte-underline.png', 'underline'));
				//this._device.registerButtonFactory('rte-undo', _bf.createButtonFactory( {
				//		click : function(that) {
				//			that.getDocument().execCommand('undo', false, false);
				//		}
				//	}, 90 /* z */, '../editor/images/rte-undo.png', 'undo'));
				/* make handle editable */
				//this._handle.setAttribute('contentEditable', "true");
				//this._handle.setAttribute('contenteditable', "true");
				this.awake();
			},
	


			/**
			 * Creates (lazy creation) an array to "seed" *this* model. Seeding
			 * occurs in a repeat context. 
			 * 
			 * @return
			 */
			makeSeed : function () {
				if (!this._seed)
					this._seed = [ xtiger.editor.RichTextFactory, this._defaultData,
						this._params, this._isOptional ];
				return this._seed;
			},
	
			/**
			 * <p>
			 * Returns true if *this* object is able to perform the function whose
			 * name is given as parameter.
			 * </p>
			 * 
			 * <p>
			 * This function implements the can/execute delegation pattern, this
			 * pattern allows a filter to easily extend the instance API with
			 * specific methods. Those methods are called from various devices such
			 * as the text device.
			 * </p>
			 * 
			 * @param {string}
			 *            aFunction The name of the function
			 * @return {boolean} True if *this* object as a function property with
			 *         the given name, false otherwise.
			 */
			can : function (aFunction) {
				return typeof this[aFunction] == 'function';
			},
	
			/**
			 * <p>
			 * Calls on *this* instance the function whose name is given as
			 * paramter, giving it the provided parameter (may be null). Returns the
			 * result.
			 * </p>
			 * 
			 * <p>
			 * This function implements the can/execute delegation pattern, this
			 * pattern allows a filter to easily extend the instance API with
			 * specific methods. Those methods are called from various devices such
			 * as the text device.
			 * </p>
			 * 
			 * @param {string}
			 *            aFunction The name of the function
			 * @param {any}
			 *            aParam A parameter whose type is not constrained
			 * @return {any} The return value of the called function.
			 */
			execute : function (aFunction, aParam) {
				return this[aFunction](aParam);
			},
	
			/* XML data "getter/setters" */
	
			/**
			 * <p>
			 * Loading function for setting the data stored in this model from an
			 * XML data source.
			 * </p>
			 * 
			 * @param {Point}
			 *            aPoint A point in the data source
			 * @param {DOMDataSource}
			 *            aDataSrc The data source to load into the editors
			 * @see #save()
			 */
			load : function(aPoint, aDataSrc) {
				var _buffer = xtdom.createElement(this._document, 'div');
				var _prevState = _buffer.innerHTML;
				try{
					this._loadData(aPoint, aDataSrc, _buffer);
					this._setData(_buffer.innerHTML);
				} catch (_err) {
					xtiger.cross.log('error', 'Richtext.js : failed to load data : ' + _err.message);
				}
				if (_buffer.innerHTML == _prevState && this.isOptional())
					this.unset();
				if (_buffer.innerHTML != _prevState && this.isOptional())
					this.set();
			},
	
			/**
			 * <p>
			 * Serialization function for saving the edited data to a logger. It is
			 * assumed that the XML node representing the label is produced by the
			 * caller function.
			 * </p>
			 * <p>
			 * By default, the serializing of the function dumps the nodes that are
			 * children of the handle. However, such behavior is likely to produce
			 * mixed content (text nodes that are siblings to element nodes). To
			 * avoid such a content, which is not supported by the underlying data
			 * model, text nodes are encompassed by a <code>:lt;span&gt;</code>
			 * tag.
			 * </p>
			 * 
			 * @param {Logger}
			 *            aLogger A logger object supporting the write() method
			 * @see #load()
			 */
			save : function(aLogger) {
				aLogger.openAttribute('xml:space');
				aLogger.write('preserve');
				aLogger.closeAttribute('xml:space');
				if (this.isOptional() && !this._isOptionSet) {
					aLogger.discardNodeIfEmpty();
					return;
				}
				this._saveData(this._handle, aLogger)
			},
	
			/* Editing facilities */
	
			/**
			 * Updates the model with the given data. The data is first sanitized, then inserted as innerHTML.
			 * 
			 * @param {string}
			 *            aData An <code>innerHTML</code> string. I know, it's
			 *            dirty, non-standard and proprietary. Still it's better
			 *            supported than a lot of W3C DOM method and if you are
			 *            unhappy I'd be glad to see you work on it.
			 */
			update : function (aData) {
				if (this._data == aData)
					return; // Guard if no modification
				
				if (!aData || aData.search(/\S/) == -1 || (aData == this._defaultData)) {
					this.clear(true);
					return;
				}
				
				var _newData = aData;
				_newData = _newData.replace(/<br>/ig, '<br/>'); // FIXME display bug if copy-paste from html
				_newData = _newData.replace(/<br\/>/gi, '<br></br>');
				try {
					this._setData(_newData);
					
					// If no thext content, resets the editor
					if (xtdom.getTextContent(this._handle).search(/\S/) == -1) {
						this.clear(true);
						return;
					}
					
					this._isModified = true;
					this.set(true);
				} catch (_err) {
					xtiger.cross.log('warning', 'Unable to update the rich text editor with the following content :\n' + aData);
				}
			},
	
			/**
			 * Empties the handle container from any HTML node (element and/or text
			 * nodes).
			 */
			clear : function(doPropagate) {
				for ( var i = this._handle.childNodes.length; i > 0; i--) {
					this._handle.removeChild(this._handle.childNodes[i - 1]);
				}
				this._setData(this._defaultData);
				this._isModified = false;
				if (this.isOptional() && this.isSet())
					this.unset(doPropagate);
			},
	
			/**
			 * <p>
			 * Returns the data currently stored by the model. To avoid painfull and
			 * useless text node creation the data is cleared from leading and trailing
			 * non-word characters (\s).
			 * 
			 * </p>
			 * 
			 * @returns {String} The handle's inner HTML
			 */
			getData : function() {
				return this._handle.innerHTML.replace(/^\s+|\s+$/g, '');
			},
			
			/**
			 * 
			 * @return
			 */
			getDefaultData: function () {
				return this._defaultData;
			},
	
			/*
			 * Other function
			 */
	
			/**
			 * <p>
			 * Returns the model's handle
			 * </p>
			 * 
			 * @returns {HTMLElement}
			 */
			getHandle : function() {
				return this._handle;
			},
			
			/**
			 * Getter for *this* instance owner document.
			 * 
			 * @return {DOMDocument} The DOM document holding *this* model
			 */
			getDocument : function () {
				return this._document;
			},
	
			/**
			 * <p>
			 * Returns the parameters associated with the given key.
			 * </p>
			 * 
			 * @param {string}
			 *            aKey The name of the parameter
			 * @returns {any} The parameter's value
			 */
			getParam : function(aKey) {
				return this._params[aKey];
			},

			/**
			 * Returns the unique key associated with *this* instance. The returned
			 * key is unique within the whole document.
			 * 
			 * @return {string} The unique key
			 */
			getUniqueKey : function () {
				return this._uniqueKey;
			},

			/**
			 * Returns true if the model contains data which is no longer the defaut
			 * data, either because a load() call modified it or because an user's
			 * interaction has occured.
			 * 
			 * @return {boolean} True if the data was changed, false otherwise.
			 */
			isModified : function () {
				return this._isModified;
			},
			
			/**
			 * Sets the isModified flag. Useless unless the update or load methods
			 * are filtered by a filter which need to control the isModified
			 * behavior.
			 * 
			 * @param {boolean}
			 *            isModified The new value for the isModified flag
			 */
			setModified : function (isModified) {
				this._idModified = isModified;
			},
	
			/*
			 * OPTIONAL EDITOR MANAGEMENT
			 */
	
			/**
			 * <p>
			 * Returns true if the editor is optional, that is, if the attribute
			 * <code>option=""</code> was set on the <code>&lt;xt:use&gt;</code>
			 * node.
			 * </p>
			 * 
			 * @returns {boolean} True if the editor is optional, false otherwise
			 */
			isOptional : function() {
				return this._isOptional;
			},

			/**
			 * Returns the optionality status of *this* model, that is, if it
			 * is set or unset. Only relevant if the model IS optional
			 * 
			 * @return {boolean} True if the model is optional and set, false
			 *         otherwise
			 *   
			 * @see #isOptional()
			 */
			isSet : function () {
				return this._isOptional && (this._isOptionSet ? true : false);
			},
	
			/**
			 * Sets the optional state to "set".
			 * 
			 * @param {boolean}
			 *            doPropagate If true, iters on parent repeat to set
			 *            them.
			 */
			set: function (doPropagate) {
				// propagates state change in case some repeat ancestors are unset
				// at that moment
				if (doPropagate) {
					xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle(true));
					xtdom.removeClassName(this._handle, 'axel-repeat-unset'); // fix if *this* model is "placed" and the handle is outside the DOM at the moment
				}
				if (this._isOptionSet) // Safety guard (defensive)
					return;
				this._isOptionSet = true;
				if (this._isOptional) {
					xtdom.removeClassName(this._handle, 'axel-option-unset');
					xtdom.addClassName(this._handle, 'axel-option-set');
					this._optCheckBox.checked = true;
				}
			},
	
			/**
			 * Sets the optional state to "unset".
			 */
			unset: function () {
				if (!this._isOptional) // Safety guard (defensive)
					return;
				xtdom.removeClassName(this._handle, 'axel-option-set');
				xtdom.addClassName(this._handle, 'axel-option-unset');
				this._isOptionSet = false;
				this._optCheckBox.checked = false;
			},
		
			/*
			 * FOCUS MANAGEMENT (for tab navigation)
			 */
		
			/**
			 * 
			 */
			isFocusable : function() {
				return true;
			},
		
			/**
			 * <p>
			 * This method is called by the tab group manager when it gives the focus
			 * to <code>this</code> editor.
			 * </p>
			 * 
			 * @param {boolean} aSet If true and the editor is optional and unset, the focusing sets the editor
			 */
			focus: function (aSet) {
				if (this._isOptional && aSet && !this._isOptionSet)
					this.set();
				this._handle.focus();
				this.startEditing();
			},
		
			/**
			 * 
			 * @return
			 */
			unfocus: function () {
				this._handle.blur();
				this.stopEditing();
			},
		
			/* Events management */
			/**
			 * <p>
			 * The awake method cares to registers event handlers for the handle node.
			 * As those handler invoke the device that is associated with this model,
			 * the method cares also to get the device from the factory.
			 * </p>
			 */
			awake : function() {
				var _devName = this.getParam('device');
				var _this = this;
				xtdom.addEventListener(this._handle, this._params['trigger'], function(ev) {
					if (_this._isOptional && !_this._isOptionSet)
						_this.set();
					_this.startEditing(ev);
					xtdom.stopPropagation(ev);
				}, true); // Capture click
				if (this.isOptional()) {
					xtdom.addEventListener (this._optCheckBox, 'click', function (ev) {_this.onToggleOpt(ev);}, true);
				}
			},
			
			/**
			 * Starts an edition process on *this* instance's device.
			 */
			startEditing : function (aEvent) {
				var _doSelect = aEvent ? (!this._isModified || aEvent.shiftKey) : false;
				this._device.startEditing(this, 'richtextwrapper', _doSelect);
			},
		
			/**
			 * Stops the edition process on the device
			 */
			stopEditing : function () {
				this._device.stopEditing();
			},
		
			/**
			 * <p>
			 * Handler for the option checkbox, toggles the selection state.
			 * </p>
			 * 
			 * @ignore
			 */
			onToggleOpt : function(ev) {
				this._isOptionSet ? this.unset() : this.set();
			}
	}; /* ### End of _RichTextModel class ### */

	/* Base string for key */
	var _BASE_KEY = 'richtext';

	/* a counter used to generate unique keys */
	var _keyCounter = 0;

	return { /* Public members for the RichTextModelFactory object */

		/**
		 * <p>
		 * Creates the HTML element for handling the data model (that is, the
		 * HTML content used as "rich text"). This element is a &lt;div&gt; that
		 * carries the attribute <code>contentEditable="true"</code>.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aContainer the HTML node where to implant the editor
		 * @param {XTNode}
		 *            aXTUse the XTiger use node that caused this editor to be
		 *            implanted here
		 * @param {DOM
		 *            Document} aDocument the current HTML document (in the DOM
		 *            understanding of a "document") being processed
		 * @returns {HTMLElement} The created HTML element
		 */
		createModel : function createModel(aContainer, aXTUse, aDocument) {
			var _params = {};
			xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _params);
			switch (_params['display']) {
			case 'inline':
				var _content = xtdom.createElement(aDocument, 'span');
				break;
			case 'single':
				var _content = xtdom.createElement(aDocument, 'p');
				break;
			default:
				var _content = xtdom.createElement(aDocument, 'div');
			}
			xtdom.addClassName(_content, 'axel-core-on');
			xtdom.addClassName(_content, 'axel-core-editable');
			var _optional = aXTUse.getAttribute('option');
			if (_optional) {
				var _checkbox = xtdom.createElement (aDocument, 'input');
				xtdom.setAttribute(_checkbox, 'type', 'checkbox');			       
				xtdom.addClassName(_checkbox, 'axel-option-checkbox');			       
				aContainer.appendChild(_checkbox);
			}
			aContainer.appendChild(_content);
			return _content;
		},

		/**
		 * <p>
		 * Creates the editor's from an XTiger &lt;xt:use&gt; element. This
		 * method is responsible to extract the default content as well as the
		 * optional parameters from the &lt;xt:use&gt; element. See the method
		 * implementation for the supported default content formats.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aHandleNode The HTML node used as handle by the created
		 *            editor
		 * @param {XMLElement}
		 *            aXTUse element The &lt;xt:use&gt; element that yields the
		 *            new editor
		 * @param {DOM
		 *            document} aDocument A reference to the containing DOM
		 *            document
		 * @returns {_RichTextModel} A new instance of the RichTextModel class
		 */
		createEditorFromTree : function createEditorFromTree(aHandleNode,
				aXTUse, aDocument) {
			var _model = new _RichTextModel(aHandleNode, aDocument);
			var _buffer = xtdom.createElement(aDocument, 'div');
			var _cur = aXTUse.firstChild;
			while (_cur) {
				var _next = _cur.nextSibling;
				_buffer.appendChild(_cur);
				_cur = _next;
			}
			var _params = {};
			xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _params);
			if (_params['filter'])
				_model = this.applyFilters(_model, _params['filter']);
			_model.init(_buffer.innerHTML, aXTUse.getAttribute('param'), aXTUse.getAttribute('option'), this.createUniqueKey());
			return _model;
		},

		/**
		 * <p>
		 * Creates an editor from a seed. The seed must carry the default data
		 * content as well as the parameters information. Those infos are used
		 * to init the new editor.
		 * </p>
		 * 
		 * @param {Seed}
		 *            aSeed The seed from which the new editor is built
		 * @param {HTMLElement}
		 *            aClone The cloned handle where to implant the editor
		 * @param {DOM
		 *            Document} aDocument the document containing the editor
		 * @returns {_RichTextModel} The new instance of the _RichTextModel
		 *          class
		 * 
		 * @see _linkModel#makeSeed()
		 */
		createEditorFromSeed : function createEditorFromSeed(aSeed, aClone, aDocument, aRepeater) {
			var _model = new _RichTextModel(aClone, aDocument);
			var _defaultData = aSeed[1];
			var _params = aSeed[2];
			var _option = aSeed[3];
			if (_params['filter'])
				_model = this.applyFilters(_model, _params['filter']);
			_model.init(_defaultData, _params, _option, this.createUniqueKey(), aRepeater);
			return _model;
		},
		
		/**
		 * Create a unique string. Each call to this method returns a different
		 * one.
		 * 
		 * @return {string} A unique key
		 */
		createUniqueKey : function createUniqueKey () {
			return _BASE_KEY + (_keyCounter++);
		}
	};
})();

xtiger.editor.Plugin.prototype.pluginEditors['richtext'] 
  = xtiger.util.filterable('richtext', xtiger.editor.RichTextFactory);

xtiger.resources.addBundle('richtext', 
		{ 'plusIconURL' : 'plus.png',
		  'minusIconURL'  : 'minus.png',	
		  'uncheckedIconURL' : 'unchecked.png',
		  'checkedIconURL' : 'checked.png'	} );



/**
 * Wrapper for the rich text editor.
 * 
 * TODO use padding param (now 10px)
 * 
 * @param aDocument
 * @return
 * 
 * @class _RichTextWrapper
 */
var _RichTextWrapper = function (aDocument) {
	/* keep a ref on the doc */
	this._document = aDocument;
	
	/**
	 * This regexp match all markup tags
	 */
	this._markupRE = new RegExp('(<\/?[^<>]+\/?>)', 'g');
	
	/**
	 * Listeners for keyboard event
	 */
	var _this = this;
	this._listener = {
			onkeyup: function (ev) {_this.onKeyUp(ev)},
			onkeydown: function (ev) {_this.onKeyDown(ev)}
	}
	
	/**
	 * Builds the HTML
	 * TODO put that stuff in an appropriate bundle
	 */
	this._handle = xtdom.createElement(aDocument, 'div');
	with (this._handle.style) {
		display = 'none';
		top = '-30px';
	}
	xtdom.addClassName(this._handle, 'axel-lens-container');
	xtdom.addClassName(this._handle, 'axel-lens-containerstyle');
	xtdom.addClassName(this._handle, 'axel-core-editing');
	
	var _buttonbar = xtdom.createElement(aDocument, 'div');
	with (_buttonbar) {
		style.height = '20px';
		style.padding = '0';
		style.marginBottom = '10px';
		style.width = '100%';
	}
	this._handle.appendChild(_buttonbar);
	
	var _this = this;
	var _buttonBL = xtdom.createElement(aDocument, 'input');
	with (_buttonBL) {
		type = 'button';
		value = 'bold';
		style.display = 'inline';
		style.marginRight = '2px';
		style.height = '20px';
	}
	xtdom.addEventListener(_buttonBL, 'click', function (ev) {
		_this._document.execCommand('bold', false, false);
		_this._editablediv.focus();
	}, true);
	_buttonbar.appendChild(_buttonBL);
	var _buttonUL = xtdom.createElement(aDocument, 'input');
	with (_buttonUL) {
		type = 'button';
		value = 'underline';
		style.display = 'inline';
		style.marginRight = '2px';
		style.height = '20px';
	}
	xtdom.addEventListener(_buttonUL, 'click', function (ev) {
		_this._document.execCommand('underline', false, false);
		_this._editablediv.focus();
	}, true);
	_buttonbar.appendChild(_buttonUL);
	var _buttonIT = xtdom.createElement(aDocument, 'input');
	with (_buttonIT) {
		type = 'button';
		value = 'italic';
		style.display = 'inline';
		style.marginRight = '2px';
		style.height = '20px';
	}
	xtdom.addEventListener(_buttonIT, 'click', function (ev) {
		_this._document.execCommand('italic', false, false);
		_this._editablediv.focus();
	}, true);
	_buttonbar.appendChild(_buttonIT);
	
	var _buttonOK = xtdom.createElement(aDocument, 'input');
	with (_buttonOK) {
		type = 'button';
		value = 'OK';
		style.marginRight = '2px';
		style.marginLeft = '40px';
		style.height = '20px';
		style.width = '50px';
		style.cssFloat = 'right';
		style.styleFloat = 'right';
	}
	xtdom.addEventListener(_buttonOK, 'click', function (ev) {
		_this._currentDevice.keepAlive(false);
		_this._currentDevice.stopEditing();
	}, true);
	_buttonbar.appendChild(_buttonOK);
	
	this._editablediv = xtdom.createElement(aDocument, 'div');
	with (this._editablediv) {
		style.backgroundColor = 'white';
		style.color = 'black';
		style.margin = '0';
		style.overflowX = 'auto';
		style.width = 'auto';
	}
	this._editablediv.setAttribute('contentEditable', "true");
	this._editablediv.setAttribute('contenteditable', "true");
	this._handle.appendChild(this._editablediv);
	
	xtdom.addEventListener(this._editablediv, 'focus', function (ev) {_this.onInputFocus(ev)}, false);
	xtdom.addEventListener(this._editablediv, 'blur', function (ev) {_this.onInputBlur(ev)}, true);
};

_RichTextWrapper.prototype = {
		
	/**
	 * Awakes and displays the wrapper. Puts the editable div in shape to match the
	 * model's handle's shape.
	 * 
	 * @param aDevice
	 * @param aDoSelect
	 */
	grab: function (aDevice, aDoSelect) {
		if (this._currentDevice)
			this.release();
		
		this._currentDevice = aDevice;
		var _modelHandle = this._currentDevice.getCurrentModel().getHandle();
		with (this._handle) {
			style.display = 'block';
		}
		
		var _display = this._currentDevice.getCurrentModel().getParam('display');
		
		var _pad = this._currentDevice.getCurrentModel().getParam('padding')
		var _newwidth = (_display == 'inline') ? null : (_modelHandle.offsetWidth);
		if (xtiger.cross.UA.IE) {
			_newwidth += 2*_pad;
		}
		with (this._handle.style) {
			minHeight = (_modelHandle.offsetHeight + 40) + 'px';
			minWidth = (_display == 'inline') ? (_modelHandle.offsetWidth) + 'px' : null;
			maxWidth = (_display == 'inline') ? (_modelHandle.parentNode.offsetWidth) + 'px' : null;
			width = _newwidth + 'px';
			padding = _pad + 'px';
		}
		with (this._editablediv.style) { // FIXME buggy (IE ok)
			paddingLeft = xtdom.getComputedStyle(_modelHandle, 'padding-left');
			paddingRight = xtdom.getComputedStyle(_modelHandle, 'padding-right');
			paddingTop = xtdom.getComputedStyle(_modelHandle, 'padding-top');
			paddingBottom = xtdom.getComputedStyle(_modelHandle, 'padding-bottom');
		}
		
		// updates the ediable div
		this.setData(this._currentDevice.getCurrentModel().getData());
	},    
	
	/**
	 * Terminates the wrapper installation after the lens has been made visible
	 */
	activate: function(aDevice, doSelectAll) {
		// if asked, select the text buffer
		if (doSelectAll)
			this.selectData();
		
		// start to listen to the keyboard
		var _this = this;
		xtdom.addEventListener(this._document, 'keyup', this._listener['onkeyup'], true);
		xtdom.addEventListener(this._document, 'keydown', this._listener['onkeydown'], true);
		this._lastKey = null; // reset last key to handle double enters
		
		// focus the caret inside the content ediatble div, only if the buffer is not selected
		if (!doSelectAll) {
			this._editablediv.focus();
			this.setCaretToEnd();
		}
	},	
	
	/**
	 * Releases the wrapper.
	 */
	release: function () {
		if (!this._currentDevice)
			return;
		var _this = this;
		xtdom.removeEventListener(this._document, 'keyup', this._listener['onKeyUp'], true);
		xtdom.removeEventListener(this._document, 'keydown', this._listener['onKeyDown'], true);
		this.setData('');
		xtdom.removeElement(this._handle);
		this._currentDevice = null;
	},
	
	/**
	 * Returns true if the wrapper should be included in the tab focus chain
	 * 
	 * @return {boolean}
	 */
	isFocusable: function () {
		return false;
	},
	
	/**
	 * Returns the edited data, as an HTML fragment
	 * 
	 * @return {string} The inner HTML of the editor
	 */
	getData: function () {
		return this._editablediv.innerHTML;
	},
	
	/**
	 * Sets the wrapper's data, that is, the data to edit.
	 * 
	 * @param {string}
	 *            aData The HTML fragment to edit
	 */
	setData: function (aData) {
		if (!typeof(aData) == 'string')
			return;
		this._editablediv.innerHTML = aData;
	},
	
	/**
	 * Handler for field toggles. Useless here as the is only one field here.
	 */
	toggleField: function () {
		// nope
	},
	
	/**
	 * Select (highlight) the text inside the editable device
	 * 
	 * FIXME doesn't work yet
	 */
	selectData: function () {
		try {
			this._editablediv.focus(); // The buffer *MUST* have the focus prior to the selection
			this._document.execCommand('selectAll', false, false);
		}
		catch (_err) {
			xtiger.cross.log('warning', 'Unable to move the caret at the end of the contentEditable field' + "\n\t" + 'Cause: ' + _err.message);
		}
		
	},
	
	/**
	 * Returns the wrapper's handle.
	 * 
	 * @return {HTMLElement} The wrapper's handle
	 */
	getHandle: function () {
		return this._handle;
	},
	
	/**
	 * Returns true if the buffer is empty
	 */
	isEmpty: function (aBuffer) {
		var _nomarkup = aBuffer.innerHTML.replace(this._markupRE, '');
		return _nomarkup.search(/\S/) == -1
	},
	
	/**
	 * Moves the caret at the end of the buffer
	 */
	setCaretToEnd: function () {
	    var _sel, _range;
	    this._editablediv.focus();
	    var _lastElement = this._editablediv.lastChild;
	    try {
		    if (window.getSelection && this._document.createRange) {
		        _sel = xtdom.getWindow(this._document).getSelection();
		        _sel.removeAllRanges();
		        _range = this._document.createRange();
		        _range.selectNodeContents(_lastElement);
		        _range.collapse(false);
		        _sel.addRange(_range);
		    } else if (this._document.body.createTextRange) {
		        _range = this._document.body.createTextRange();
		        _range.moveToElementText(this._editablediv);
		        _range.collapse(false);
		        _range.select();
		    }
	    }
	    catch (_err) {
	    	console.log(_err)
	    }
	    console.log('caret on end');
	},
	
	/**
	 * Handler for key down events. Filter events to drop, such as double enters
	 * 
	 * @param {DOMEvent}
	 *            ev The keybaord event to filter
	 */
	onKeyDown: function (ev) {
        if ((ev.keyCode == 13) && (this._lastKey == 13)) { // "double" enter
            xtdom.preventDefault(ev);
            xtdom.stopPropagation(ev);                                                
        }
        this._lastKey = ev.keyCode;
	},
	
	/**
	 * Handler for key up events.
	 * Restore the text buffer into a correct state (insert paragraph if needed, for instance)
	 * 
	 * @param {DOMEvent}
	 *            ev The keybaord event to filter
	 */
	onKeyUp: function (ev) {
		try {
			if (this.isEmpty(this._editablediv)) {
				this._editablediv.innerHTML = '';
	            this._document.execCommand('insertParagraph', false, false);
			}
			else if (this._editablediv.firstChild.nodeName.toLowerCase() != 'p' ||
					this._editablediv.firstChild.nodeType != xtdom.ELEMENT_NODE) {
				var _buf = '';
				var _cur = this._editablediv.firstChild;
				while (_cur && (_cur.nodeType != xtdom.ELEMENT_NODE || _cur.nodeName.toLowerCase() != 'p')) {
					_buf += xtdom.getTextContent(_cur); // get the text content
					_prev = _cur;
					_cur = _cur.nextSibling;
					xtdom.removeElement(_prev); // remove element when readed
				}
	            var _p = xtdom.createElement(this._document, 'p');
	            _p.innerHTML = _buf;
	            if (this._editablediv.firstChild)
	            	this._editablediv.insertBefore(_p, this._editablediv.firstChild);
	            else 
	            	this._editablediv.appendChild(_p);
	            this.setCaretToEnd();
			}
		}	
		catch (_err) {
			xtiger.cross.log('error', _err.message);
		}
	},
	
	/**
	 * Listener in the editable content div to keep the lens visible while the
	 * buffer has the focus.
	 * 
	 * @param ev
	 */
	onInputFocus: function (ev) {
		this._currentDevice.keepAlive(true);
	},
	
	/**
	 * Listener in the editable content div to let the lens disappear when the
	 * buffer lost the focus.
	 * 
	 * @param ev
	 */
	onInputBlur: function (ev) {
		this._currentDevice.keepAlive(false);
	}
}

xtiger.factory('lens').registerWrapper('richtextwrapper', function (aDocument) {return new _RichTextWrapper(aDocument)});/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * Photo editor factory
 * 
 */
xtiger.editor.PhotoFactory = (function PhotoFactory() {

	return {	

		// Returns the DOM node where the editor will be planted
		// This node must be the last one required to recreate the object from its seed
		// because seeding will occur as soon as this node is found
		createModel : function (container, useNode, curDoc) {
			var viewNode = xtdom.createElement (curDoc, 'img');
			xtdom.setAttribute (viewNode, 'src', xtiger.bundles.photo.photoIconURL);
			xtdom.addClassName (viewNode , 'axel-drop-target');
			xtdom.addClassName (viewNode , 'axel-photo-model');
			container.appendChild(viewNode);
			return viewNode;
		},

		createEditorFromTree : function (handleNode, xtSrcNode, curDoc) {
			var _model = new xtiger.editor.Photo (handleNode, curDoc);		
			var _data = xtdom.extractDefaultContentXT(xtSrcNode);
			var _param = {};
			xtiger.util.decodeParameters(xtSrcNode.getAttribute('param'), _param);
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);    
			_model.init(_data, _param, false);			
			// option always false, no unique key, no repeater
			return _model;
		},

		createEditorFromSeed : function (seed, clone, curDoc, aRepeater) {
			var _model = new xtiger.editor.Photo (clone, curDoc);
			var _defaultData = seed[1];
			var _param = seed[2];				           
			if (_param['filter'])
				_model = this.applyFilters(_model, _param['filter']);
			_model.init(_defaultData, _param, false, undefined, aRepeater);
			// option always false, no unique key
			return _model;
		}
	}
})();

/*
 * Utility class to store the state of a Photo editor
 */
xtiger.editor.PhotoState = function (client) {
	this.status = this.READY;
	this.photoUrl = null; // photo URL
	this.resourceId = null; // optional id as returned by server
	this.errMsg = null; // eventual error message 
	this.transmission = null;
	this.delegate = client; 
}

xtiger.editor.PhotoState.prototype = {

	// State encoding
	READY : 0, // no photo uploaded, ready to upload
	ERROR : 1, // last upload was an error
	UPLOADING : 2, // uploading in progress
	COMPLETE : 3, // photo stored on server and visible
	
	isPhotoStateObject : true,
	
	setDelegate : function (client) {
		this.delegate = client;
	},
	
	getPayload : function () {
		return this.payload;
	},
	
	// Called after a transmission has started to retrieve the document id
	getDocumentId : function () {
		return xtiger.session(this.myDoc).load('documentId');
	},
	
	startTransmission : function (doc, kind, payload, url) {
		this.cached = [this.status, this.photoUrl, this.resourceId, this.errMsg]; // in case of cancellation
		var manager = xtiger.factory('upload').getInstance(doc);
		this.myDoc = doc;
		this.transmission = manager.getUploader();
		this.transmission.setDataType(kind);
		if (url) {
		  this.transmission.setAction(url);		
		}
		this.payload = payload;
		this.status = this.UPLOADING;
		manager.startTransmission(this.transmission, this);
		this.delegate.redraw ();
	},	
	
	cancelTransmission : function () {
		if (this.transmission) {
			var manager = xtiger.factory('upload').getInstance(this.myDoc);
			manager.cancelTransmission(this.transmission);
		}
	},
	
	onComplete : function (response) {
		this.status = this.COMPLETE;
		if (typeof(response) == "string") {
			this.photoUrl =  response;
			this.resourceId = null;
		} else {
			this.photoUrl =  response.url;
			this.resourceId = response.resource_id;
		}
		this.errMsg = null;
		this.transmission = null;
		this.delegate.redraw ();
	},
	
	onError : function (error, dontResetPhotoUrl) {
		this.status = this.ERROR;
		if (! dontResetPhotoUrl) { this.photoUrl = null; }				
		this.errMsg = error;
		this.transmission = null;
		this.delegate.redraw ();
	},
	
	onCancel : function () {
		this.status = this.cached[0];
		this.photoUrl = this.cached[1]; 
		this.resourceId = this.cached[2]; 
		this.errMsg = this.cached[3];
		this.transmission = null;
		this.delegate.redraw ();
	}
}

/**
 * Manages primitive Photo editor.
 */
xtiger.editor.Photo = function (aHandleNode, aDocument) {
	this.curDoc = aDocument;
	this.handle = aHandleNode;
	this.defaultContent = null;	  
	this.state = new xtiger.editor.PhotoState (this);
	
}

xtiger.editor.Photo.prototype = {  
	
	defaultParams : {
		trigger : 'click' // 'click' or 'mouseover' DOM events (see awake)			
	},

	getParam : function (name)  {
		return (this.param && this.param[name]) || this.defaultParams[name];
	},	              
	
	can : function (aFunction) {      
		return typeof this[aFunction] == 'function';
	},

	execute : function (aFunction, aParam) {
		return this[aFunction](aParam);
	},	
	
	/////////////////////////////////
	// Creation
	/////////////////////////////////
	
	init : function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
		this.defaultContent = aDefaultData;
		if (typeof (aParams) == 'object') { // FIXME: factorize params handling in AXEL
			this.param = aParams;
		}
	 	this.awake ();
	},
	
	awake : function () {
		this.device = xtiger.factory('lens').getInstance(this.curDoc);
		var _this = this;				
		xtdom.addEventListener (this.handle, "error", function (ev) { _this.state.onError('Broken Image', true) }, false);
		xtdom.addEventListener (this.handle, this.getParam('trigger'), function (ev) {_this.device.startEditing(_this, 'photo');xtdom.preventDefault(ev);
		xtdom.stopPropagation(ev); }, false);
		// HTML 5 DnD : FF >= 3.6 ONLY
		// FIXME: TO BE DONE !
		// if (xtiger.cross.UA.gecko) { // FIXME: check version too !
		// 	xtdom.addEventListener (this.handle, "dragenter", function (ev) { _this.onDragEnter(ev) }, false);  
		// 	xtdom.addEventListener (this.handle, "dragleave", function (ev) { _this.onDragLeave(ev) }, false);  
		// 	xtdom.addEventListener (this.handle, "dragover", function (ev) { _this.onDragOver(ev) }, false);  
		// 	xtdom.addEventListener (this.handle, "drop", function (ev) { _this.onDrop(ev) }, false);
		// }
		this._constructStateFromUrl (this.defaultContent);
		this.redraw (false);
	},
	
	// The seed is a data structure that should allow to "reconstruct" a cloned editor
	makeSeed : function () {
		if (! this.seed) { // lazy creation
			var factory = xtiger.editor.Plugin.prototype.pluginEditors['photo']; // see last line of file
			this.seed = [factory, this.defaultContent, this.param];
		}
		return this.seed;
	},	
	
	/////////////////////////////////
	// Content management
	/////////////////////////////////
	
	_constructStateFromUrl : function (value) {
		this.state.resourceId = null;
		if (value && (value.search(/\S/) != -1)) { // there is a photo URL
			this.state.status = xtiger.editor.PhotoState.prototype.COMPLETE;
			this.state.photoUrl = value;
		} else {
			this.state.status = xtiger.editor.PhotoState.prototype.READY;
			this.state.photoUrl = null;
		}
	},
	
	_dump : function () {
		return (this.state.photoUrl) ? this.state.photoUrl : '';
	},	

	// Updates display state to the current state, leaves state unchanged 
	// FIXME: rename to _setData
	redraw : function (doPropagate) {
		var src;
		switch (this.state.status) {
			case xtiger.editor.PhotoState.prototype.READY: 
				src = xtiger.bundles.photo.photoIconURL;
				break;
			case xtiger.editor.PhotoState.prototype.ERROR: 
			    src = xtiger.bundles.photo.photoBrokenIconURL;
				break;
			case xtiger.editor.PhotoState.prototype.UPLOADING: 
				src = xtiger.bundles.photo.spiningWheelIconURL;
				break;
			case xtiger.editor.PhotoState.prototype.COMPLETE: 			
			  if (doPropagate) {        
			    var cur = this.handle.getAttribute('src');
			    if (cur != this.state.photoUrl) { // Photo URL has changed and successfully uploaded
				    xtiger.editor.Repeat.autoSelectRepeatIter(this.handle);
				  }
  			}
				src = this.state.photoUrl; 
				break;
			default: src = xtiger.bundles.photo.photoBrokenIconURL;
		}
		xtdom.setAttribute (this.handle, 'src', src);
	},
	
	load : function (point, dataSrc) {
		var value = (point !== -1) ? dataSrc.getDataFor(point) : this.defaultContent;
		this._constructStateFromUrl (value);
		if (dataSrc.hasAttributeFor('resource_id', point)) { // optional 'resource_id'
			var p = dataSrc.getAttributeFor('resource_id', point);
			this.state.resourceId = dataSrc.getDataFor(p);
		}
		this.redraw(false);
	},
	
	save : function (logger) {
		logger.write(this._dump()); 
		if (this.state.resourceId) { // savec optional 'resource_id' attribute
			logger.writeAttribute("resource_id", this.state.resourceId);
		}		
	},

	// Just redraws as the state is shared with the lens it is already synchronized
	// Does nothing because side effects will happens when wrapper will be released just after
	update : function (data) {
		// tests if update is called outside of the lens wrapper (i.e. a service)
		// in which case expected data is not a PhotoState object but a simple hash
		if (data.isPhotoStateObject === undefined) { 
			if (data.photoUrl) { // assumes a { photoUrl: , resource_id: } hash
				this._constructStateFromUrl(data.photoUrl);
				if (data.resource_id) {
					this.state.resourceId = data.resource_id;  
				}
			 } else { // assumes a string with a simple photoUrl
				this._constructStateFromUrl(data);				
			}
			// FIXME: in case the lens was visible at that time, it should cancel 
			// any ongoing upload first
			this.redraw(true);			
		}
		// otherwise redraw will be called from consecutive PhotoWrapper release call
	},
	
	// Returns the actual data model, lens wrapper may ask this to build their view
	getData : function () {
		return this.state;
	},
	  	
	// HTML 5 API for DnD and FileReader (FF >= 3.6)
	getFile : function () {
		return this.file;
	},
	
	/////////////////////////////////
	// User Interaction Management
	/////////////////////////////////
	
	isFocusable : function () {
		return false;
	},
	
	// Returns the <img> tag which is used to present the photo in the document view
	getHandle : function () {
		return this.handle;
	},
		
	onDragEnter : function (ev) {  
	  xtdom.addClassName (this.handle, 'axel-dnd-over');
	  xtdom.stopPropagation(ev);
	  xtdom.preventDefault(ev);
	},
	
	onDragOver : function (ev) {       
	  xtdom.stopPropagation(ev);
	  xtdom.preventDefault(ev);
	},

	onDragLeave : function (ev) {  
	  xtdom.removeClassName (this.handle, 'axel-dnd-over');
	  xtdom.stopPropagation(ev);
	  xtdom.preventDefault(ev);
	},	

	onDrop : function (ev) {       
	  var dt = ev.dataTransfer;  
	  var files = dt.files;	
	  xtdom.stopPropagation(ev);
	  xtdom.preventDefault(ev);
	
	  // find the first image file
	  for (var i = 0; i < files.length; i++) {  
	    var file = files[i];  
	    var imageType = /image.*/;  
	    if (!file.type.match(imageType)) {  
	      continue;  
	    }  
		  this.state.startTransmission(this.curDoc, 'dnd', file, this.getParam('photo_URL'));
	  }	
	}	
}

/**
 * Helper class to control the dialog box for the lens device photo wrapper 
 * Downloads and installs the dialog box with an Ajax call
 * This allows to change the dialog box look and feel independently of the library
 */
xtiger.editor.PhotoViewer = function (url, doc, target, wrapper) {
	// creates photo lens container from external resource file at URL
	var lensDiv = this.view = xtdom.createElement(doc, 'div');
	xtdom.setAttribute(lensDiv, 'id', 'xt-photo');
	xtdom.addClassName(lensDiv, 'axel-lens-container');
	xtdom.addClassName(lensDiv, 'axel-lens-containerstyle');
	target.appendChild(this.view);
	try {                   
	  // We could have used xtiger.cross.loadDocument 
	  // But for IE you need to serve .xhtml resources with text/xml MIME-Type
	  // So that it gets really parsed into responseXML and then the Document DOM 
	  // objet (IXMLDOMDocument) does not implement getElementById
	  // Hence we use the more classical responseText / innerHTML approach !
  	var xhr = xtiger.cross.getXHRObject ();
		xhr.open("GET", url, false); // false:synchronous
		xhr.send(null);
		if ((xhr.status  == 200) || (xhr.status  == 0)) { // 0 is for loading from local file system
			if (xhr.responseText) { 
			  lensDiv.innerHTML = xhr.responseText; 		  
			} else {
  		  throw {name : 'Error', message : 'Photo plugin initialization failed : empty lens bundle content'}
			}
		} else { 
      throw {name : 'Error', message : 'Photo plugin initialization failed : HTTP error (' + xhr.status + ')'}
		}
		this.formular 	= doc.getElementById('xt-photo-form');
		this.icon 		= doc.getElementById('xt-photo-icon');
		this.infobox 	= doc.getElementById('xt-photo-info');
		this.errorbox 	= doc.getElementById('xt-photo-error');
		this.filemenu 	= doc.getElementById('xt-photo-form-body');
		this.btnselfile = doc.getElementById('xt-photo-file');
		this.btnupload 	= doc.getElementById('xt-photo-save');		
		this.btncancel 	= doc.getElementById('xt-photo-cancel');		
		this.result 	= doc.getElementById('xt-photo-target');
		var _this = this;
		xtdom.addEventListener(this.btnselfile, 'click', function () { _this.startSelectCb(); }, false);
		xtdom.addEventListener(this.btnupload , 'click', function () { _this.saveCb(); }, false);
		xtdom.addEventListener(this.btncancel , 'click', function () { _this.cancelCb(); }, false);
		this.btncancel.style.display = 'none';
		this.failed = false;
		this.hide();
	} catch (e) {
		this.view.innerHTML = "<p>File Upload is not available...<br/><br/>Failed to make lens with '" + url 
			+ "'.<br/><br/>"+ e.name + ' : ' + e.message 
			+ "</p>";                   
		this.failed = true;
	}		
	this.ready(); 	
	this.wrapper = wrapper;
}

xtiger.editor.PhotoViewer.prototype = {
	
	// Internal methods to control appearance
	
	showPhoto : function (src) {
		if (this.failed) { return } // sanity check
		if (this.btnselfile.value.length > 0) { // reset the form when changing state
			this.formular.reset();
		}
		this.icon.setAttribute('src', src);
		this.icon.style.visibility = 'visible';			
		if (src == xtiger.bundles.photo.spiningWheelIconURL) {
			this.btncancel.style.display = 'block';
		} else {
			this.btncancel.style.display = 'none';
		}
	},
	hideError : function () {
		if (this.failed) { return } // sanity check
		this.errorbox.style.display = 'none';
	},
	hideMessage : function () {
		if (this.failed) { return } // sanity check
		this.infobox.style.display = 'none';			
	},		
	showError : function (msg) {
		if (this.failed) { return } // sanity check			
		this.errorbox.style.display = 'block';			
		this.errorbox.firstChild.data = msg;
	},
	showUplButtons : function () {
		if (this.failed) { return } // sanity check
		this.filemenu.style.display = '';
	},		
	hideUplButtons : function () {
		if (this.failed) { return } // sanity check
		this.filemenu.style.display = 'none';
	},
	
	// Public methods
	
	hide : function () {
		this.view.style.display = 'none';
	},
	show : function () {
		this.view.style.display = '';
	},		
	showMessage : function (msg) {
		if (this.failed) { return } // sanity check			
		this.infobox.style.display = 'block';		
		this.infobox.firstChild.data = msg;
	},	
	getTopDiv : function () {
		return this.view;
	},	
	
	// State methods
	
	ready : function () {
		this.showPhoto(xtiger.bundles.photo.photoIconURL);
		this.showMessage("You can select a file and upload it");
		this.hideError();
		this.showUplButtons();
	},
	complete : function (photoUrl) {
		this.showPhoto(photoUrl);
		this.hideMessage();
		this.hideError();
		this.showUplButtons();			
	},		
	loading : function () {
		this.showPhoto(xtiger.bundles.photo.spiningWheelIconURL);
		this.showMessage("Wait while loading");
		this.hideError();
		this.hideUplButtons();		
	},
	error : function (msg) {
		this.showPhoto(xtiger.bundles.photo.photoBrokenIconURL);
		this.showError(msg);
		this.hideMessage();
		this.showUplButtons();
	},
	busy : function () {
		this.btncancel.style.display = 'none'; // hidden in showPhoto in the other cases
		this.icon.style.visibility = 'hidden';			
		this.hideError();
		this.showMessage('Another upload is in progress, please wait until it finishes.');
		this.hideUplButtons();
	},
	activateUpload : function () {
		this.btnupload.removeAttribute('disabled');
	},
	deactivateUpload : function () {
		xtdom.setAttribute(this.btnupload, 'disabled', 'true');
	},
	
	// Controller functions

	startSelectCb : function () {
		this.wrapper.onStartSelect();
	},	
	saveCb : function () {
		// FIXME: check filename is an image file
		if (this.btnselfile.value.length > 0) {
			this.wrapper.onStartUpload(this.formular); // gives form as parameter for calling submit()
		}
	},	
	cancelCb : function () {
		this.wrapper.onCancelUpload();
	}	
}

/**
 * Lens Wrapper for photo upload device
 * If a photo has already been uploaded shows it in full size
 * Also shows a browser / submit dialog to upload / replace the photo
 */
xtiger.editor.PhotoWrapper = function (aDoc) {	
	this._handle; // wrapped HTML device
	this._handleToRestore; // handle to restore when releasing
	this.myDoc = aDoc;
	var form = xtiger.session(aDoc).load('form');
	var root = (form && form.getRoot()) || aDoc.getElementsByTagName('body')[0]; // NOTE that .body is undefined in XML document (.xtd)
	this.view = new xtiger.editor.PhotoViewer(xtiger.bundles.photo.lensBoxURL, aDoc, root, this); // temporary
	this.state = null;
}

xtiger.editor.PhotoWrapper.prototype = {
		
		// This wrapper does not manage keyboard entry, hence it is not focusable
		isFocusable: function () {
			return false; 
		},
		
	 	// Returns the top <div> lens container
		getHandle: function () {
			return this.view.getTopDiv();
		},
				
	 	// Returns the data currently hold by the wrapper.
		getData: function () {
			return this.state;			
		},
		
		// Grabs the wrapper with the given device usually on device behalf
		// Entry point to display the lens wrapper on screen
		grab: function (aDevice, aDoSelect, aPadding) {
			this.device = aDevice;			
			this.editor = aDevice.getCurrentModel();
			this.state = this.editor.getData();
			this.state.setDelegate(this);
			this.redraw();
			this.view.show();                                
			if (aPadding[0] > 0) { // FIXME: only one padding dimension
				this.view.getTopDiv().style.padding = aPadding[0] + 'px';
			}
		},         

		// Terminates the wrapper installation after the lens has been made visible
		activate: function(aDevice, doSelectAll) {
			// nope
		},		
		
		// Releases the wrapper, restores the handle usually on device behalf
		// Entry point to hide the lens wrapper
		release: function () {
			this.view.hide();			
			this.device = null;
			this.state.setDelegate(this.editor); // restore delegate
			// FIXME: shall we call it here since it seems more appropriate in editor.update
			// which has just been called before from the lens device !
			this.editor.redraw(true);
		},
		
		// Trick to avoid hiding the lens while interacting with modal file selection dialog
		onStartSelect : function () {
			this.device.mouseMayLeave();
		},
		
		// Starts uploading on behalf of the view
		onStartUpload : function (form) {
			this.state.startTransmission(this.myDoc, 'upload', form, this.editor.getParam('photo_URL'));
		},

		onCancelUpload : function (form) {
			this.state.cancelTransmission();
		},
				
		// Displays current state
		redraw: function () {
			var mgr = xtiger.factory('upload').getInstance(this.myDoc);
			if (mgr.isReady() || mgr.isTransmitting(this.state.transmission)) {
				switch (this.state.status) {
					case xtiger.editor.PhotoState.prototype.READY: 
						this.view.ready(); break;
					case xtiger.editor.PhotoState.prototype.ERROR: 
						this.view.error(this.state.errMsg); break;
					case xtiger.editor.PhotoState.prototype.UPLOADING: 
						this.view.loading(); break;
					case xtiger.editor.PhotoState.prototype.COMPLETE:  					  
						this.view.complete(this.state.photoUrl); break;
					default: 
						this.view.error('Unkown Photo status ' + this.state.status); break;
				}
			} else {
				// Allow monitoring only 1 photo upload at a time
				this.view.busy();
			}
		}				
}

/////////////////////////////////
// Device Registrations
/////////////////////////////////

xtiger.editor.Plugin.prototype.pluginEditors['photo'] 
	= xtiger.util.filterable('photo', xtiger.editor.PhotoFactory);

// Resource registration
xtiger.resources.addBundle('photo', 
	{ 'photoIconURL' : 'icons/photo.png',
 	  'photoBrokenIconURL' : 'icons/photobroken.png',
	  'spiningWheelIconURL' : 'icons/spiningwheel.gif',
	  'lensBoxURL' : 'photo.xhtml' } );

xtiger.factory('lens').registerWrapper('photo',  function (doc) { return new xtiger.editor.PhotoWrapper(doc) });
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Antoine Yersin, Stéphane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Class VideoFactory (static)
 * 
 * @class VideoFactory
 * @version beta
 */
xtiger.editor.VideoFactory = (function VideoFactory () {
  
  /**
   * @name _VideoModel
   * @class _VideoModel
   */
  var _VideoModel = function (aHandleNode, aDocument) {
    
    /*
     * Default parameters for the video editor. Parameters meaning and possible values are documented below.
     */
    var _DEFAULT_PARAMS = {
        defaultDevice: 'lens', /* {string} name of the device to use */
        trigger: "mouseover", /* {string} */
        lang: 'fr_FR', /* {string} lang's code for player's GUI (must respect the video's provider's standards) */
        inputFieldMessage: 'Paste the video\'s link here', /* {string} the text appearing in the input field if no valid data is hold by the model */
        width: 425, /* {integer} width of the flash video player */
        height: 344 /* {integer} height of the flash video player */
    	
    };

    /**
     * The HTML node used as handle by the editor. 
     */
    this._handle = aHandleNode;
    
    /**
     * The data handled by *this* model
     */
    this._data = null;
    
    /**
     * The default data as specified in the xt:use node
     */
    this._defaultData = this._data;
    
    /**
     * HTML element to represents an editor containing no data
     */
    this._noData = this._handle.firstChild;
    
    /**
     * A reference to the DOM document containing the editor
     */
    this._document = aDocument;

    /**
     * The actual parameters used by *this* instance
     */
    this._params = _DEFAULT_PARAMS;
    
    /**
     * If true, the editor is optional
     */
    this._isOptional = false;
    
    /**
     * If true, the optional editor is set. Irrelevant if not optional
     */
    this._isOptionSet = false;
    
    /**
     * The HTML checkbox for optional editors. Sets in init() method
     */
    this._optCheckBox;
    
    /**
     * The device object used to edit this model. It is sets in init() function
     */
    this._device = null;
    
    /**
     * A stored seed for this model
     */
    this._seed = null;
    
    /**
     * if true, the model must contains valid data
     */
    this._isModified = false;
    
    /**
     * A unique string that identifies *this* instance
     */
    this._uniqueKey;

    /* Call the create method for delegation purposes */
    this.create();
    
  };
  /** @memberOf _VideoModel */
  _VideoModel.prototype = {
  
    /*
     * <p>
     * Tests if the input is a valid URL (no trailing nor leading spaces allowed)
     * </p>
     * 
     * @param {String|HTMLElement}
     *            aInput The input to validate
     * @return {boolean}
     * @private
     */
    _isValidUrl: function (aInput) {
      var _URL_R = /^(http\:\/\/|~\/|\/)?(\w+:\w+@)?(([-\w\d{1-3}]+\.)+(com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2})?)(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:[\?&](?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)?(?:&)?$/;
      return _URL_R.test(aInput);
    },
    
    /*
     * Removes leading and trailing spaces
     */
    _removeLTSpaces: function (aInput) {
      if (!aInput || aInput == '')
        return '';
      return aInput.replace(/^\s+|\s+$/g, '');
    },
    
    /*
     * Builds a valid YouTube's snippet (as HTML element) from a video ID
     */
    _buildYoutubeSnippet: function (aVideoID, aSize, aParams) {
      var _params = aParams ? aParams : {};
      _params['movie'] = aVideoID;
      if (!_params['allowFullScreen'])
        _params['allowFullScreen'] = 'true';
      if (!_params['alloscriptaccess'])
        _params['alloscriptaccess'] = 'always';
      var _obj = xtdom.createElement(this._document, 'object');
      if (aSize) {
        _obj.height = aSize[0];
        _obj.width = aSize[1];
      } else {
        _obj.height = this.getParam('height');
        _obj.width = this.getParam('width');
      }
      _obj.style.zIndex = 1000;
      for (var _param in _params) {
        var _p = xtdom.createElement(this._document, 'param');
        _p.name = _param;
        _p.value = _params[_param];
        _obj.appendChild(_p);
      }
      var _embed = xtdom.createElement(this._document, 'embed');
      xtdom.setAttribute(_embed, 'src', aVideoID);
      xtdom.setAttribute(_embed, 'type', 'application/x-shockwave-flash');
      xtdom.setAttribute(_embed, 'allowfullscreen', 'true');
      xtdom.setAttribute(_embed, 'allowscriptaccess', 'always');
      xtdom.setAttribute(_embed, 'width', this.getParam('width'));
      xtdom.setAttribute(_embed, 'height', this.getParam('height'));
      _embed.style.zIndex = 1000;
      if (xtiger.cross.UA.IE) {
        _obj = _embed;  
      } else {
        _obj.appendChild(_embed);
      }
      return _obj;
    },
    
    /*
     * Extracts the youtube's video id from a valid link to the video (either
     * the "permalink" or the page's link)
     */
    _extractVideoId: function (aValidUrl) {
      var _tmp = aValidUrl.match(/^[^&]*/)[0];
      return _tmp.match(/[^\=\/]*$/)[0];
    },
    
    /*
     * Returns true of the given input is a code snippet
     */
    _isCodeSnippet: function (aInput) {
      var _SNIPPET_O_R = /(<object>).*(<param[^>]*(name\="movie"))/;
      var _SNIPPET_E_R = /(<embed\s)([^>]+)(\ssrc\=")([^"]+)"/;
      return _SNIPPET_O_R.test(aInput) || _SNIPPET_E_R.test(aInput);
    },
    
    /**     
     * Changes the handler content to show a video player if aData 
     * is a valid YouTube URL and as a side effects calls this.setModified(true).
     * Returns true if it succeeded, false otherwise (in that case it didn't change
     * the handler content).
     * 
     * @param aData
     */
    _setData: function (aData) {
      var _tdata = this._removeLTSpaces(aData);
      
      if (!this._isValidUrl(_tdata)) {
        if (this._isCodeSnippet(_tdata))
          _tdata = this._extractUrlFromSnippet(_tdata);
        else
          return false;
      }
      
      var _type = 'youtube'; //_extractType(aData);
      switch (_type) {
      case 'youtube':
        var _videoID = this._extractVideoId(_tdata);
        var _newdata = 'http://www.youtube.com/v/' + _videoID;
        if (this._data == _newdata)
          return false; // No update
        
        this._data = _newdata; // Updates the model
        
        _newdata += '&hl=' + this._params['lang'] + '&fs=1&';
        var _newContent = this._buildYoutubeSnippet(this._data, null, null);
        try {
          // Sets the correct handle's width and height by using a temp container
          var _tmp = xtdom.createElement(this._document, 'div');
          _tmp.style.visibility = 'hidden';
          this._document.getElementsByTagName('body')[0].appendChild(_tmp);
          _tmp.appendChild(_newContent);
              with (this._handle.style) {
                width = this.getParam('width') + 'px'; //_newContent.offsetWidth + 'px'; // Defeat bug with the size of an <object>
                height = this.getParam('height') + 'px'; //_newContent.offsetHeight + 'px'; // TODO fix once a dynamic computation of size
              }
              
              // Appends the new content in the handle
              this._handle.replaceChild(_newContent, this._handle.firstChild);
              this.setModified(true);
              
              // Remove the temp container
              xtdom.removeElement(_tmp);
            }
        catch (err) {
          xtiger.cross.log('warning', err);
          return false;
        }
        break;
      default :
        xtiger.cross.log('warning', 'Video type ' + type + ' is currently unsupported');
        return false;
      }
      return true; // success
    },

    /**
     * This method is called at the instance's creation time. It may serves
     * as a "hook" to add a custom behavior by the means of the delegation
     * pattern.
     */
    create : function () {
      // nop
    },
    
    /**
     * <p>
     * Initialization function, called by the model's factory after object's
     * instanciation. Cares to sets the default content, to parse and sets
     * the various parameters and to call the awake() method.
     * </p>
     * 
     * @param {string}
     *            aDefaultData The default data as specified in the
     *            template. May be either the "permalink" or the HTML code
     *            (as string) of the YouTube's code snippet. That would lead
     *            to a "pre-loaded" editor. If the given string is not one
     *            of those reference to a video, the text is used as a
     *            message displayed in the lens' input field.
     * @param {string|object}
     *            aParams Either the parameter string from the <xt:use> node
     *            or the parsed parameters object from the seed
     * @param {string}
     *            aOption If the parameter is not null, the editor is
     *            optional. If its value equals "set", the editor is set by
     *            default
     * @param {string}
     *            aUniqueKey A unique string (no two editor have the same) to 
     *            provide an unambiguous identifier even among repeated editor 
     */
    init: function (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
      if (aParams) { /* parse parameters */
        if (typeof(aParams) == 'string')
          xtiger.util.decodeParameters(aParams, this._params);
        else if (typeof(aParams) == 'object')
          this._params = aParams;
      }
      if (aDefaultData) { /* sets up initial content */
        if (this._isValidUrl(aDefaultData) || this._isCodeSnippet(aDefaultData)) {
          this._setData(aDefaultData);
          this._defaultData = this._data;
        }
        else // short-hand for setting that parameter
          this._params['inputFieldMessage'] = aDefaultData;
      }
      if (aOption) { /* the editor is optional */
        this._isOptional = true;
        this._optCheckBox = this._handle.previousSibling;
        (aOption == 'set') ? this.set(false) : this.unset(false);
      }
      this._uniqueKey = aUniqueKey;
      var _deviceFactory = this._params['device'] ? 
          xtiger.factory(this._params['device']) :
          xtiger.factory(this._params['defaultDevice']);
      this._device = _deviceFactory.getInstance(this._document);
      this.awake();
    },

    /**
     * Creates (lazy creation) an array to "seed" *this* model. Seeding
     * occurs in a repeat context. 
     * 
     * @return
     */
    makeSeed : function () {
      if (!this._seed)
        this._seed = [ xtiger.editor.VideoFactory, this._defaultData,
          this._params, this._isOptional ];
      return this._seed;
    },
    
    /**
     * <p>
     * Returns true if *this* object is able to perform the function whose
     * name is given as parameter.
     * </p>
     * 
     * <p>
     * This function implements the can/execute delegation pattern, this
     * pattern allows a filter to easily extend the instance API with
     * specific methods. Those methods are called from various devices such
     * as the text device.
     * </p>
     * 
     * @param {string}
     *            aFunction The name of the function
     * @return {boolean} True if *this* object as a function property with
     *         the given name, false otherwise.
     */
    can : function (aFunction) {
      return typeof this[aFunction] == 'function';
    },

    /**
     * <p>
     * Calls on *this* instance the function whose name is given as
     * paramter, giving it the provided parameter (may be null). Returns the
     * result.
     * </p>
     * 
     * <p>
     * This function implements the can/execute delegation pattern, this
     * pattern allows a filter to easily extend the instance API with
     * specific methods. Those methods are called from various devices such
     * as the text device.
     * </p>
     * 
     * @param {string}
     *            aFunction The name of the function
     * @param {any}
     *            aParam A parameter whose type is not constrained
     * @return {any} The return value of the called function.
     */
    execute : function (aFunction, aParam) {
      return this[aFunction](aParam);
    },
    
    /**
     * <p>
     * Loads the editor with the data passed in parameters.
     * </p>
     * 
     * @param {Array} aPoint
     * @param aDataSrc
     */
    load: function (aPoint, aDataSrc) {
      if (aPoint !== -1) {
        var _value = aDataSrc.getDataFor(aPoint); 
        this._setData(_value) || this.clear();
        this.set(false);        
      } else {
        this.clear()
        this.unset(false);
      }
    },
    
    /**
     * Writes the editor's current data into the given logger.
     * 
     * @param aLogger
     */
    save: function (aLogger) {
      if (this.isOptional() && !this._isOptionSet) { // Unset node => discard
        aLogger.discardNodeIfEmpty();
        return;
      }
      if (!this._data) // Empty node => no content (will be an empty XML tag)
        return;
      aLogger.write(this._data);
    },
    
    /**
     * Updates this editor with the given data. The data must provide the url
     * to the video, either by giving it directly, or by giving the whole snippet.
     * 
     * @param {string}
     *            aData May be either the "permalink" or the code's snippet
     *            from YouTube (as string) (UNSUPPORTED YET)
     */
    update: function (aData) { 
      var _success = false;     
      if (aData && (typeof(aData) == 'string') && (aData.search(/\S/) != -1)) {
        _success = (aData == this._data) || this._setData(aData);
        // the first term in case user had unselected optional video
        // and tries to select it again by validating it's URL again
      }
      if (_success) { // auto-selection of editor if necessary
        this.set(true);
      }
    },
    
    /**
     * Clears the editor, reseting it to a state where it does not contains any video. 
     * Does not change the selection state.
     */
    clear: function () {
      this._data = ''; // FIXME: this will serialize an empty string as XML content ?
      this.setModified(false);      
      this._handle.replaceChild(this._noData, this._handle.firstChild);
      var _width = this._noData.offsetWidth;
      var _height = this._noData.offsetHeight;
      with (this._handle.style) {
        width = (_width > 2 ? _width: 80) + 'px'; // defeat bug if called in a display:none context
        height = (_height > 2 ? _height: 80) + 'px';
      }
    },
    
    /**
     * <p>
     * Returns the editor's current data
     * </p>
     * 
     * @return {String} The editor's current data
     */
    getData: function () {
      if (this._data && this._data != '')
        return this._data;
      return null;
    },
    
    /**
     * 
     * @return
     */
    getDefaultData: function () {
      return this._defaultData;
    },
    
    /**
     * <p>
     * Returns the editor's current handle, that is, the HTML element where
     * the editor is "planted".
     * </p>
     * 
     * @return {HTMLElement} The editor's handle
     */
    getHandle: function () {
      return this._handle;
    },
    
    /**
     * Getter for *this* instance owner document.
     * 
     * @return {DOMDocument} The DOM document holding *this* model
     */
    getDocument : function () {
      return this._document;
    },
    
    /**
     * 
     */
    getParam: function (aKey) {
      return this._params[aKey];
    },
    
    /**
     * 
     * @return
     */
    getUniqueKey: function () {
      return this._uniqueKey;
    },
    
    /**
     * Returns true if the model contains valid data
     */
    isModified: function () {
      return this._isModified;
    },
    
    /**
     * Sets the isModified flag. Useless unless the update or load methods
     * are filtered by a filter which need to control the isModified
     * behavior.
     * 
     * @param {boolean}
     *            isModified The new value for the isModified flag
     */
    setModified : function (isModified) {
      this._isModified = isModified;
    },
    
    /**
     * 
     */
    isFocusable: function () {
      return true;
    },
    
    /**
     * 
     */
    focus: function () {
      this.startEditing(null);
    },
    
    /**
     * 
     */
    unfocus: function () {
      this._device.stopEditing();
    },
    
    /**
     * 
     */
    isOptional: function () {
      return this._isOptional;
    },

    /**
     * Returns the optionality status of *this* model, that is, if it
     * is set or unset. Only relevant if the model IS optional
     * 
     * @return {boolean} True if the model is optional and set, false
     *         otherwise
     *   
     * @see #isOptional()
     */
    isSet : function () {
      return this._isOptional && (this._isOptionSet ? true : false);
    },
    
    /**
     *      
     * @param {doPropagate} True if the method should propagate the change 
     *            of state to enclosing repeater(s)
     */
    set: function (doPropagate) {
      if (doPropagate) { // side effect
        xtiger.editor.Repeat.autoSelectRepeatIter(this.getHandle());
      }             
      if (this._isOptional && ! this._isOptionSet) {      
        this._isOptionSet = true;
        xtdom.removeClassName(this._handle, 'axel-option-unset');
        xtdom.addClassName(this._handle, 'axel-option-set');
        this._optCheckBox.checked = true;
      }
    },
    
    /**
     * 
     * @param {doPropagate} True if the method should propagate the change 
     *            of state to any enclosing repeater (NOT USED AT THAT TIME)
     */
    unset: function (doPropagate) {
      if (this._isOptional && this._isOptionSet) {
        this._isOptionSet = false;
        xtdom.removeClassName(this._handle, 'axel-option-set');
        xtdom.addClassName(this._handle, 'axel-option-unset');
        this._optCheckBox.checked = false;
      }
    },
    
    /**
     * <p>
     * Awakes the editor to DOM's events
     * </p>
     */
    awake: function () {
      var _this = this; // closure
      if (this.isOptional()) {
        xtdom.addEventListener (this._optCheckBox, 'click', function (ev) {_this.onToggleOpt(ev);}, true);
      }
      xtdom.addEventListener (this._handle, 'mouseover', function (ev) {_this.startEditing(ev);}, true);
    },
    
    /**
     * Event handler to manage a user's click on the edit button. Starts an edit action. If
     *the editor is optional and unset, do nothing.
     * 
     * @param {Event} aEvent A DOM event.
     */
    startEditing: function (aEvent) {
      var _doSelect = aEvent ? (!this._isModified || aEvent.shiftKey) : false;
      this._device.startEditing(this, 'videoLensWrapper', _doSelect);
    },
    
    /**
     * Stops the edition process on the device
     */
    stopEditing : function () {
      this._device.stopEditing();
    },
    
    /**
     * Handler for the option checkbox, toggles the selection state.
     */
    onToggleOpt: function (ev) {
      this._isOptionSet ? this.unset(true) : this.set(true);
    }
    
  }; /* END of _VideoModel class */
  
  /* Base string for key */
  var _BASE_KEY = 'video';
  
  /* a counter used to generate unique keys */
  var _keyCounter = 0;
  
  return {
    
    /**
     * <p>
     * Creates a DOM model for the video editor. This DOM model represents
     * the default content for the video editor. If a default content is
     * specified in the template, the content is updated later, in the init()
     * function.
     * </p>
     * 
     * @param {HTMLElement}
     *            aContainer the HTML node where to implant the editor
     * @param {XTNode}
     *            aXTUse the XTiger use node that caused this editor to be
     *            implanted here
     * @param {HTMLDocument}
     *            aDocument the current HTML document (in the DOM
     *            understanding of a "document") being processed
     * @return {HTMLElement} The created HTML element
     */
    createModel: function createModel (aContainer, aXTUse, aDocument) {
      var _h = xtdom.createElement(aDocument, 'div'); /* Creates the handle */
      xtdom.addClassName (_h , 'axel-core-on');
      xtdom.addClassName (_h, 'axel-core-editable');
      var _img = xtdom.createElement(aDocument, 'img');
      _img.src = xtiger.bundles.video.tvIconURL;
      
      var _optional = aXTUse.getAttribute('option');
      if (_optional) {
        var _checkbox = xtdom.createElement (aDocument, 'input');
        xtdom.setAttribute(_checkbox, 'type', 'checkbox');             
        xtdom.addClassName(_checkbox, 'axel-option-checkbox');             
        aContainer.appendChild(_checkbox);          
      }
      _h.appendChild(_img);
      
      // Sets handle width and height;
      var _tmp = xtdom.createElement(aDocument, 'div');
      _tmp.style.visibility = 'hidden';
      aDocument.getElementsByTagName('body')[0].appendChild(_tmp);
      _tmp.appendChild(_h);
      var _width, _height;
      _width = _img.offsetWidth;
      _height = _img.offsetHeight;
      _h.style.width = (_width > 2 ? _width : 80) + 'px'; // defeat bug when the template is transformed in a displayed: none context
      _h.style.height = (_height > 2 ? _height : 80) + 'px';
      
      // Appends the handle at the right place
      aContainer.appendChild(_h);
      xtdom.removeElement(_tmp);
      return _h;
    },
    
    /**
     * <p>
     * Creates the editor's from an XTiger &lt;xt:use&gt; element. This
     * method is responsible to extract the default content as well as the
     * optional parameters from the &lt;xt:use&gt; element. See the method
     * implementation for the supported default content formats.
     * </p>
     * 
     * @param {HTMLElement}
     *            aHandleNode The HTML node used as handle by the created
     *            editor
     * @param {XMLElement}
     *            aXTUse element The &lt;xt:use&gt; element that yields the
     *            new editor
     * @param {DOM
     *            document} aDocument A reference to the containing DOM
     *            document
     * @return {_VideoModel} A new instance of the _VideoModel class
     */
    createEditorFromTree: function createEditorFromTree (aHandleNode, aXTUse, aDocument) {
      var _model = new _VideoModel(aHandleNode, aDocument);
      var _data, _cur;
      _cur = aXTUse.firstChild;
      while (_cur && !_data)
      {
        switch (_cur.nodeType) {
        case aDocument.TEXT_NODE :
          if ((/\w+/).test(_cur.nodeValue))
          {
            var _data = _cur.nodeValue;
          }
          break;
        case aDocument.ELEMENT_NODE :
          if (_cur.localName = 'object')
            var _data = _cur;
        }
        _cur = _cur.nextSibling;
      }
      var _param = {};
      xtiger.util.decodeParameters(aXTUse.getAttribute('param'), _param);
      if (_param['filter'])
        _model = this.applyFilters(_model, _param['filter']);
      _model.init(_data, aXTUse.getAttribute('param'), aXTUse.getAttribute('option'), this.createUniqueKey());
      return _model;
    },
    
    /**
     * <p>
     * Creates an editor from a seed. The seed must carry the default data
     * content as well as the parameters (as a string) information. Those
     * infos are used to init the new editor.
     * </p>
     * 
     * @param {Seed}
     *            aSeed The seed from which the new editor is built
     * @param {HTMLElement}
     *            aClone The cloned handle where to implant the editor
     * @param {DOM
     *            Document} aDocument the document containing the editor
     * @return {_VideoModel} The new instance of the _VideoModel class
     * 
     * @see _VideoModel#makeSeed()
     */
    createEditorFromSeed: function createEditorFromSeed (aSeed, aClone, aDocument, aRepeater) {
      var _model = new _VideoModel(aClone, aDocument);
      var _defaultData = aSeed[1];
      var _param = aSeed[2];
      var _option = aSeed[3];
      if (_param['filter'])
        _model = this.applyFilters(_model, _param['filter']);
      _model.init(_defaultData, _param, _option, this.createUniqueKey(), aRepeater);
      return _model;
    },
    
    createUniqueKey: function createUniqueKey () {
      return _BASE_KEY + (_keyCounter++);
    }
  }
})();

xtiger.resources.addBundle('video', 
    { 'tvIconURL' : 'tv.png' } );

xtiger.editor.Plugin.prototype.pluginEditors['video'] = xtiger.util.filterable('video', xtiger.editor.VideoFactory);

/**
 * This wrapper allows the editrion of video's data
 */
var _VideoLensWrapper = function (aDocument) {
	/* The wrapped HTML device */
	this._handle;
	
	/* The handle to restore when releasing */
	this._handleToRestore;
	
	/* the document containing the wrapper */
	this._document = aDocument;
	
	/* true if the focus is in one of the fields */
	this._isFocused = false;
	
	/* if true the model is loaded with valid data */
	this._loaded = false;

	this.build();
}

_VideoLensWrapper.prototype = {

	/**
	 * Builds the wrapper HTML structure
	 */
	build : function() {
		this._topdiv = xtdom.createElement(this._document, 'div');
		xtdom.addClassName(this._topdiv, 'axel-lens-container');
		with (this._topdiv) {
			style.display = 'none';
			style.minWidth = '200px';
		}
		var _innerHTML = '';
		_innerHTML += '<div style="background: none; position: relative"> </div>'; // mask
																					// div
		_innerHTML += '<div class="axel-lens-containerstyle" style="width: 410px; padding: 5px; position: relative">';
		_innerHTML += '<p style="';
		_innerHTML += 'display: none; font-size: 7pt; cursor: pointer; ';
		_innerHTML += 'text-decoration:underline; text-align: right; margin: 0;';
		_innerHTML += '">delete</p>';
		_innerHTML += '<div>';
		_innerHTML += '<label for="videolensinput" style="display: block">Paste url here</label>';
		_innerHTML += '<input type="text" name="videolensinput" value="" style="width: 90%"></input>';
		_innerHTML += '</div>';
		_innerHTML += '<div style="text-align: center">';
		_innerHTML += '<button>Cancel</button>';
		_innerHTML += '<button>Save</button>';
		_innerHTML += '</div></div>';
		this._topdiv.innerHTML = _innerHTML;
		this._maskdiv = this._topdiv.firstChild;
		this._contentdiv = this._maskdiv.nextSibling;
		this._deletespan = this._contentdiv.firstChild;
		this._inputdiv = this._deletespan.nextSibling;
		this._input = this._inputdiv.firstChild.nextSibling;
		this._buttondiv = this._inputdiv.nextSibling;
		this._cancelbutton = this._buttondiv.firstChild;
		this._savebutton = this._buttondiv.firstChild.nextSibling;
		// event handlers
		var _this = this;
		this._handlers = {
			clearModel : [ this._deletespan, 'click', function(ev) {
				_this.clearModel()
			} ],
			onInputBlur : [ this._input, 'blur', function(ev) {
				_this._onInputBlur(ev)
			} ],
			onInputFocus : [ this._input, 'focus', function(ev) {
				_this._onInputFocus(ev)
			} ],
			onInputKeyDown : [ this._input, 'keydown', function(ev) {
				_this._onInputKeyDown(ev)
			} ],
			onInputKeyUp : [ this._input, 'keyup', function(ev) {
				_this._onInputKeyUp(ev)
			} ],
			onCancel : [ this._cancelbutton, 'click', function(ev) {
				_this._onCancel(ev)
			} ],
			onSave : [ this._savebutton, 'click', function(ev) {
				_this._onSave(ev)
			} ]
		}
	},

	/**
	 * Grabs the wrapper, awakes its listeners and displays it
	 */
	grab : function(aDevice, aDoSelect, aPadding) {
		if (this._currentDevice)
			this.release();
		this._currentDevice = aDevice;

		var _handle = this._currentDevice.getCurrentModel().getHandle();
		_pad = (aPadding[0] >= 10) ? aPadding[0] : 10;

		// fixes elements' size
		var _width = _handle.offsetWidth;
		var _height = _handle.offsetHeight;
		if (xtiger.cross.UA.IE) { // IE does include padding in elements' width
									// and height
			_width += 2 * _pad;
			_height += 2 * _pad;
		}
		with (this._topdiv.style) {
			display = 'block';
			width = _width + 'px';
			padding = _pad + 'px';
		}
		with (this._maskdiv.style) {
			border = '' + _pad + 'px solid rgb(115, 166, 42)';
			width = _width + 'px';
			height = _height + 'px';
			if (!xtiger.cross.UA.IE) { // all browser but IE
				left = '-' + _pad + 'px';
				top = '-' + _pad + 'px';
			}
		}
		with (this._contentdiv.style) {
			if (!xtiger.cross.UA.IE) {
				left = '-' + _pad + 'px';
				top = '-' + _pad + 'px';
			}
		}
	
		this._cancelbutton.disabled = false; // always enabled
		this._savebutton.disabled = true; // enabled only once data has been input
	
		// Updates input's value
		if (this._currentDevice.getCurrentModel().isModified()) {
			this.setData(this._currentDevice.getCurrentModel().getData());
			this._deletespan.style.display = 'block';
			this._loaded = true;
		} else {
			var _message = this._currentDevice.getCurrentModel().getParam(
					'inputFieldMessage');
			this.setData(_message); // defeat IE and opera's "null" bug
			this._loaded = false;
		}
	
		// subscribes to events
		for ( var k in this._handlers) {
			xtdom.addEventListener(this._handlers[k][0], this._handlers[k][1],
					this._handlers[k][2], true);
		}
	},
	
	/**
	 * Terminates the wrapper installation after the lens has been made visible
	 */ 
	activate : function(aDevice, doSelectAll) {
		// nope
	},

	/**
	 * Releases the wrapper, unregisters all events handlers
	 */
	release : function() {
		if (!this._currentDevice)
			return;
		// unsubscribes from events
		for ( var k in this._handlers) {
			xtdom.removeEventListener(this._handlers[k][0], this._handlers[k][1],
					this._handlers[k][2], true);
		}
		this._deletespan.style.display = 'none';
		this._currentDevice = null;
		xtdom.removeElement(this._topdiv);
	},
	
	/**
	 * Returns the wrapper's handle
	 * 
	 * @return {HTMLElement}
	 */
	getHandle : function() {
		return this._topdiv;
	},
	
	/**
	 * <p>
	 * Returns the input field content.
	 * </p>
	 * 
	 * @return {string}
	 */
	getData : function() {
		return this._input.value;
	},
	
	/**
	 * Sets the data hold by the wrapper's input field.
	 * 
	 * @param {string}
	 *            aData The data to set
	 */
	setData : function(aData) {
		// defeat IE and opera's "null" bug
		this._input.value = (aData && typeof (aData) == 'string') ? aData : '';
	},

	/**
	 * 
	 * @return
	 */
	isFocusable : function() {
		return true;
	},
	
	/**
	 * Asks the model to clear itself.
	 */
	clearModel : function() {
		if (!this._currentDevice)
			return;
		this._input.value = '';
		this._currentDevice.getCurrentModel().clear();
		this._currentDevice.keepAlive(false);
		this._currentDevice.getCurrentModel().unfocus();
	},
	
	/**
	 * Toggles between the lens' fields. Useless here as the lens only has one
	 * field.
	 */
	toggleField : function() {
		// nope, only one field
	},
	
	/**
	 * Event handler called when the input field losts the focus.
	 * 
	 * @param {Event}
	 *            ev
	 */
	_onInputBlur : function(ev) {
		this._currentDevice.keepAlive(false);
	},
	
	/**
	 * Event handler called when the input field gains the focus.
	 * 
	 * @param {Event}
	 *            ev
	 */
	_onInputFocus : function(ev) {
		if (this._loaded) {
			var _aStartPos = 0;
			var _aEndPos = this._input.value.length;
	
			if (this._input.setSelectionRange) {
				this._input.setSelectionRange(_aStartPos, _aEndPos);
			} else if (this._input.createTextRange) { // IE
				var oRange = this._input.createTextRange();
				oRange.moveStart("character", _aStartPos);
				oRange.moveEnd("character", _aEndPos);
				oRange.select();
			}
		} else {
			this._input.value = '';
		}
		this._currentDevice.keepAlive(true);
	},
	
	/**
	 * Saves the current value of the input. This value is used later to enable the
	 * buttons.
	 */
	_onInputKeyDown : function(ev) {
		this._savedValue = this._input.value;
	},
	
	/**
	 * Detects the keyup event on the input field. If the input's value has changed,
	 * buttons are awakened.
	 * 
	 * @param ev
	 *            {The event}
	 * @return
	 */
	_onInputKeyUp : function(ev) {
		if (this._input.value != this._savedValue) {
			this._cancelbutton.disabled = false;
			this._savebutton.disabled = false;
		}
	},
	
	/**
	 * Event handler for a click on the "cancel" button
	 * 
	 * @param {Event}
	 *            ev The "click" event
	 */
	_onCancel : function(ev) {
		if (!this._currentDevice)
			return;
		this._currentDevice.cancelEditing();
		xtdom.stopPropagation(ev);
	},
	
	/**
	 * Event handler for a click on the "save" button
	 * 
	 * @param {Event}
	 *            ev The "click" event
	 */
	_onSave : function(ev) {
		if (!this._currentDevice)
			return;
		this._currentDevice.stopEditing();
		xtdom.stopPropagation(ev);
	}
}

xtiger.factory('lens').registerWrapper('videoLensWrapper', function (aDocument) {return new _VideoLensWrapper(aDocument)});/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * <p>
 * This object acts as a filter on model's instances (formerly named editors).
 * It catches calls made on the filtered method to add some behavior. Here the
 * behavior is to notify the relevant service with updates.
 * </p>
 * 
 * <p>
 * As this object is used in a delegation pattern, model's instances that are
 * filtered still appear as "usual" instances. That is, their external API is
 * kept unchanged.
 * </p>
 */
xtiger.service.ServiceFilter = (function _ServiceFilter () {    
	
	var _triggerServiceCb = function _triggerServiceCb(ev) {
		var handle = ev.target.previousSibling;
		var that = handle ? handle.xttPrimitiveEditor : undefined;
		if (that) {
			var aData = that.getData();
			var _serviceKey = that._getServiceKey(); 
			// TBD: factorize with update() to manage configurator role
			if (_serviceKey.producer) {
				that._notifyServices(_serviceKey.producer, 'notifyUpdate', that.getHandle(true), aData);
				if (that._serviceHookFlag) { // dismiss button (service_trigger=auto)
					_hideButton(that);
					that._serviceHookFlag = false;
				}
			}  
		} else {
			xtiger.cross.log('error', 'canno\'t find source editor in service trigger callback');
		}
	}     
	                     
	// Returns the trigger button (DOM element) associated with editor
	// if it exists or undefined otherwise
	var _getTriggerButton = function _getTriggerButton(editor) {   
		h = editor.getHandle(true);  
		trigger = h ? h.nextSibling : undefined;
		if (trigger &&  trigger.className && (trigger.className.search('axel-service-trigger') != -1)) {
			return trigger;
		}
	}
                                 
	// Displays the trigger button associated with the editor 
	// This button is used to manually trigger service events 
	// (e.g. to manually simulate editing after loading data from file)
	// Creates the button if it does not exist (lazy creation)
	var _showButton = function _showButton(editor) {   
		var guard, parent,
			h = editor.getHandle(true), 
			trigger = _getTriggerButton(editor);
		if (trigger) {
			// makes trigger button visible
			xtdom.removeClassName(trigger, 'axel-core-off');
		} else {
			// creates trigger button
			trigger = xtdom.createElement(editor.getDocument(), 'input');
			trigger.setAttribute('type', 'button');
			trigger.setAttribute('value', editor.getParam('service_label') || 'suggest');
			xtdom.addClassName(trigger, 'axel-service-trigger');
			guard = xtdom.createElement(editor.getDocument(), 'span');      
			// fixed boundary for AXEL marker
			xtdom.addClassName(guard, 'axel-core-boundary');
			parent = h.parentNode;			
			if (h.nextSibling) {
				parent.insertBefore (guard, h.nextSibling, true);
				parent.insertBefore (trigger, guard, true);
			} else {
				parent.appendChild(trigger);				
				parent.appendChild(guard);
			} 
			xtdom.addEventListener(trigger, 'click', _triggerServiceCb, false);
		}
	}   
	
	var _hideButton = function _hideButton(editor) {   
		var trigger = _getTriggerButton(editor);		
		if (trigger) { /// defensive
			xtdom.addClassName(trigger, 'axel-core-off');
		}
	}		

	var _triggerOn = function _triggerOn(editor, condition) {
		var m = editor.getParam('service_trigger');
		return (m && (m.indexOf(condition) != -1)) || 
					  ((! m) && (condition == 'update')) || 
					  ((m && (m.indexOf('load') != -1)) && (condition == 'update'));
						   // 'load' implies 'update'
	}  

	// Calls callback of service iff candidates service key match with candidate          
	// Passes originating model, resource name and optional data to callback
	var _invoke = function _invoke(model, service, callback, candidates, data) {
		var curKey = service.getKey();
		if (curKey) {
			for (var i = 0; i < candidates.length; i++) {
				if (candidates[i].key == curKey) {      
					service[callback](model, candidates[i].resource, data);
				}
			}
		}
	}	

	return {      

		/**
		 * Remap property
		 */
		'->': {
			'init': '__serviceSuperInit',
			'update': '__serviceSuperUpdate',
			'remove': '__serviceSuperRemove',
			'load': '__serviceSuperLoad'			
		},  
		
		/**
		 * <p>
		 * Iterates over the left-siblings and ancestors of node startFrom,
		 * skipping extra repeat slices if startFrom starts inside a repeat
		 * slice. Find services and call their update method if their key
		 * matches on of the producers key given as parameter
		 * 
		 * FIXME: maybe we should skip unactivated choice slices or give as a
		 * guidelines not to put service into it?
		 * 
		 * @param {Array} someRegistrations 
		 * 				  List of hash(es) representing pairs of a resource name 
		 * 				  registered in a given context {key: context, resource: resource name }
		 */
		_notifyServices : function _notifyServices (someRegistrations, aMessage, aStartNode, aData) {  
			var r;
			var cur = aStartNode;
			var startCount = 0;
			var endCount = 0;
			while (cur) {            
				if (cur.xttService && cur.xttService[aMessage]) {
					_invoke(this, cur.xttService, aMessage, someRegistrations, aData);
				}
				if (cur.startRepeatedItem) {	startCount++;	}
				if ((cur != aStartNode) && cur.endRepeatedItem) {
					endCount++;	 // does not count if repeat starts and ends on the node it landed on
				}
				// NOTE: isBoundarySafe in generator.js should prevent startRepeatedItem and endRepeated being on the same node
				if (startCount > endCount) {
					r = cur.startRepeatedItem;
					// jumps at the begining of this repeater
					cur = r.getFirstNodeForSlice(0);
					startCount = endCount = 0; // reset counting  
				}	
				cur = cur.previousSibling;
			}
			if (aStartNode.parentNode) {         
				// FIXME: we could define a .xtt-template-root in the DOM since the template may not start at document root ?
				this._notifyServices (someRegistrations, aMessage, aStartNode.parentNode, aData);
			}
		},
		 
		/**
		 * Returns a contruct representing the model's service keys "{context}:{role}[resource]"
		 * 
		 * @return { {aRole : [ { key : aContextKey, resource: aResourceName }, ... ], ...} }
		 */
		_getServiceKey : function _getServiceKey () {                                         
			var keyString = this.getParam('service_key');  // key:role[resource]
			var keys = keyString.split(' ');
			var spec = {}; // Hash of role (e.g. 'producer')  
			for (var i = 0; i < keys.length; i++) {
				var m = keys[i].match(/^([\w-_]+):(\w+)\[(.*)\]$/);
				var role = m[2];
				if (role) { // role is defined
					if (! spec[role])
						spec[role] = [];
				 	spec[role].push( { key : m[1], resource : m[3] } );
				}                      
			}
			return spec;                    
		},
		
		/**
		 * <p>
		 * Method called from a service. Returns true if the filter is interested
		 * in the key as a *consumer*. The key must match the service key (scope)
		 * and the resource key.
		 * </p>
		 *
		 * @return {boolean} True if the model (editor) has a matching (key +
		 *         resource) service registration key
		 */
		checkServiceKey : function checkServiceKey (aContext, aResource) {
			var spec = this._getServiceKey();
			if (spec.consumer) {      
				for (var i = 0; i < spec.consumer.length; i++) {
					if ((aContext == spec.consumer[i].key) && (aResource == spec.consumer[i].resource)) {  
						return true; // found a Match
					}
				}
			}
			return false;
		},
		
		/**                   
		 * Installs the service button if this the first time creation of the editing field 
		 * and the field is a producer with service_trigger set to 'button'. 
		 *
		 * Asks for an update from the service if this is not the first time creation
		 * but a duplication from a repeater and the field is a producer.
		 *
		 * See also init in Plugin API.
		 */
		init : function init (aDefaultData, aParams, aOption, aUniqueKey, aRepeater) {
			var _serviceKey, trigger;
			this.__serviceSuperInit(aDefaultData, aParams, aOption, aUniqueKey, aRepeater);
			if (aRepeater) { 
				_serviceKey = this._getServiceKey();
				if (_serviceKey.consumer) {
					// gives a chance to "pull" service data that may be available (e.g. pending suggestion)					
					this._notifyServices(_serviceKey.consumer, 'askUpdate', aRepeater.getFirstNodeForSlice(0));
				}
			} else {                    
				_serviceKey = this._getServiceKey(); 
				if (_serviceKey.producer && _triggerOn(this, 'button')) {
					_showButton(this);	  
					// only lazy creation in load for _triggerOn(this, 'auto')
				}   
		    }				
		},     
		   
		// Subscribes to event after duplication by a repeater (i.e. + or load)
		duplicate : function duplicate(srcRepeater) {
			var trigger,
				_serviceKey = this._getServiceKey();                     
			if (_serviceKey && _serviceKey.producer) {
				trigger = _getTriggerButton(this);
				if (trigger) {
					xtdom.addEventListener(trigger, 'click', _triggerServiceCb, false);
				}
			}
		},
		                           
		/**
		 * Filters calls on update() method to notify the service, if *this* is
		 * a producer.
		 * 
		 * @param {string}	aData
		 * 			New value that will be copied into the model
		 * @param {string}	dontNotifyEvent                           
		 *          Optional boolean set to true to avoid sending an event on update.
		 *          This is recommended to avoid "loops" when calling update 
		 * 			from a service delegate
		 */
		update : function update (aData, dontNotifyEvent) {
			var _serviceKey = this._getServiceKey();
			var modified = (aData != this.getData());
			if (modified && (_triggerOn(this, 'update') || _triggerOn(this,'auto'))) {       
				if (_serviceKey.producer || _serviceKey.configurator) { 
					if (dontNotifyEvent) {
						// short circuit to avoid loops when update is called from a service delegate
						// xtiger.cross.log('debug','short circuits propagation');
					} else {
						if (_serviceKey.producer)
			 			{						
							this._notifyServices(_serviceKey.producer, 'notifyUpdate', this.getHandle(true), aData);
						} else if (_serviceKey.configurator) {
							this._notifyServices(_serviceKey.configurator, 'configure', this.getHandle(true), aData);
						}				
					}
				}
				if (this._serviceHookFlag) { // dismiss button (service_trigger=auto)
					_hideButton(this);
					this._serviceHookFlag = false;
				}
			}
			// Chains call to update at the end so that service delegates 
			// may obtain the legacy value of the producer model with getData
			this.__serviceSuperUpdate(aData);
		},     
		
		load : function load (aPoint, aDataSrc) {
			var _serviceKey;
			this.__serviceSuperLoad(aPoint, aDataSrc);
			if (_triggerOn(this, 'auto')) {
				_showButton(this);
				this._serviceHookFlag = true;
			} else if (_triggerOn(this, 'load')) {
				_serviceKey = this._getServiceKey();
				if (_serviceKey.producer)
	 			{						
					this._notifyServices(_serviceKey.producer, 'notifyLoad', this.getHandle(true), this.getData());
				} else if (_serviceKey.consumer) {
					this._notifyServices(_serviceKey.consumer, 'askUpdate', this.getHandle(true));
				} // FIXME: add configurator case ?
			}
		},		
		
		/**
		 * Hook to notify the service that *this* model was removed from a
		 * repeat
		 */
		remove: function remove () {
			var _serviceKey = this._getServiceKey();
			if (_serviceKey.producer) {
				this._notifyServices(_serviceKey.producer, 'notifyRemove', this.getHandle(true), this.getData());
			}               
			this.__serviceSuperRemove();
		}
	}	
	
})();

xtiger.editor.Plugin.prototype.pluginEditors['video'].registerFilter('service', xtiger.service.ServiceFilter);
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('service', xtiger.service.ServiceFilter);
xtiger.editor.Plugin.prototype.pluginEditors['richtext'].registerFilter('service', xtiger.service.ServiceFilter);
xtiger.editor.Plugin.prototype.pluginEditors['link'].registerFilter('service', xtiger.service.ServiceFilter);
xtiger.editor.Plugin.prototype.pluginEditors['photo'].registerFilter('service', xtiger.service.ServiceFilter);
xtiger.editor.Plugin.prototype.pluginEditors['select'].registerFilter('service', xtiger.service.ServiceFilter);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
  * Class NoXMLFilter (filter mixin)
  * 
  * @class _NoXMLFilter
  */
var _NoXMLFilter = (function _NoXMLFilter() {
 	return {  

 		// No mapping
 		'->': {
		},   

 		load : function (point, dataSrc) {
			// do not load
 		},		

 		save : function (text) {
			// do not save
 		}
   }    	
 })();

// Do not forget to register your filter on any compatible primitive editor plugin
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('noxml', _NoXMLFilter);   
xtiger.editor.Plugin.prototype.pluginEditors['select'].registerFilter('noxml', _NoXMLFilter);   

// TBD : 'hidden' filter (forces handle's style to display:'none') 



 /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * <p>
 * This object acts as a filter on model's instances (formerly named editors).
 * It catches calls made on the filtered method to add some behavior. Here the
 * behavior is to produce some output on some output channel (a console, a
 * dedicated part of the DOM, alert box or whatever) as calls are made on the
 * model.
 * </p>
 * 
 * <p>
 * As this object is used in a delegation pattern, model's instances that are
 * filtered still appear as "usual" instances. That is, their external aspect is
 * kept unchanged.
 * </p>
 */
var _DebugFilter  = (function _DebugFilter () {    

    function _printDebugTrace (aModel, aFunction, aValue, aComment) {
    	var _buf = '';
    	_buf += '[' + aModel.getUniqueKey() + ']';
    	_buf += ' : ' + aFunction;
    	_buf += '(';
    	if (aValue)
    		_buf += aValue;
    	_buf += ')'
    	if (aComment)
    		_buf += ' : ' + aComment;
    	xtiger.cross.log('debug', _buf);
    };
    
    function _arrayPP (aArray) {
    	var _buf = '['
    	for (var _i = 0; _i < aArray.length; _i++) {
    		_buf += aArray[_i] + ', ';
    	}
    	return _buf;
    }

	return {      

		/**
		 * Remap property
		 */
		'->': {
			'create': '__debugSuperCreate',
			'init': '__debugSuperInit',
			'load': '__debugSuperLoad',
			'save': '__debugSuperSave',
			'update': '__debugSuperUpdate',
			'clear': '__debugSuperClear',
			'getData': '__debugSuperGetData',
			'focus': '__debugSuperFocus',
			'unfocus': '__debugSuperUnfocus',
			'set': '__debugSuperSet',
			'unset': '__debugSuperUnset',
			'awake': '__debugSuperAwake',
			'startEditing': '__debugSuperStartEditing',
			'stopEditing': '__debugSuperStopEditing'
		},
		
		create : function create () {
			_printDebugTrace(this, 'create');
			this.__debugSuperCreate();
		},
		
		init : function init (aDefaultData, aParams, aOption, aUniqueKey) {
			var _params = '' + aDefaultData
			if (typeof aParams == 'string')
				_params += aParams;
			else
				_params += ', ' + _arrayPP(aParams);
			_params += ', ' + aOption
			_params += ', ' + aUniqueKey;
			_printDebugTrace(this, 'init', _params);
			this.__debugSuperInit(aDefaultData, aParams, aOption, aUniqueKey);
		},
		
		load : function load (aPoint, aDataSrc) {
			_printDebugTrace(this, 'load');
			this.__debugSuperLoad(aPoint, aDataSrc);
		},
		
		save : function save (aLogger) {
			_printDebugTrace(this, 'save');
			this.__debugSuperSave(aLogger);
		},
		
		update : function update (aData) {
			_printDebugTrace(this, 'update', aData, 'Old data = ' + this.__debugSuperGetData());
			this.__debugSuperUpdate(aData);
		},
		
		clear : function clear () {
			_printDebugTrace(this, 'clear', null, 'Old data = ' + this.__debugSuperGetData());
			this.__debugSuperClear();
		},
		
		getData : function getData () {
			_printDebugTrace(this, 'getData');
			return this.__debugSuperGetData();
		},
		
		focus : function focus () {
			_printDebugTrace(this, 'focus');
			this.__debugSuperFocus();
		},
		
		unfocus : function unfocus () {
			_printDebugTrace(this, 'unfocus');
			this.__debugSuperUnocus();
		},
		
		set : function set () {
			if (this.isOptional())
				_printDebugTrace(this, 'set');
			else
				_printDebugTrace(this, 'set', null, 'Warning, thring to set a non-optional editor');
			this.__debugSuperSet();
		},
		
		unset : function unset () {
			if (this.isOptional())
				_printDebugTrace(this, 'unset');
			else
				_printDebugTrace(this, 'unset', null, 'Warning, thring to unset a non-optional editor');
			this.__debugSuperUnet();
		},
		
		awake : function awake () {
			_printDebugTrace(this, 'awake');
			this.__debugSuperAwake();
		},
		
		startEditing : function startEditing (aEvent) {
			_printDebugTrace(this, 'startEditing');
			this.__debugSuperStartEditing(aEvent);
		},
		
		stopEditing : function stopEditing () {
			_printDebugTrace(this, 'stopEditing');
			this.__debugSuperStopEditing();
		}
	}	
	
})();

xtiger.editor.Plugin.prototype.pluginEditors['video'].registerFilter('debug', _DebugFilter);
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('debug', _DebugFilter);
xtiger.editor.Plugin.prototype.pluginEditors['richtext'].registerFilter('debug', _DebugFilter);
xtiger.editor.Plugin.prototype.pluginEditors['link'].registerFilter('debug', _DebugFilter);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * DocumentId stores its value into xtiger.session(doc) as "documentId"
 * When used in an invisible part of the template, this allows to generate a document identifier 
 * which can be used by some primitive plugin editors to communicate with a server (e.g. Photo upload)
 */
var _DocumentIdFilter = (function _DocumentIdFilter() {

	/////////////////////////////////////////////////
	/////    Static DocumentId Mixin Part     ///////
	///////////////////////////////////////////////// 

	// none

	return {

		///////////////////////////////////////////////////
		/////     Instance DocumentId Mixin Part    ////////
		///////////////////////////////////////////////////

		// Property remapping for chaining
		'->' : {
			'_setData' : '__DocumentIdSuperSetData'
		},

		/** Creates the entry for the identifier into the TOC using it's default text  
		 *  DOES forward call.
		 */
		_setData : function(aData) {
			this.__DocumentIdSuperSetData(aData);
			xtiger.session(this.getDocument()).save('documentId', aData);
		}
	
		/** add any other method from the filtered object that you want to override */
	
		/** add any other method you want to add to the filtered object to be called with can() / execute() */

	};

})();

//Register this filter as a filter of the 'text' plugin (i.e. text.js must have been loaded)
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter(
		'documentId', _DocumentIdFilter);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*      
 * Filter class to insert Image by URL inside a document
 *
 * There is only one filter per device (shared instance)
 */             
 
 var _ImageFilter  = (function _ImageFilter () {    

  /////////////////////////////////////////////////
  /////    Static Image Mixin Part     ////////
  /////////////////////////////////////////////////
 
  // Replaces handle text content by <img> tag
  function _genImageInside (editor, src) {
  	var h = editor.getHandle();
  	var base = editor.getParam('base');
  	xtdom.removeChildrenOf(h);			
  	var cur = xtdom.createElement(editor.getDocument(), 'img');
  	xtdom.setAttribute(cur, 'src', base ? base + src : src);
  	xtdom.setAttribute(cur, 'alt', 'image ' + src);
  	h.appendChild(cur);
  }

  // Retrieves image source from model data inside editor
  function _getImageSrcFromHandle (editor) {
  	var url;
  	var h = editor.getHandle();
  	var base = editor.getParam('base');
  	var cur = h.firstChild;
  	if (cur.nodeType != xtdom.TEXT_NODE) { // it's a filter generated <img>
  		url = cur.getAttribute('src');
  	} else {
  		url = cur.data;
  	} 
  	return (base && (url.indexOf(base) != -1)) ? url.substr(base.length, url.length) : url;
  }
	
  ////////////////////////////////////////////////////////////
  // Drag and drop callbacks
  ////////////////////////////////////////////////////////////

  // This is required to signifiy that we accept drop
  function _onDragEnter (ev) {  
  	var isLink = ev.dataTransfer.types.contains("text/uri-list");
  	if (isLink) {
  		xtdom.preventDefault(ev);
  		xtdom.stopPropagation(ev);
  	}
  }				

  function _onDragOver (ev) {  
  	xtdom.preventDefault(ev);  
  	xtdom.stopPropagation(ev);  
  }				

  // FIXME: we should subscribe to the image too when there is an image
  // because it masks the div drop dataTransfer content  
  // https://developer.mozilla.org/En/DragDrop/Drag_Operations#drop
  function _onDrop (ev) {     
    var found = false;
  	var model = ev.target.xttPrimitiveEditor || ev.target.parentNode.xttPrimitiveEditor;
  	if (model) {                      
      var link =  ev.dataTransfer.getData("URL");
      if (link.search(/(png|jpg|jpeg|gif)$/i) != -1)  {
    	  model.update(link); // same as user input
    	} else {
  	    xtiger.cross.log('warning', 'Not a supported image link (must end with png, jpg, jpeg or gif) !\n');
  	  }
  	}
  	xtdom.stopPropagation(ev);
    xtdom.preventDefault(ev);
  }     
 		
 	return {  

     ///////////////////////////////////////////////
     /////     Instance Image Mixin Part    ////////
     ///////////////////////////////////////////////

 		// Property remapping for chaining
 		'->': {
 		  'awake' : '__ImageSuperAwake',
 		  'update' : '__ImageSuperUpdate',
 		  '_setData' : '__ImageSuperSetData',
 		  'load' : '__ImageSuperLoad'
 		},  
 		      
 		// Manages two cases: 
 		// 1. if aData is an image file name then generates an <img> tag 
 		// 2. if aData is a string then forwards call to default _setData
 		_setData : function (aData) {    
			if (aData.search(/(png|jpg|jpeg|gif)$/i) != -1) { 
				_genImageInside(this, aData);
			} else {
			  var h = this.getHandle(); 
      	if (h.firstChild.nodeType != xtdom.TEXT_NODE) {
        	xtdom.removeChildrenOf(h);
        	var t = xtdom.createTextNode(this.getDocument(), '');
        	h.appendChild(t);
      	}
        this.__ImageSuperSetData(aData);
			}
 		},
 		  
 		// Tests if the input is not empty, nor the defaultContent (no editing)
 		// nor a correct file name in which case it replaces the input with 
 		// an error message. Forwards call to the default update.
		update : function (aData) {   
		  if ((aData.search(/\S/) != -1) // not empty
		    && (aData !== this.getDefaultData())  // edited content (no default)
		    && (aData.search(/(png|jpg|jpeg|gif)$/i) == -1)) { // incorrect file extension
		      this.__ImageSuperUpdate('Not a supported image file (must end with png, jpg, jpeg or gif)');
		      // be careful not to finish the error message with a correct image file extension
		  } else {
		    this.__ImageSuperUpdate(aData);
		  }
		}, 		
		
		awake : function () { 
		  this.__ImageSuperAwake()
			// FIXME: experimental feature for FF - could be factorized inside text editor ?
			// FIXME: there should be an uninit to remove event listeners
			var h = this.getHandle();
			xtdom.addEventListener (h, "dragenter", _onDragEnter, false);  
			xtdom.addEventListener (h, "dragover", _onDragOver, false);  			
			xtdom.addEventListener (h, 'drop', _onDrop, true);
		},
		
		// Loads XML data from the point into the editor
		// Converts it to an XHTML representation        		
		load : function (point, dataSrc) {       
			var src;
			// if (! dataSrc.isEmpty(point)) {  // FIXME: a node with only an attribute is treated as empty
			var n = point[0]; // DOM node carrying the image
			src = point[0].getAttribute(this.getParam('image-tag') || 'Source');
			// }			
			if ((! src) || (src.search(/(png|jpg|jpeg|gif)$/i) == -1)) { // no image
        this.__ImageSuperLoad(point, dataSrc);          
        // FIXME: should we replace content with an error message instead ?
			} else {
			  _genImageInside(this, src);
				this.setModified(true);
			  this.set(false);			  
			}
		},             
		
		// Parses model content and serializes it as XML directly into the logger
		save : function (logger) {  
			var src = _getImageSrcFromHandle (this);
			logger.openAttribute(this.getParam('image-tag') || 'Source');
			logger.write(src);
			logger.closeAttribute(this.getParam('image-tag') || 'Source');
		},      
		                 
		getData : function () {
			return _getImageSrcFromHandle (this);
		}
   };

 })();

//Register this filter as a filter of the 'text' plugin (i.e. text.js must have been loaded)
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('image', _ImageFilter);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

// Todo
// - there is a bug when the user set clear = both on one of the choices (a header)
//   if the user changes the choice the style.clear is not reset (!)
//   to solve it would require a better filter life cycle: beeing in a choice
//   which is changed should trigger onChoiceUnselet / onChoiceSelect
//   or something like that (filter API to refine...)       
// - test user input values (or replaces with a popup device)
 
/**
  * Class _ClearFilter (mixin filter)
  *
  * Sets the clear style attribute on the nth parent of the handle, 
  * where n is given by the clear parameter, to the string value
  *  entered by the user in the filtered editor.
  * 
  * @class _ClearFilter
  */
 var _ClearFilter  = (function _ClearFilter () {    

   /////////////////////////////////////////////////
   /////    Static Clear Mixin Part     ////////
   /////////////////////////////////////////////////

   var _setStyle = function _setStyle (h, text, levels) {			
 		var n = h;
 		for (var i = levels; i > 0; i--) {
 			n = n.parentNode;
 		}
 		if ((text == 'both') || (text == 'left') || (text == 'right')) {
 			n.style.clear = text;
 		} else {
 			n.style.clear = '';
 		}
 	}

 	return {  

     ///////////////////////////////////////////////////
     /////     Instance Clear Mixin Part    ////////
     ///////////////////////////////////////////////////

 		// Property remapping for chaining
 		'->': {
 	    'load': '__ClearSuperLoad', 
 		  'update': '__ClearSuperUpdate'
 		},   

 		load : function (point, dataSrc) {
 			var value;
 			if (! dataSrc.isEmpty(point)) {
 				value = dataSrc.getDataFor(point);	
 				var levels = parseInt(this.getParam('clear'));
 				_setStyle(this.getHandle(), value, levels);
 			}
 			this.__ClearSuperLoad(point, dataSrc);
 		},		

 		update : function (text) {
 			var levels = parseInt(this.getParam('clear'));
 			_setStyle(this.getHandle(true), text, levels);
 			this.__ClearSuperUpdate(text);
 		}


   }

 })();

 // Do not forget to register your filter on any compatible primitive editor plugin
 xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('clear', _ClearFilter);  

  /**
   * Class _PositionFilter (mixin filter)
   *
   * Sets the position style attribute on the nth parent of the handle, 
   * where n is given by the clear parameter, to the string value
   * entered by the user in the filtered editor.
   * 
   * <em>FIXME: currently clear parameter is not implemented !</em>
   * 
   * @class _ClearFilter
   */
 var _PositionFilter  = (function _PositionFilter () {    

   /////////////////////////////////////////////////
   /////    Static Clear Mixin Part     ////////
   /////////////////////////////////////////////////

   var _setStyle = function _setStyle (h, text) {			
 		var n = h.parentNode.parentNode.parentNode; // div containing photo + caption
 		var m = n.parentNode.getElementsByTagName('span')[0]; // span.menu
 		if ((text == 'left') || (text == 'right')) {
 			n.style.cssFloat = m.style.cssFloat = text; // FIXME: styleFloat sous IE
 			if (text == 'right') {
 				n.style.marginLeft = '20px'; // FIXME: we should better use a 'class' fiter !!!
 				n.style.marginRight = '';
 			} else {
 				n.style.marginRight = '20px';
 				n.style.marginLeft = '';
 			}
 		} else {
 			n.style.cssFloat = m.style.cssFloat =  '';
 			n.style.marginRight = '';
 			n.style.marginLeft = '';
 		}
 	}

 	return {  

     ///////////////////////////////////////////////////
     /////     Instance Clear Mixin Part    ////////
     ///////////////////////////////////////////////////

 		// Property remapping for chaining
 		'->': {
 	    'load': '__PositionSuperLoad', 
 		  'update': '__PositionSuperUpdate'
 		},   

 		load : function (point, dataSrc) {
   		var value;
   		if (! dataSrc.isEmpty(point)) {
   			value = dataSrc.getDataFor(point);
   			_setStyle(this.getHandle(), value);
   		}
 			this.__PositionSuperLoad(point, dataSrc);
 		},		

 		update : function (text) {  
 			_setStyle(this.getHandle(true), text);
 			this.__PositionSuperUpdate(text);
 		}

   };

 })();

 // Do not forget to register your filter on any compatible primitive editor plugin
 xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('position', _PositionFilter);
 /* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */    

/**
  * Class _VideoFilter (mixin filter)
  *
  * This is an experimental filter that has been developped as a replacement for the video.js lens device plugin
  * It's design is simpler as the video URL is always visible on the screen and edited through a text editor
  * The plugin adds a <br /><object>...</object><span class="axel-core-boundary"/> forrest right after the text handle
  * _extractVideoId and _buildYoutubeSnippet are copied from video.js.
  *
  * FIXME: currently you must include video.js first as it shares its bundle with it (for the TV icon URL)
  * 
  * @class _VideoFilter
  */
 var _VideoFilter  = (function _VideoFilter () {    

   /////////////////////////////////////////////////
   /////    Static Clear Mixin Part     ////////
   /////////////////////////////////////////////////

		/*
		 * Extracts You Tube video id from a valid link to the video (either
		 * the "permalink" or the page's link)
		 */
		var _extractVideoId = function _extractVideoId (aValidUrl) {
			var _tmp = aValidUrl.match(/^[^&]*/)[0];
			return _tmp.match(/[^\=\/]*$/)[0];
		}
		
		var _buildYoutubeSnippet = function _buildYoutubeSnippet (aVideoID, aSize, aParams, targetDoc) {
			var _params = aParams || {};
			_params['movie'] = aVideoID;
			if (!_params['allowFullScreen'])
				_params['allowFullScreen'] = 'true';
			if (!_params['alloscriptaccess'])
				_params['alloscriptaccess'] = 'always';
			var _obj = xtdom.createElement(targetDoc, 'object');
			if (aSize) {
				_obj.height = aSize[0];
				_obj.width = aSize[1];
			} else {
				_obj.height = 344;
				_obj.width = 425;
			}
			_obj.style.zIndex = 1000;
			for (var _param in _params) {
				var _p = xtdom.createElement(targetDoc, 'param');
				_p.name = _param;
				_p.value = _params[_param];
				_obj.appendChild(_p);
			}
			var _embed = xtdom.createElement(targetDoc, 'embed');
			xtdom.setAttribute(_embed, 'src', aVideoID);
			xtdom.setAttribute(_embed, 'type', 'application/x-shockwave-flash');
			xtdom.setAttribute(_embed, 'allowfullscreen', 'true');
			xtdom.setAttribute(_embed, 'allowscriptaccess', 'always');
			xtdom.setAttribute(_embed, 'width', '425');
			xtdom.setAttribute(_embed, 'height', '344');
			_embed.style.zIndex = 1000;
			if (xtiger.cross.UA.IE) {
				_obj = _embed;	
			} else {
				_obj.appendChild(_embed);
			}
			return _obj;
		}          
		   
		// Returns an [node, boolean] array where node is the <img> node or the <object>/<embed> node 
		// that was added by the video filter to the DOM inside extension if it finds it, or undefined,
		// and boolean is true if it is a video player node (i.e. object/embed)
		// FIXME: we could also save this information directly inside the filtered editor model !
		var _getHandleExtension = function _getHandleExtension (that) {
			var h = that.getHandle(true);                             
		  var hook = h.nextSibling ? h.nextSibling.nextSibling : undefined;
		  var isVideo = false;
			if (hook) { // node exists
				var name = xtdom.getLocalName(hook); // checks that it belongs to video filter
				if ((name.toLowerCase() == 'object') || (name.toLowerCase() == 'embed')) {
				  isVideo = true;
				} else if (name.toLowerCase() != 'img') {
				  hook = undefined;
				}
	 		}
	 		return [hook, isVideo];
    }		

 	return {  

     /////////////////////////////////////////
     /////     Instance Mixin Part    ////////
     /////////////////////////////////////////

 		// Property remapping for chaining
 		'->': {
 	    'init': '__videoSuperInit', 
 	    'set': '__videoSuperSet', 
 	    'unset': '__videoSuperUnset', 
 	    '_setData': '__videoSuperSetData'
 		},   
                               
		_setData : function (text) {
		  var extension = _getHandleExtension(this); 
		  // pas d'effet de bord sur Boolean
		  var filtered = text; 
			if (extension[0]) {
				if (text != this.getDefaultData()) {
          // var cur = this.getHandle().firstChild.data;    
					var cur = this.getData();    
					// FIXME: we could check that it's a valid URL or object first ?
					var _videoID = _extractVideoId(text);
					var data = 'http://www.youtube.com/v/' + _videoID;
					if (cur != data) {
						var _newContent = _buildYoutubeSnippet(data, null, null, this.getDocument());
						extension[0].parentNode.replaceChild(_newContent, extension[0]);
						filtered = data;
					}
				} else if (extension[1]) { // resets video icon if it wasn't  
					var img = xtdom.createElement(this.getDocument(), 'img');
					img.src = xtiger.bundles.video.tvIconURL;                 
					extension[0].parentNode.replaceChild(img, extension[0]);
				}
	 		}
	 		this.__videoSuperSetData(filtered);			
		},

    // FIXME: missing 'repeater' argument to know if init is called from a repeater
		init : function (aDefaultData, aParams, aOption, aUniqueKey, repeater)  {
			if (! repeater) {
				var h = this.getHandle();
				var br = xtdom.createElement(this.getDocument(), 'br');
				var img = xtdom.createElement(this.getDocument(), 'img');
				var guard = xtdom.createElement(this.getDocument(), 'span');      
				xtdom.addClassName(guard, 'axel-core-boundary');
					// fixed boundary for AXEL marker
					// it will not be removed when chaging img to object and vice-versa
				img.src = xtiger.bundles.video.tvIconURL;
				var parent = h.parentNode;			
				if (h.nextSibling) {
					parent.insertBefore (guard, h.nextSibling, true);
					parent.insertBefore (img, guard, true);
					parent.insertBefore (br, img, true);
				} else {
					parent.appendChild(br);
					parent.appendChild(img);				
					parent.appendChild(guard);
				}    
		 	} // otherwise repeater has cloned everything		 	
		  this.__videoSuperInit(aDefaultData, aParams, aOption, aUniqueKey);
		  // call super init at the end because it triggers a call to _setData and eventually to set or unset 
		  // all of which require that the handle extension has been initialized first
		},     
		
		set : function (doPropagate) {
		  this.__videoSuperSet(doPropagate);
		  if (this.isOptional()) {
		    var h = this.getHandle(true);
		    if (h.nextSibling && h.nextSibling.nextSibling) {
  			  xtdom.replaceClassNameBy (h.nextSibling.nextSibling, 'axel-option-unset', 'axel-option-set');
  			}
  		}
		},
		
		unset : function (doPropagate) {
		  this.__videoSuperUnset(doPropagate);
		  if (this.isOptional()) {
  			var h = this.getHandle(true);
		    if (h.nextSibling && h.nextSibling.nextSibling) {
  			  xtdom.replaceClassNameBy (h.nextSibling.nextSibling, 'axel-option-set', 'axel-option-unset');
  			}
  	  }
		}		
	}

 })();            
 
//Register this filter as a filter of the 'text' plugin (i.e. text.js must have been loaded)
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('video', _VideoFilter);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */                          
 
 // FIXME: filter init function to create a wiki_lang property in the host model
 // which is set to 'html' or 'default' but no other value !
 
/**
 * Wiki Filter Mixin Class to manage rich text. The filter can produce and load 
 * two types of XML markup depending on the value of the "wiki_lang" parameter 
 * of the plugin. If it's value is 'html' it produces a <span> and <a> forrest,
 * if it has no value or is set to 'default' it produces a <Fragment> and <Link>
 * forrest. This mixin can be applied to plugin model instances.
 * See the list of registered plugins at the end of the file.
 */
var _WikiFilter = (function _WikiFilter() {    
  
  ////////////////////////////////////////////
  /////    Static Wiki Mixin Part     ////////
  ////////////////////////////////////////////

	var _markers_re = "\\*|'";
                                      
  // FIXME: the URL scanner could be improved, at the moment it accepts '&' and ';' because
  // characters entities are replaced before scanning and http://url&param=stg[link] 
  // will be parsed as http://url&amp;param=stg[link] 
	var _scanner = new RegExp(
			"(http:\/\/[\\.\\w\/\\-\\?\\=_&;#]*)\\[([^\\]]*)\\]|(" + _markers_re
					+ "){2}(.*?)\\3{2}", "g");
					
  var _tagname = { 
    'html' :  { 'Fragment' : 'span', 
                'FragmentKind' : 'class', 
                'Link' : 'a' },
    'default' : { 'Fragment' : 'Fragment', 
                'FragmentKind' : 'FragmentKind', 
                'Link' : 'Link' }
  }

	var _markers = {
		"em" : 'important', // XHTML to XML conversion
		"tt" : 'verbatim',
		'important' : 'em', // XML to XHTML converstion
		'verbatim' : 'tt',
		"*" : 'em', // ASCII to XHTML conversion
		"'" : 'tt'
	}

	var _markers2ascii = {
		"em" : '**', // XHTML to ASCII conversion
		"tt" : "''"
	}

	/**
	 * Scanner function to convert wiki-formatted text to html. Design to
	 * be used as a callback in the String.replace() function.
	 */
	var _text2html = function _text2html (str, href, anchor, marker, marked) {
		if (href) {
			return "<a href='" + xtiger.util.encodeEntities(href)
					+ "' target='_blank'>" + xtiger.util.encodeEntities(anchor)
					+ "</a>";
		} else if (marker) {
			var tag = _markers[marker];
			var cl = _markers[tag];
			return "<" + tag + ' class="' + cl + '"' + ">"
					+ xtiger.util.encodeEntities(marked) + "</" + tag + ">";
		}
	}
	
	// Returns in an array only the element node children of n
	var _getElementChildren = function _getElementChildren (aNode) {
		var res = [];
		var c = aNode.childNodes;
		for ( var i = 0; i < c.length; i++) {
			var cur = c.item(i);
			if (cur.nodeType == xtdom.ELEMENT_NODE) {
				res.push(cur);
			}
		}
		return res;
	}
	
	/**
	 * Dumps a <Fragment>
	 */
	var _dumpFragment = function _dumpFragment (aBuffer, aFragment, aDocument, lang) {  
		var _cur;
		var _parent = aBuffer;
		var _content = aFragment.firstChild ? aFragment.firstChild.nodeValue
				: '';
		var _type = aFragment.getAttribute(_tagname[lang]['FragmentKind']);
		var tag = _type ? _markers[_type] : null; // Supported FragmentKind
												// (otherwise will be
												// dismissed)
		if (tag) {
			_cur = xtdom.createElement(aDocument, tag);
			xtdom.setAttribute(_cur, 'class', _type);
			_parent.appendChild(_cur);
			_parent = _cur;
		}
		if (_parent.lastChild && (_parent.lastChild.nodeType == xtdom.TEXT_NODE)) {
			_parent.lastChild.appendData(_content); // completes the existing text
		} else {
			_cur = xtdom.createTextNode(aDocument, _content);
			_parent.appendChild(_cur);
		}
	}
	
	/** 
	 * Dumps a <Link>
	 * 
	 */
	var _dumpLink = function _dumpLink (aBuffer, aLink, aDocument, lang) {
		var linktextnode, url;
		if (lang == 'html') {                                                            
		  linktextnode = aLink;
      url = aLink.getAttribute('href');
		} else {
  		var c = _getElementChildren(aLink); // LinkText & LinkRef
  		var name = xtdom.getLocalName(c[0]);
  		var itext = iref = 0;
  		if (name == 'LinkText') { 
  			iref = 1; // LinkRef is in second position
  		} else {
  		  itext = 1; // LinkText is in second position
  		} 
  		linktextnode = c[itext];
  		url = c[iref].firstChild ? c[iref].firstChild.nodeValue : '';
    }
		var a = xtdom.createElement(aDocument, 'a');
		var content = linktextnode.firstChild ? linktextnode.firstChild.nodeValue : 'url'; 
		var anchor = xtdom.createTextNode(aDocument, content);
		a.appendChild(anchor);
		a.setAttribute('href', url);
		aBuffer.appendChild(a);
	}
	
	_dumpContent = function _dumpContent (aBuffer, aContent, aDocument, lang) {    
		var name;
		var c = _getElementChildren(aContent);
		for ( var i = 0; i < c.length; i++) {
			name = xtdom.getLocalName(c[i]);
			if (name == _tagname[lang]['Fragment']) {
				_dumpFragment(aBuffer, c[i], aDocument, lang);
			} else if (name == _tagname[lang]['Link']) {
				_dumpLink(aBuffer, c[i], aDocument, lang);
			}
			// FIXME: otherwise maybe we could consider n textual content as a <Fragment> ?
		}
	}          
		
	_getPopupDevice = function _getPopupDevice (aDocument) {
		var devKey = 'popupdevice';
		var device = xtiger.session(aDocument).load(devKey);
		if (! device) {  // lazy creation
			device = new xtiger.editor.PopupDevice (aDocument); // hard-coded device for this model
			xtiger.session(aDocument).save(devKey, device);
		}
		return device;
	}

	return {     
	  
    //////////////////////////////////////////////
    /////     Instance Wiki Mixin Part    ////////
    //////////////////////////////////////////////

		'->': {
			'load': '_wikiSuperLoad',
			'startEditing': '_wikiSuperStartEditing'
		},             
		
  	/**
  	 * Replaces the default _setData by a similar function that interprets data as wiki language.
  	 */
  	_setData: function _setData (aData) {
  		try {
  			// FIXME: sanitize to avoid Javascript injection ! 
  			// text2html will encode entities (so it can match & in URLs) 
  			this.getHandle().innerHTML = xtiger.util.encodeEntities(aData).replace(_scanner, _text2html);
  		} catch (e) {         
  			xtiger.cross.log('error', "Exception " + e.name + "\n" + e.message);
  			try {
  		    this.getHandle().innerHTML = xtiger.util.encodeEntities(aData) + " (Exception : " + e.name + " - " + e.message + ")";
  		  } catch (e) {
  		    // nop  		    
  		  }
  		}
  	},		
		 
		/**
		 * Loads XML data from the point into the editor. Converts it to an XHTML representation.
		 * DOES forward the call only if data source is empty.
		 */
		load: function load (aPoint, aDataSrc) {
			// FIXME: manage spaces in source
			if (aDataSrc.isEmpty(aPoint)) {
				this._wikiSuperLoad(aPoint, aDataSrc); // no content : default behavior
			} else {
				var h = this.getHandle();
				xtdom.removeChildrenOf(h);			
        // var cur = xtdom.createTextNode(this.getDocument(), '');
        // h.appendChild(cur);
				_dumpContent (h, aPoint[0], this.getDocument(), this.getParam('wiki_lang') || 'default');
				this.setModified(true);
			  this.set(false);
			}
		},   

		/**
		 * Parses current editor content and serializes it as XML directly into the logger.
		 * DOES NOT forward the call.
		 * 
		 * @param aLogger
		 * 
		 * NOTE: does not call super function. Unnecesasry as save() should
		 * never have side-effects
		 */
		save: function save (aLogger) {
		  if (this.isOptional() && !this._isOptionSet) {
				aLogger.discardNodeIfEmpty();
				return;
			}			
			var name, anchor, href, tag;
			var lang = this.getParam('wiki_lang') || 'default';
			var cur = this.getHandle().firstChild;
			while (cur) {
				// FIXME: maybe we shouldn't save if cur.data / cur.firstChild.data is null ?
				if (cur.nodeType == xtdom.ELEMENT_NODE) {
					name = xtdom.getLocalName(cur);
					tag = _markers[name];
					if (tag) {
						if (cur.firstChild) { // sanity check  
							aLogger.openTag(_tagname[lang]['Fragment']);
							aLogger.openAttribute(_tagname[lang]['FragmentKind']);
							aLogger.write(tag);
							aLogger.closeAttribute(_tagname[lang]['FragmentKind']);
							aLogger.write(cur.firstChild.data);
							aLogger.closeTag(_tagname[lang]['Fragment']);
						}
					} else if (name == 'a') {
						anchor = (cur.firstChild) ? cur.firstChild.data
								: 'null';
						href = cur.getAttribute('href') || 'null';
						aLogger.openTag(_tagname[lang]['Link']);
						if (lang == 'html') {
  						aLogger.write(anchor);
  						aLogger.openAttribute('href');
  						aLogger.write(href);
  						aLogger.closeAttribute('href');
						} else {
  						aLogger.openTag('LinkText');
  						aLogger.write(anchor);
  						aLogger.closeTag('LinkText');
  						aLogger.openTag('LinkRef');
  						aLogger.write(href);
  						aLogger.closeTag('LinkRef');
						}
						aLogger.closeTag(_tagname[lang]['Link']);
					}
				} else { // it's a text node per construction
          if (cur.data && (cur.data.search(/\S/) != -1)) { 
  					aLogger.openTag(_tagname[lang]['Fragment']);
  					aLogger.write(cur.data);
  					aLogger.closeTag(_tagname[lang]['Fragment']);
          }
				}
				cur = cur.nextSibling;
			}
		},
		
		/**
		 * Converts the content of the handle (i.e. text, <span> and <a href>)
		 * into ASCII text. DOES NOT forward the call.
		 * 
		 * @return {string} Wiki-formatted text to edit
		 * 
		 * NOTE: does not call super function. Unnecesasry as getData() should
		 * never have side-effects
		 */
		getData : function getData () {
		 	//FIXME: could be optimized by directly generating message into edit field
			var _name, _tag;
			var _txtBuffer = '';
			var _cur = this.getHandle().firstChild;
			while (_cur) {
				if (_cur.nodeType == xtdom.ELEMENT_NODE) {
					_name = xtdom.getLocalName(_cur);
					_tag = _markers2ascii[_name];
					if (_tag) {
						if (_cur.firstChild) { // sanity check
							_txtBuffer += _tag + _cur.firstChild.data + _tag;
						}
					} else if (_name == 'a') { // "wiki" anchor generation
						_txtBuffer += (_cur.getAttribute('href') || '') + '[' + (_cur.firstChild ? _cur.firstChild.data : 'null') + ']';
					}
				} else { // it's a text node per construction
					_txtBuffer += _cur.data;
				}
				_cur = _cur.nextSibling;
			}
			return _txtBuffer; // accepts delegation
		},

   /**                                                           
    *<p>
    * Starts an edition process. Delays the start of the edition process in case 
    * the user clicked on a link inside the content, in which case it displays 
    * a popup menu to select between editing or opening the link in a new window.
    *</p>
    *<p>
		* DOES NOT forward the call if it is called from a mouse event and the user 
		* clicked on a link. DOES forward it otherwise.
	  *</p>
    */		
		startEditing : function startEditing (optMouseEvent, optSelectAll) {
		  if (optMouseEvent) {
        var _target = xtdom.getEventTarget(optMouseEvent);
        var _tname = xtdom.getLocalName(_target);
        if (/^a$/i.test(_tname)) { // clicked on a link
          xtdom.preventDefault(optMouseEvent);
          xtdom.stopPropagation(optMouseEvent); // prevents link opening
          var _popupdevice = _getPopupDevice(this.getDocument());
          this._url = _target.getAttribute('href'); // stores the url to follow
          if ((!this._url) || (this._url == '')) 
            this._url = _target.getAttribute('HREF');
          _popupdevice.startEditing(this, ['edit', 'open'], 'edit', _target)
          return;
        }
		  }
		  this._wikiSuperStartEditing(optMouseEvent, optSelectAll);
		},
		
		/**
		 * Callback for the popup device used to manage link edition.
		 */
		onMenuSelection: function onMenuSelection (aSelection) {
			if (aSelection == 'edit') {
				this._wikiSuperStartEditing();
			} else if (aSelection == 'open') {
				// opens this.cachedURL in an external window
				window.open(this._url);
			}
		},
		
		/**
		 * Accessor to change the selection state
		 * 
		 * @param {boolean} aState
		 * 
		 * NOTE : kept for compatibility with popupdevice
		 */
		setSelectionState: function setSelectionState (aState) {
			aState ? this.set(): this.unset();
		}
	};
})();

//Register this filter as a filter of the 'text' plugin (i.e. text.js must have been loaded)
xtiger.editor.Plugin.prototype.pluginEditors['text'].registerFilter('wiki', _WikiFilter);
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire, Antoine Yersin
 * 
 * ***** END LICENSE BLOCK ***** */      

/**
 * Class _GenericServiceFactory (static)
 * 
 * @class _GenericServiceFactory
 * @version beta
 */
xtiger.service.ServiceFactory = (function _ServiceFactory () {   
	
	/////////////////////
	// Private Methods
	/////////////////////   
	
	// Experimental    
	// Same as __broadcastIter
	var __applyIter = function(that, aProducer, aResourceKey, aData, aStartNode, callback) {  
		var r, model,
			_cur = aStartNode,
			startCount = 0,
			endCount = 0,
			_key = {key: that.getKey(), resource : aResourceKey};
			
		while (_cur) {
			model = _cur.xttPrimitiveEditor;       
			if (model) {
				callback(that, aProducer, aResourceKey, aData, model); 			                    
			}
			if (_cur.firstChild) {
				__applyIter(that, aProducer, aResourceKey, aData, _cur.firstChild, callback); // Recurse
			}
			if (_cur.endRepeatedItem) {	endCount++;	}
			if ((_cur != aStartNode) && _cur.startRepeatedItem) {
				startCount++;	 // does not count if repeat starts and ends on the node it landed on
			}
			// FIXME: is there a case where startRepeatedItem and endRepeated item can be on the same node ?
			if (endCount > startCount) {  
				return; // Terminated
			}
			_cur = _cur.nextSibling;
		}
	};	 
	       
	// Calls the onBroadcast method of that service for all the consumer 
	// fields with a compatible resource key in scope of aStartNode
	var __broadcastIter = function (that, aResourceKey, aData, aStartNode) {  
		var r;
		var _cur = aStartNode;
		var startCount = 0;
		var endCount = 0;
		var _context = that.getKey();
		while (_cur) {
			var editor = _cur.xttPrimitiveEditor;
			if (editor && editor.checkServiceKey) { // asssumes a method
				if (editor.checkServiceKey(_context, aResourceKey)) {
						that.onBroadcast(editor, aResourceKey, aData);
				}
			}
			if (_cur.firstChild) {
				__broadcastIter(that, aResourceKey, aData, _cur.firstChild); // Recurse
			}
			if (_cur.endRepeatedItem) {	endCount++;	}
			if ((_cur != aStartNode) && _cur.startRepeatedItem) {
				startCount++;	 // does not count if repeat starts and ends on the node it landed on
			}
			// FIXME: is there a case where startRepeatedItem and endRepeated item can be on the same node ?
			if (endCount > startCount) {  
				return; // Terminated
			}
			_cur = _cur.nextSibling;
		}
	};	
	                       
	// Accumulates all the resource keys that match aServiceKey in scope of aStartNode 
	var __collectRegistrationsIter = function(aServiceKey, aRoleKey, aStartNode, aAccu) {
		var _cur = aStartNode;
		var startCount = 0;
		var endCount = 0;
		while (_cur) {
			var editor = _cur.xttPrimitiveEditor;
			if (editor) {
				var _skparam = editor.getParam('service_key');
				if (_skparam && _skparam != '') {
					var _sks = _skparam.split(' ');
					for (var _i = 0; _i < _sks.length; _i++) {
						var _m = _sks[_i].match(/^([\w-_]+):(\w+)\[(.*)\]$/);
						if (_m[1] == aServiceKey && (!aRoleKey || _m[2] == aRoleKey) && 
						   !xtiger.util.array_contains(aAccu, _m[3])
						   ) {
							aAccu.push(_m[3]);		
						}
					}							
				}			
			}
			if (_cur.firstChild) {
				__collectRegistrationsIter(aServiceKey, aRoleKey, _cur.firstChild, aAccu); // Recurse
			}
			if (_cur.endRepeatedItem) {
				endCount++;
			}
			if ((_cur != aStartNode) && _cur.startRepeatedItem) {
				startCount++;	 // does not count if repeat starts and ends on the node it landed on
			}
			// FIXME: is there a case where startRepeatedItem and endRepeated item can be on the same node ?
			if (endCount > startCount) {  
				return; // Terminated
			}
			_cur = _cur.nextSibling;
		}
	};	

	/**
	 * Default service implementation. By default it does nothing except calling 
	 * its onBroadcast and onRemove methods in response to notifications
	 * from a service filter instance (i.e. in response to notifyUpdate, askUpdate,
	 * and notifyRemove). 
	 * 
	 * The default onBroadcast and onRemove methods do nothing. You should 
	 * override them in a service "delegate" class to actually do anything.
	 *
	 * This class implements a default synchronous communication mechanism. 
	 * You should overide the notification methods to implement a different 
	 * mechanism if you need it (e.g. an asynchronous one with an in-between 
	 * round-trip through a server). 
	 * 
	 * @name _GenericService
	 * @class _GenericService
	 */
	var _GenericService = function (aHandleNode, aDocument) {

		var _DEFAULT_PARAMS = {
		};

		/**
		 * The HTML node used as handle by the service. 
		 */
		this._handle = aHandleNode;

		/**
		 * A reference to the DOM document containing the editor
		 */
		this._document = aDocument;

		/**
		 * The actual parameters used by *this* instance
		 */
		this._params = _DEFAULT_PARAMS;

		/**
		 * The actual key associated with *this* instance
		 */
		this._key;     
		
		this._cache = undefined;
				
		this._types;  // needed for seeding
	};   
	
	/** @memberOf _GenericService */
	_GenericService.prototype = {   
		
		getKey: function () {
			return this._key;
		},		
		
		/**
		 * Returns the service's current handle, that is, the HTML element where
		 * the editor is "planted".
		 * 
		 * @return {HTMLElement} The editor's handle
		 */
		getHandle: function () {
			return this._handle;
		},

		/**
		 * 
		 * @param aKey
		 * @return
		 */
		getParam: function (aKey) {
			return this._params[aKey];
		},	
		 
		/**
		 * Initialization function, called by the service's factory after
		 * object's instanciation. Cares to parse and sets the various
		 * parameters.
		 * 
		 * @param {string} aType 
		 *				   The type string (that may contain several types)
		 * @param {string}
		 *            aDefaultData ?
		 * @param {string}
		 *            aKey
		 * @param {string|object}
		 *            aParams Either the parameter string from the <xt:use> node
		 *            or the parsed parameters object from the seed
		 */
		init: function (aType, aDefaultData, aKey, aParams) {
			this._types = aType;
			// _FIXME: an alternative design would be to store parameters 
			// in the default data, either as XML content or as string content 
			// with CSS like syntax
			if (aDefaultData) { /* sets up initial content */
				this._defaultData = aDefaultData;
			}
			this._key = aKey;
			if (aParams) { /* parse parameters */
				if (typeof(aParams) == 'string')
					xtiger.util.decodeParameters(aParams, this._params);
				else if (typeof(aParams) == 'object')
					this._params = aParams;
			}
		},

		/**
		 * 
		 * @return
		 */
		makeSeed: function () {
			return [xtiger.factory('service'), this._types, this._defaultData, this._key, this._params];
		},      
		      
		// Experimental
		// aProducer : the editor that triggered the call to _apply
		_apply : function(aProducer, aResourceKey, aData, aStartNode, callback) {    
			__applyIter(this, aProducer, aResourceKey, aData, aStartNode, callback);
		},		
		
		/**
		 * <p>
		 * Finds all consumers for *this* service, given its resource key. The
		 * method is recursive and requires a starting node. when called from
		 * outside, it should be the service's handle.
		 * </p>
		 * 
		 * NOTE: this method shouldn't be delegated unless you really know what
		 * you're doing. If you want to change the behavior on consumer's
		 * notification you should delegate onBroadcast instead.
		 * 
		 * FIXME: maybe we should skip unactivated choice slices ? Scope limited
		 * to one repeat slice to allow intra-slice coupling in repetitions
		 */
		_broadcast : function (aResourceKey, aData, aStartNode) {  
			__broadcastIter(this, aResourceKey, aData, aStartNode);
		},
		
		/**
		 * Collects all resource keys for registered models for *this* service.
		 * 
		 * @param {string} aRoleKey (optional) 
		 * 				   A role (e.g. 'consumer'). When specified it only considers 
		 *                 models registered with this role.
		 *
		 * @return {[string]} 
		 *   			   An array of resource keys
		 */
		_collectRegistrations: function (aRoleKey) {
			var accu = [];
			__collectRegistrationsIter(this.getKey(), aRoleKey, this.getHandle(), accu);
			return accu;
		},              
		
		//////////////////////////////////////////////////////////////
		// Service Configuration Methods (notification)                  
		// ---
		// These methods are called from a service filter instance  
		//////////////////////////////////////////////////////////////
		
		configure : function (aConfigurator, aResourceKey, aData) {
			this._params[aResourceKey] = aData;
			// FIXME: more defensive ? check first if key is allowed ?
		},			
		        
		// FIXME: currently we cannot easily do that since model's init 
		// method is called during tree construction while the model 
		// is detached from the main tree !
		// notifyInit : function (aConsumer, aResourceKey, aData) {        
		// },		
		
		//////////////////////////////////////////////////////////////
		// Service Producer Methods (notification)                  
		// ---
		// These methods are called from a service filter instance  
		//
		// If you filter these methods in delegates to alter the 
		// default behaviour (e.g. to create an asynchronous service)
		// do not forget to chain them in case the template author
		// has combined several service delegates on the same service
		//////////////////////////////////////////////////////////////  
		
		notifyLoad : function (aProducer, aResourceKey, aData) {
			this._cache = { resource: aResourceKey, data: aData };   
			// FIXME: cache by resource key
		},		
		
		/**
		 * <p>
		 * The default service notifyUpdate behavior calls the onBroadcast method for each consumer 
		 * in the scope of the service which has subscribed to its context key and to the resource 
		 * key of the update event.
		 * </p>
		 * <p>
		 * You can override or specialize this function by adding one or more delegates 
		 * with the types attribute of the service element declaration.
		 * </p>
		 */
		notifyUpdate : function (aProducer, aResourceKey, aData) {
			this._cache = { resource: aResourceKey, data: aData };
			this._broadcast (aResourceKey, aData, this.getHandle());
		},

		/**
		 * Asks the service to simulate a broacast on the consumer given as parameter.
		 * Currently this is because the consumer has just been created from a repeat editor
		 * (i.e. user pressing the plus icon). This is useful if the service maintains some 
		 * state, in that case this will allow the freshly created consumer to catch up 
		 * with that state.               
		 */
		askUpdate : function (aRequester, aResourceKey) {
		  	if (this._cache && this._cache.resource == aResourceKey) {
		  		this.onBroadcast(aRequester, this._cache.resource, this._cache.data);
	  	  	}
		},
		
		/**
		 * Tells the service that the producer field is going to be removed.
		 */
		notifyRemove : function (aProducer, aResourceKey, aData) {
			// nope
		},     
		
		/////////////////////////////////////////////////////////
		// Service Consumer Method
		/////////////////////////////////////////////////////////

		/**
		 * <p>
		 * This method is called for each consumer of this service interested in the resource key
		 * of the current update. It does nothing by default.
		 * </p><p>
		 * You can override or specialize this function by adding one or more delegates 
		 * with the types attribute of the service element declaration.		
		 * </p>
		 * 
		 * @param {Model} aConsumer 
		 * 	     		  The model of the editing field where to perform the action
		 * 
		 * @param {string} aResourceKey
		 * 				   The resource key from the model's service key that matched 
		 *				   the action
		 * 
		 * @param {object} aData 
		 *                 The service generated data
		 * 				   
		 */
		onBroadcast : function (aConsumer, aResourceKey, aData) {
			// no op
		}		

	};  /* END of _GenericService class */

	return { // here comes Factory code...  

		/**
		 * <p>
		 * Creates a DOM model for the service.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aContainer the HTML node where to implant the service
		 * @param {XTNode}
		 *            aXTService 
		 * @param {DOMDocument}
		 *            aDocument the current HTML document (in the DOM
		 *            understanding of a "document") being processed
		 * @return {HTMLElement} The created HTML element
		 */
		createModel: function createModel (aContainer, aXTService, aDocument) {     
			var hook = xtdom.createElement (aDocument, 'span');
			xtdom.addClassName (hook, 'axel-service-handle');
			aContainer.appendChild(hook);			
			return hook;
		},

		/**
		 * <p>
		 * Creates the service's from an XTiger &lt;xt:use&gt; element. This
		 * method is responsible to extract the default content as well as the
		 * optional parameters from the &lt;xte:service&gt; element.
		 * FIXME: Currently the default content is unparsed and set to undefined.
		 * </p>
		 * 
		 * @param {HTMLElement}
		 *            aHandleNode The HTML node used as handle by the created
		 *            editor
		 * @param {XMLElement}
		 *            aXTUse element The &lt;xt:use&gt; element that yields the
		 *            new editor
		 * @param {DOMDocument} 
		 *            aDocument A reference to the containing DOM
		 *            document
		 * @return {_GenericService} A new instance of the _GenericService class
		 */
		createServiceFromTree: function createEditorFromTree (aHandleNode, aXTService, aDocument) {
			var _instance = new _GenericService(aHandleNode, aDocument);			
			var _types = aXTService.getAttribute('types');
			_instance =  this.applyFilters(_instance, _types);
			_instance.init(_types, undefined, aXTService.getAttribute('key'), aXTService.getAttribute('param'));  			
			// undefined: we do not pass data from the aXTService descendants at that moment
			return _instance;
		},

		/**
		 * <p>
		 * Creates a service from a seed. The seed must carry the default data
		 * content as well as the parameters (as a string) information. Those
		 * infos are used to init the new editor.
		 * </p>
		 * 
		 * @param {Seed}
		 *            aSeed The seed from which the new editor is built
		 * @param {HTMLElement}
		 *            aClone The cloned handle where to implant the editor
		 * @param {DOMDocument} 
		 *            aDocument the document containing the editor
		 * @return {_GenericService} The new instance of the _GenericService class
		 * 
		 * @see _GenericService#makeSeed()
		 */
		createServiceFromSeed: function createEditorFromSeed (aSeed, aClone, aDocument, aRepeater) {
			var _instance = new _GenericService(aClone, aDocument);
			var _types = aSeed[1];
			var _defaultData = aSeed[2];
			var _key = aSeed[3];
			var _params = aSeed[4];			
			_instance = this.applyFilters(_instance, _types);
			_instance.init(_types, _defaultData, _key, _params);
			return _instance;
		}
	}
})();               

xtiger.registry.registerFactory('service', xtiger.util.filterable('service', xtiger.service.ServiceFactory));
                                                                                                
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */ 

var _CopyService  = (function () {    

	return {      

		/**
		 * Remap property
		 */
		'->': {'onBroadcast': '__copySuperBroadcast'},

		onBroadcast : function (aModel, aResource, aData) {
			aModel.update(aData, true); // true to avoid reemitting update event
			this.__copySuperBroadcast(aModel, aResource, aData); // chains service
		}
	}

})(); 

xtiger.factory('service').registerDelegate('copy', _CopyService);

var _CopyCondService  = (function () {      
	    
	// Only copies aData to consumers subscribed to service with a resource key 
	// similar to "aResourceKey(floor)" or "aResourceKey(ceiling)" and if they meet the condition
	var _testAndCopy = function(aDelegate, aProducer, aResource, aDataAsNumber, aModel) {
		var cur;
		if (aModel == aProducer) {
			return; // no need to test the producer itself
		}
		if (aModel.checkServiceKey(aDelegate.getKey(), aResource + '(floor)')) {
			cur = parseInt(aModel.getData()); 
			if (isNaN(cur) || (aDataAsNumber < cur)) {
				aModel.update(aDataAsNumber.toString(), true); // true to avoid reemitting update event
			}
		} else if (aModel.checkServiceKey(aDelegate.getKey(), aResource + '(ceiling)')) { 
			cur = parseInt(aModel.getData()); 
			if(isNaN(cur) || (aDataAsNumber > cur)) {
				aModel.update(aDataAsNumber.toString(), true); // true to avoid reemitting update event
			}
		} // ignores other keys
	}

	return {      

		/**
		 * Remap property
		 */
		'->': {},
		
		notifyUpdate : function (aProducer, aResource, aData) {         
			var newVal = parseInt(aData);
			if (! isNaN(newVal)) {
				this._apply(aProducer, aResource, newVal, this.getHandle(), _testAndCopy);
			}
		}
	}

})(); 

xtiger.factory('service').registerDelegate('copycond', _CopyCondService);/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */ 

var _DateService  = (function () {   
	
	var _broadcastDate = function(what, that, date, h) {
		var token = '(' + what + ')';
		that._broadcast('Day' + token, date.Day, h);						
		that._broadcast('Month' + token, date.Month, h);						
		that._broadcast('Year' + token, date.Year, h);						
	}   
	
	var _fullDate = function(date) {
		return (date.Day && date.Month && date.Year);
	}                                                
	
	var _copyDate = function(from, to) {
		to.Day = from.Day;
		to.Month = from.Month;
		to.Year = from.Year;
	}
	
	var _dumpDate = function (date) {
		xtiger.cross.log('debug', date.Day + '/' + date.Month + '/' + date.Year);
	}
	
	var _before = function(begin, end) {                                           
		return _fullDate(begin) && _fullDate(end) &&
				((begin.Year < end.Year) ||
					((begin.Year == end.Year) &&
				   		((begin.Month < end.Month) ||
							((begin.Month == end.Month) && 
								(begin.Day < end.Day)))));
	}	     
	
	var _parseResourceKey = function(aKey, accu) {
		var m = aKey.match(/^(Day|Month|Year)\(?(floor|ceiling|referent)?\)?/);
		if (m)	{
			accu.key = m[1];
			accu.condition = m[2];
			return true;
		}		
		return false;		
	}     
	
	var _parseInt = function(s, def) {
		var res = parseInt(s);
		return isNaN(res) ? def : res;
	} 
	
	return {      

		/**
		 * Remap property
		 */
		'->': {
				'init' : '__dateSuperInit'
		   	  },
		
		init: function (aType, aDefaultData, aKey, aParams) {      
			var defDate, day, month, year, tmp;
			this.__dateSuperInit.apply(this, arguments);
			defDate = this.getParam('date_default') || "1 1 2010";  // Day Month Year
			tmp = defDate.split(' ');
			day = _parseInt(tmp[0], 1);
			month = _parseInt(tmp[1], 1);
			year = _parseInt(tmp[2], 2010);
			this._floor = {'Day' : day, 'Month': month, 'Year': year};
			this._ceiling = {'Day' : day, 'Month': month, 'Year': year};
			this.__key = aKey;    
		},	
	   
		notifyUpdate : function (aProducer, aResource, aData) {  
			var accu = {}; 
			if (_parseResourceKey(aResource, accu)) {
			   	if (accu.condition == 'floor') {
					// stores floor value, triggers ceiling update if necessary
					this._floor[accu.key] = parseInt(aData);
					if (_before(this._ceiling, this._floor)) {
						_copyDate(this._floor, this._ceiling);
							// updates ceiling as it will not be updated through broadcast (short circuit)
						_broadcastDate('ceiling', this , this._floor, this.getHandle());
					}
				} else if (accu.condition == 'ceiling') {
					// stores ceiling value, triggers floor update if necessary
					this._ceiling[accu.key] = parseInt(aData);
					if (_before(this._ceiling, this._floor)) { 
						_copyDate(this._ceiling, this._floor);
							// updates floor as it will not be updated through broadcast (short circuit)
						_broadcastDate('floor', this, this._ceiling, this.getHandle());
					}
				}
			}
		}, //  -notifyUpdate
         
		notifyLoad : function (aProducer, aResource, aData) {  
			var accu = {}; 
			if (_parseResourceKey(aResource, accu) && (accu.condition == 'floor')) {  
				this._floor[accu.key] = parseInt(aData);					
			} else if (accu.condition == 'ceiling') {
				this._ceiling[accu.key] = parseInt(aData);					
			}
		}
		
	}

})(); 

xtiger.factory('service').registerDelegate('date', _DateService);

/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */ 

var _DebugService  = (function () {    

	return {      

		/**
		 * Remap property
		 */
		'->': {                             
			    // configuration method
				'configure': '__debugSuperConfigure', 
				// Producer notification methods  
				'notifyLoad': '__debugSuperNotifyLoad', 
				'notifyUpdate': '__debugSuperNotifyUpdate', 
				'askUpdate': '__debugSuperAskUpdate',
				'notifyRemove': '__debugSuperNotifyRemove',
				// Consumer callback method				
				'onBroadcast': '__debugSuperOnBroadcast'
			  },

		configure : function (aConfigurator, aResource, aData) {
			xtiger.cross.log('debug', 'configure[' + aResource + '] => ' + aData);
			this.__debugSuperConfigure(aConfigurator, aResource, aData);
		},      
		
		notifyLoad : function (aProducer, aResource, aData) {
			xtiger.cross.log('debug', 'notifyLoad[' + aResource + '] => ' + aData);
			this.__debugSuperNotifyLoad(aProducer, aResource, aData);
		},		

		notifyUpdate : function (aProducer, aResource, aData) {
			// var k = aProducer.getKey();
			xtiger.cross.log('debug', 'notifyUpdate[' + aResource + '] => ' + aData);
			this.__debugSuperNotifyUpdate(aProducer, aResource, aData);
		},

		askUpdate : function (aConsumer, aResource) {
			// var k = aProducer.getKey();
			xtiger.cross.log('debug', 'askUpdate[' + aResource + ']');
			this.__debugSuperAskUpdate(aConsumer, aResource);
		},

		notifyRemove : function (aProducer, aResource, aData) {   
			// var k = aProducer.getKey();
			xtiger.cross.log('debug', 'notifyRemove[' + aResource + '] => ' + aData);
			this.__debugSuperNotifyRemove(aProducer, aResource, aData);
		},
		
		onBroadcast : function (aConsumer, aResource, aData) {
			// var k = aProducer.getKey();
			xtiger.cross.log('debug', 'onBroadcast[' + aResource + '] => ' + aData);
			this.__debugSuperOnBroadcast(aConsumer, aResource, aData);
		}			
	}

})(); 

xtiger.factory('service').registerDelegate('debug', _DebugService);
/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * This file contains some utility functions to debug AXEL applications
 * These functions are located within the xtiger.debug namespace
 * This file should not be built with the other files when deploying AXEL applications, it's for debug only
 */
xtiger.debug = {};

/**
 * Loads the XHTML document at URL
 * Experimental version that uses XMLHTTPRequest object on all browser except IE
 * On IE (IE8, IE7 ?, untested on IE6) it uses the MSXML2.DOMDocument ActiveX for parsing XML documents into an IXMLDOMElement
 * as a benefit it can open templates / XML documents from the local file system on IE
 *
 * Accepts an optional logger (xtiger.util.Logger) object to report errors
 * Returns the document (should be a DOM Document object) or false in case of error
 */
xtiger.debug.loadDocument = function (url, logger) {
	if (window.navigator.appName == "Microsoft Internet Explorer") { // will try with MSXML2.DOMDocument
		var errMsg;		
		try {
			var xtDoc = new ActiveXObject("MSXML2.DOMDocument.6.0");  
			xtDoc.async = false;
			xtDoc.resolveExternals = false;
			xtDoc.validateOnParse = false; 
			xtDoc.setProperty("ProhibitDTD", false); // true seems to reject files with a DOCTYPE declaration
			xtDoc.load(url);
			if (xtDoc.parseError.errorCode != 0) {
			    errMsg = xtDoc.parseError + ' ' + xtDoc.parseError.reason;
			} else {
				return xtDoc; // OK, returns the IXMLDOMElement DOM element 
			}
		} catch (e) {
			errMsg = e.name;
		}
		if (errMsg) {
			if (logger) {
				logger.logError('Error while loading $$$ : ' + errMsg, url);
			} else {
				alert("ERROR:" + errMsg);					
			}
		    xtDoc = null;
		}		
	} else {
		return xtiger.cross.loadDocument(url, logger);
	}
	return false;	
}

/* ***** BEGIN LICENSE BLOCK *****
 *
 * Copyright (C) 2009, 2010, 2011  Stéphane Sire
 *
 * This file is part of the Adaptable XML Editing Library (AXEL), version 1.1.2-beta 
 *
 * Adaptable XML Editing Library (AXEL) is free software ; you can redistribute it 
 * and/or modify it under the terms of the GNU Lesser General Public License (the "LGPL")
 * as published by the Free Software Foundation ; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * The library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY ; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this library ; 
 * if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, 
 * Boston, MA 02111-1307 USA.
 *
 * Web site : http://media.epfl.ch/Templates/
 * 
 * Author(s) : Stephane Sire
 * 
 * ***** END LICENSE BLOCK ***** */

/*
 * A logger for keeping error messages while performing error-prone actions
 */
xtiger.util.Logger = function () {
	this.errors = [];
}	

xtiger.util.Logger.prototype = {    

	// Returns true if the logger has recorded some error message
	inError : function () {
		return (this.errors.length > 0);
	},
	  
	// If msg contains '$$$', it will be substituted with the file name contained in optional url  
	logError : function (msg, url) {
		if (msg.indexOf('$$$') != -1) {
			var m = url.match(/([^\/]*)$/); // should extract trailing file name
			var name = m ? m[1] : url;
			this.errors.push (msg.replace('$$$', '"' + name + '"'));
		} else {
			this.errors.push (msg);			
		}
	},

	// Returns a concatenation of error messages
	printErrors : function () {
		return this.errors.join(';');
	}
}	                 

/**
 * A window for logging data
 */
xtiger.util.LogWin = function (name, width, height, isTranscoding) {
	var params = "width=" + width + ",height=" + height + ",status=yes,resizable=yes,scrollbars=yes,title=" + name;
	if (xtiger.cross.UA.IE) {
		this.window = window.open('about:blank');
	} else {
		this.window = window.open(null, name, params);		
	}
	this.doc = this.window.document;
	this.doc.open();
	this.isTranscoding = isTranscoding;
}

xtiger.util.LogWin.prototype = {       
	
	// Dumps a form inside this LogWin
	// Assumes form has been configured to dump schemas
	dumpSchema : function (form, stylesheet, template) {
		var dump = new xtiger.util.SchemaLogger ();		
		var data = form.serializeData (dump);
		this.write(dump.dump('*'));
		this.close();			
	},		
	// Dumps a form inside this LogWin
	// stylesheet is an optional stylesheet filename, if present it adds a stylesheet processing instruction
	// filename is the optional name of the XML content file, if present it is added as a 'filename' attribute
	//  on the root node
	dump : function (form, stylesheet, template) {
		var buffer;
		var dump = new xtiger.util.DOMLogger ();
		// form.setSerializer(new xtiger.editor.BasicSerializer ());
		var data = form.serializeData (dump);
		//buffer = "<?xml version=\"1.0\"?>\n" // encoding="UTF-8" ?
		buffer = '';
		if (stylesheet) {
			//buffer += '<?xml-stylesheet type="text/xml" href="' + stylesheet + '"?>\n';
		}
		if (template) {
			//buffer += '<?xtiger template="' + template + '" version="1.0" ?>\n';
		}                                           
		buffer += dump.dump('*');
		this.write(buffer);
		this.close();			
	},
	transcode : function (text) {
		var filter1 = text.replace(/</g, '&lt;');
		var filter2 = filter1.replace(/\n/g, '<br/>');		
		var filter3 = filter2.replace(/ /g, '&nbsp;');		
		return filter3;
	},
	// 	
	// openTag : function (name) {
	// 	if (this.isTranscoding) {
	// 		this.doc.writeln ('&lt;' + name + '>');			
	// 	} else {
	// 		this.doc.writeln ('<' + name + '>');						
	// 	}
	// },
	// 
	// closeTag : function (name) {
	// 	if (this.isTranscoding) {
	// 		this.doc.writeln ('&lt;/' + name + '><br/>');			
	// 	} else {
	// 		this.doc.writeln ('</' + name + '>');
	// 	}
	// },
	// 
	write : function (text) {     
		var t = this.isTranscoding ? this.transcode(text) : text;
		this.doc.writeln(t);
	},
	
	close : function (text) {
		this.doc.close();
	},  
	dispose : function () {
		this.doc.close();	
	}	
}

// FireFox only method     
// Opens a dialog for opening a local file or folder depending on the mode
// Uses a filter if not null and specifies the msg to display in the dialog box
// See https://developer.mozilla.org/en/nsIFilePicker
// Returns a FireFox file object or false if the selection was cancelled
xtiger.util.fileDialog = function (mode, filter, msg) {
	var fp;
	try {  
     netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");  
  } catch (e) {  
     alert("Permission to get enough privilege was denied.");  
		 return false;
  }  
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	if (filter) {
		fp.appendFilter("My filter", filter); 			
	}		               
	var m;
	if (mode == 'open') {
		m = nsIFilePicker.modeOpen;
	} else if (mode == 'save') {
		m = nsIFilePicker.modeSave;			
	} else { // assumes 'folder'
		m = nsIFilePicker.modeGetFolder;
	}
	fp.init(window, msg, m);		
	var res = fp.show();
	if ((res == nsIFilePicker.returnOK) || (res == nsIFilePicker.returnReplace)){
		return fp.file.path;
	} else {
		return false;
	}
}           
