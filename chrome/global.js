/**
 * Some key codes
 */
var KEY_TAB    = 9;
var KEY_ENTER  = 13;
var KEY_ESCAPE = 27;


/**
 * document.getElementById shortener
 */
var $ = function(aElementId) {
	return document.getElementById(aElementId);
};


/**
 * Some useful methods for html elements
 */
HTMLElement.prototype.toggle = function() {
	if (this.style) {
		if (this.style.display == 'block') {
			this.style.display = 'none';
		} else {
			this.style.display = 'block';
		}
	}
};

HTMLElement.prototype.hide = function() {
	if (this.style) {
		this.style.display = 'none';
	}
};

HTMLElement.prototype.show = function() {
	if (this.style) {
		this.style.display = 'block';
	}
};