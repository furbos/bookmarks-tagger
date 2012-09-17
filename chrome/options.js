function bookmarksTaggerOptions()
{
	var mThis = this;
	
	this.mBgPage;

	
	/**
	 * Initialize
	 */
	this.initialize = function()
	{
		this.addListeners();
	};
	
	
	/**
	 * Check if user came from omnibox with search term entered
	 */
	this.initializeSearchTerm = function()
	{
		lSearchTerm = decodeURIComponent(window.location.hash.substring(1));
		
		if (lSearchTerm) {
			$('input_search').value = lSearchTerm;
			$('input_search').focus();
		}
	}
	
	
	/**
	 * Add all listeners
	 */
	this.addListeners = function()
	{
		document.addEventListener('DOMContentLoaded', function () {
			$('button_search').addEventListener('click', function(aEvent) { mThis.showResults(); });
			$('button_add').addEventListener('click', function(aEvent) { mThis.showAddBookmark(); });
			$('button_remove_all').addEventListener('click', function(aEvent) { if (confirm('Are you sure you want to permanently remove all yours tagged bookmarks in Bookmarks Tagger?\n\nYour chrome bookmarks will keep intact.')) { mThis.removeAll(); } });
			
			$('input_search').addEventListener('keyup', function(aEvent) { mThis.listenerSearchKeyUp(aEvent); });
			
			$('add_input_title').addEventListener('keyup', function(aEvent) { mThis.listenerTitleKeyUp(aEvent); });
			$('add_input_url').addEventListener('focus', function(aEvent) { mThis.listenerUrlFocus(aEvent); });
			$('add_input_url').addEventListener('keyup', function(aEvent) { mThis.listenerUrlKeyUp(aEvent); });
			$('add_input_tags').addEventListener('keyup', function(aEvent) { mThis.listenerTagsKeyUp(aEvent); });
			
			mThis.mBgPage = chrome.extension.getBackgroundPage();
			mThis.loadOptions();
			mThis.initializeSearchTerm();
		});
	};
	
	
	/**
	 * Listener for search input box for key up event
	 */
	this.listenerSearchKeyUp = function(aEvent)
	{
		switch (aEvent.which) {
			case KEY_TAB:
				break;
				
			case KEY_ESCAPE:
				break;
				
			case KEY_ENTER:
				break;
		}
	}
	
	
	/**
	 * Listener for input field "title" in add form for event onkeyup
	 */
	this.listenerTitleKeyUp = function(aEvent)
	{
		switch (aEvent.which) {
			case KEY_ENTER:
				$('add_input_url').focus();
				break;
		}
	}
	
	
	/**
	 * Listener for input field "url" in add form for event onkeyup
	 */
	this.listenerUrlKeyUp = function(aEvent)
	{
		switch (aEvent.which) {
			case KEY_ENTER:
				$('add_input_tags').focus();
				break;
		}
	}
	
	
	/**
	 * Listener for input field "tags" in add form for event onkeyup
	 */
	this.listenerTagsKeyUp = function(aEvent)
	{
		switch (aEvent.which) {
			case KEY_ENTER:
				// save bookmark and probably close the window
				break;
		}
	}
	
	
	/**
	 * Listener for input field "url" in add form for event onfocus
	 */
	this.listenerUrlFocus = function(aEvent)
	{
		var lInputUrl = $('add_input_url');
		
		if (lInputUrl.value == 'http://') {
			setTimeout(function()
			{
				lInputUrl.setSelectionRange(7, 7);
			}, 1);
		}
	}
	
	
	/**
	 * Remove all bookmarks
	 */
	this.removeAll = function()
	{
		//
	}
	
	
	/**
	 * Load options from localStorage
	 */
	this.loadOptions = function()
	{
		// Nothing for a now.
	};
	
	
	/**
	 * Hide search results and show "add bookmark" form
	 */
	this.showAddBookmark = function()
	{
		$('results').hide();
		$('add').show();
		
		$('add_title').innerHTML = 'Add new bookmark';
		$('add_remove').style.display = 'none';
		
		$('add_input_title').value = '';
		$('add_input_url').value = 'http://';
		$('add_input_tags').value = '';
		
		$('add_input_title').focus();
	}
	
	
	/**
	 * Hide add bookmark form and show results table
	 */
	this.showResults = function()
	{
		$('add').style.display = 'none';
		$('results').style.display = 'block';
	}
}


var lBookmarksTaggerOptions = new bookmarksTaggerOptions();
lBookmarksTaggerOptions.initialize();