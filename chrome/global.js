var $ = function(aElementId) {
	return document.getElementById(aElementId);
};

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