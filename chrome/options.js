function bookmarksTaggerOptions()
{
	var mThis = this;
	
	//this.mOptionOmniboxKeyword = '';

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
		
		if (lSearchTerm) document.getElementById('search_input').value = lSearchTerm;
	}
	
	
	/**
	 * Add all listeners
	 */
	this.addListeners = function()
	{
		document.addEventListener('DOMContentLoaded', function () {
			//document.getElementById('options_save').addEventListener('click', function(aEvent) { mThis.listenerOptionsSaveClick(aEvent); });
			//document.getElementById('options_reset').addEventListener('click', function(aEvent) { mThis.listenerOptionsResetClick(aEvent); });
			document.getElementById('search_button').addEventListener('click', function(aEvent) { mThis.showResults(); });
			document.getElementById('add_button').addEventListener('click', function(aEvent) { mThis.showAddBookmark(); });
			
			//mThis.listenerOptionsResetClick();
			mThis.initializeSearchTerm();
		});
	};
	
	
	/**
	 * Listener for "click" on save options button
	 */
	this.listenerOptionsSaveClick = function(aEvent)
	{
		//localStorage['omnibox_keyword'] = this.mOptionOmniboxKeyword = document.getElementById('omnibox_keyword').value;
	}
	
	
	/**
	 * Listener for "click" on reset options button
	 */
	this.listenerOptionsResetClick = function(aEvent)
	{
		//document.getElementById('omnibox_keyword').value = this.mOptionOmniboxKeyword = localStorage['omnibox_keyword'];
	};
	
	
	/**
	 * Load options from the localStorage
	 */
	this.loadOptions = function()
	{
		//this.mOptionOmniboxKeyword = localStorage['omnibox_keyword'];
	};
	
	
	/**
	 * Hide search results and show "add bookmark" form
	 */
	this.showAddBookmark = function()
	{
		document.getElementById('results').style.display = 'none';
		document.getElementById('add').style.display = 'block';
	}
	
	
	/**
	 * Hide add bookmark form and show results table
	 */
	this.showResults = function()
	{
		document.getElementById('add').style.display = 'none';
		document.getElementById('results').style.display = 'block';
	}
}


var lBookmarksTaggerOptions = new bookmarksTaggerOptions();
lBookmarksTaggerOptions.initialize();