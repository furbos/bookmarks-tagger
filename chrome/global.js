/**
 * Some key codes
 */
var KEY_TAB    = 9;
var KEY_ENTER  = 13;
var KEY_ALT    = 18;
var KEY_ESCAPE = 27;
var KEY_LEFT   = 37;
var KEY_UP     = 38;
var KEY_RIGHT  = 39;
var KEY_DOWN   = 40;


/**
 * Set IndexedDB
 */
window.IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
window.indexedDB      = window.indexedDB || window.webkitIndexedDB;


/**
 * document.getElementById shortener
 */
var $ = function(aElementId) {
	return document.getElementById(aElementId);
};


/**
 * Check if the array contains the item
 */
var inArray = function(aNeedle, aHaystack)
{
	for (var i = 0; i < aHaystack.length; i++) {
		if (aHaystack[i] == aNeedle) return true;
	}
	
	return false;
};


/** 
 * Remove all doubles (and empty strings) from the array
 */
var uniqueArray = function(aArray)
{
	var lUniqueArray = []; 

	for (var i in aArray) {
		if (!inArray(aArray[i], lUniqueArray) && aArray[i].replace(/^\s+/, '').replace(/\s+$/, '') != '') lUniqueArray.push(aArray[i]);
	}

	return lUniqueArray;
};


/**
 * Gets an element position (left and top)
 */
var getElementPosition = function(aElement)
{
	var lX = 0;
	var lY = 0;

	while (aElement && !isNaN(aElement.offsetLeft) && !isNaN(aElement.offsetTop)) {
		lX += aElement.offsetLeft - aElement.scrollLeft;
		lY += aElement.offsetTop - aElement.scrollTop;

		aElement = aElement.parentNode;
	}

	return { left: lX, top: lY };
};


/**
 * Some useful methods for html elements
 */
HTMLElement.prototype.toggle = function() 
{
	if (this.style) {
		if (this.style.display == 'none') {
			this.prototype.show();
		} else {
			this.prototype.hide();
		}
	}
};

HTMLElement.prototype.hide = function() 
{
	if (this.style) {
		this.style.display = 'none';
	}
};

HTMLElement.prototype.show = function() 
{
	if (this.style) {
		this.style.display = 'block';
	}
};

HTMLElement.prototype.addEventListenerOriginal = HTMLElement.prototype.addEventListener;
HTMLElement.prototype.addEventListener = function(aEvent, aCallback) 
{
	if (!this.listeners) {
		this.listeners = new Array();
	}
	
	this.listeners.push([aEvent, aCallback]);
	
	this.addEventListenerOriginal(aEvent, aCallback);
};

HTMLElement.prototype.removeEventListeners = function() 
{
	if (this.listeners) {
		for (var i = 0; i < this.listeners.length; i++) {
			this.removeEventListener(this.listeners[i][0], this.listeners[i][1]);
		}
	}
};