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
 *
 * @param aElementId
 * @return null|Element
 */
var $ = function(aElementId) {
	return document.getElementById(aElementId);
};


/**
 * Check if the array contains the item
 *
 * @param aNeedle
 * @param aHaystack
 * @return boolean
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
 *
 * @param aArray
 * @return Array
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
 *
 * @param aElement
 * @return Object
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
 * Escape string for use in regexp
 *
 * @return String
 */
String.prototype.escapeForRegExp = function() {
	return this.toString().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};


/**
 * Show/Hide Element
 *
 * @return void
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


/**
 * Hide element
 *
 * @return void
 */
HTMLElement.prototype.hide = function()
{
	if (this.style) {
		this.style.display = 'none';
	}
};


/**
 * Show element
 *
 * @return void
 */
HTMLElement.prototype.show = function()
{
	if (this.style) {
		this.style.display = 'block';
	}
};


/**
 * Add multiple event listeners
 *
 * @param aEvent
 * @param aCallback
 * @return void
 */
HTMLElement.prototype.addEventListenerOriginal = HTMLElement.prototype.addEventListener;
HTMLElement.prototype.addEventListener = function(aEvent, aCallback)
{
	if (!this.listeners) {
		this.listeners = [];
	}

	this.listeners.push([aEvent, aCallback]);

	this.addEventListenerOriginal(aEvent, aCallback);
};


/**
 * Remove all event listener
 *
 * @return void
 */
HTMLElement.prototype.removeEventListeners = function()
{
	if (this.listeners) {
		for (var i = 0; i < this.listeners.length; i++) {
			this.removeEventListener(this.listeners[i][0], this.listeners[i][1]);
		}
	}
};


/**
 * Remove itself
 *
 * @return void
 */
HTMLElement.prototype.remove = function()
{
	this.parentNode.removeChild(this);
};


/**
 * Remove all children within the current element
 *
 * @return void
 */
HTMLElement.prototype.removeChildren = function()
{
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}
};


/**
 * Remove class from the element
 *
 * @param aString
 * @return void
 */
HTMLElement.prototype.removeClass = function(aString)
{
	var lRegExp = new RegExp("\\b" + aString + "\\b");
	this.className = this.className.replace(lRegExp, '');
};


/**
 * Add class to the element
 *
 * @param aString
 * @return void
 */
HTMLElement.prototype.addClass = function(aString)
{
	this.className += ' ' + aString;
};


/**
 * Check if the element is active
 *
 * @return boolean
 */
HTMLElement.prototype.isActive = function()
{
	return (this == document.activeElement);
};