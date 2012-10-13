var bookmarksTaggerContent = function()
{
	var mThis = this;
	
	var mSearchBox;
	var mTyping = false;
	

	/**
	 * Initialize
	 */
	this.initialize = function()
	{
		this.createSearchBox();
		this.addListeners();
	};
	
	
	/**
	 * Create search box
	 */
	this.createSearchBox = function()
	{
		this.mSearchBox = document.createElement('input');
		this.mSearchBox.style.position = 'absolute';
		this.mSearchBox.style.left = '100px';
		this.mSearchBox.style.top = '100px';
		
		this.mSearchBox.addEventListener('keyup', this.searchBoxKeyUp);
		
		document.body.appendChild(this.mSearchBox);
	};
	
	
	/**
	 * On keyup listener for search box
	 */
	this.searchBoxKeyUp = function(aEvent)
	{
		console.log('s');
	};
	
	
	/**
	 * Add event listeners
	 */
	this.addListeners = function()
	{
		document.addEventListener('keydown', this.documentOnKeyDown);
	};
	
	
	/**
	 * On keydown listener for document
	 */
	this.documentOnKeyDown = function(aEvent)
	{
		if (!this.mTyping && aEvent.altKey && aEvent.keyCode != 18) {
			this.mTyping = true;
			
			console.log(this.mSearchBox);
			this.mSearchBox.focus();
		}
	};
}


var lBookmarksTaggerContent = new bookmarksTaggerContent();
lBookmarksTaggerContent.initialize();