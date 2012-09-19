function bookmarksTaggerOptions()
{
	var mThis = this;

	this.mTagSuggestionDiv;
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
			
			this.searchByTags($('input_search').value, this.checkForRedirect);
		}
	};


	/**
	 * When user is comming from the omnibox and there is only one results we want him to redirect to that page
	 */
	this.checkForRedirect = function(aResults)
	{
		if (aResults.length == 1) {
			chrome.tabs.getSelected(null, 
				function(aSelectedTab)
				{
					chrome.tabs.update(aSelectedTab.id, { url: aResults[0].content });
				}
			);
		} else {
			mThis.printResults(aResults);
		}
	}
	
	
	/**
	 * Add all listeners
	 */
	this.addListeners = function()
	{
		document.addEventListener('DOMContentLoaded', function () {
			mThis.mBgPage = chrome.extension.getBackgroundPage();
			mThis.initializeSearchTerm();			

			$('button_add').addEventListener('click', function(aEvent) { mThis.showAddEditBookmark(false, false, false); });
			$('button_remove_all').addEventListener('click', function(aEvent) { if (confirm('Are you sure you want to permanently remove all your tagged bookmarks in Bookmarks Tagger?\n\nYour chrome bookmarks will not be removed.')) { mThis.mBgPage.lBookmarksTaggerBackground.removeAll(); } });
			$('button_search').addEventListener('click', function(aEvent) { mThis.searchByTags($('input_search').value, mThis.printResults); });
			
			$('input_search').addEventListener('keyup', function(aEvent) { mThis.listenerSearchKeyUp(aEvent.which); });
			$('input_search').addEventListener('blur', function(aEvent) { mThis.mTagSuggestionDiv.hide(); });
			
			$('add_input_title').addEventListener('keyup', function(aEvent) { mThis.listenerTitleKeyUp(aEvent); });
			$('add_input_url').addEventListener('focus', function(aEvent) { mThis.listenerUrlFocus(aEvent); });
			$('add_input_url').addEventListener('keyup', function(aEvent) { mThis.listenerUrlKeyUp(aEvent); });
			$('add_input_tags').addEventListener('keyup', function(aEvent) { mThis.listenerTagsKeyUp(aEvent); });

			mThis.initializeTagSuggestionDiv();
			mThis.loadOptions();
		});
	};


	/**
	 * Creates div element used as tag suggestion box beneath search box
	 */
	this.initializeTagSuggestionDiv = function()
	{
		/*this.mTagSuggestionDiv = document.createElement('div');
		this.mTagSuggestionDiv.id = 'tag-suggestion';

		lSearchPosition = getElementPosition($('input_search'));

		this.mTagSuggestionDiv.style.top = (lSearchPosition.top + 8) + 'px';
		this.mTagSuggestionDiv.style.left = (lSearchPosition.left + 1) + 'px';

		document.body.appendChild(this.mTagSuggestionDiv);
		*/
		this.mTagSuggestionDiv = $('tag-suggestion');
	}
	
	
	/**
	 * Listener for search input box for key up event
	 */
	this.listenerSearchKeyUp = function(aKeyCode)
	{
		switch (aKeyCode) {
			case KEY_ESCAPE:
				this.mTagSuggestionDiv.hide();
			case KEY_TAB:
			case KEY_LEFT:
			case KEY_RIGHT:
				break;
				
			case KEY_UP:
			case KEY_DOWN:
				break;
				
			case KEY_ENTER:
			default:
				lInputSearchValue = $('input_search').value;

				if (lInputSearchValue == '') {
					this.mTagSuggestionDiv.hide();
				} else {
					this.showTagSuggestion(lInputSearchValue);
				}

				this.searchByTags(lInputSearchValue, this.printResults);
				break;
		}
	};


	/**
	 * Adds an omnibox with tags suggestions while typing in search box
	 */
	this.showTagSuggestion = function(aText)
	{
		aSuggestion = lInputSearchValue;
		aCursorPosition = $('input_search').selectionStart;

		//this.mTagSuggestionDiv.show();
	};

	
	/**
	 * Search by tags will show ajax loader and execute searchByTags function from background page
	 */
	this.searchByTags = function(aTags, aCallback)
	{
		$('input_search').style.backgroundImage = 'url("loading.gif")';
		this.mBgPage.lBookmarksTaggerBackground.searchByTags(aTags, function(aResults) { aCallback(aResults); });
	};

	
	/**
	 * Clean results
	 */
	this.cleanResults = function()
	{
		lResultsTBody = $('results_tbody');
		
		while (lResultsTBody.childNodes.length > 0) {
			lResultsTBody.removeChild(lResultsTBody.firstChild);
		}
	};
	
	
	/**
	 * Show returned results
	 */
	this.printResults = function(aResults)
	{
		mThis.cleanResults();
		lResultsTBody = $('results_tbody');

		if (aResults.length == 0) {
			var lTr = document.createElement('tr');
			var lTd = document.createElement('td');

			lTd.className = 'no-results';
			lTd.innerHTML = 'No results found.';
			lTr.appendChild(lTd);
			lResultsTBody.appendChild(lTr);
		} else {
		
			for (var i = 0; i < aResults.length; i++) {
				var lTr = document.createElement('tr');
				var lTdActions = document.createElement('td');
				var lTdTitle = document.createElement('td');
				var lTdTags = document.createElement('td');
				var lALink = document.createElement('a');
				var lSpanLink = document.createElement('span');
				var lAActionEdit = document.createElement('a');
				var lAActionRemove = document.createElement('a');
			
				lAActionEdit.innerHTML = '✎';
				lAActionEdit.attributes['data-url'] = aResults[i].content;
				lAActionEdit.attributes['data-title'] = aResults[i].description;
				lAActionEdit.attributes['data-tags'] = aResults[i].tags;
				lAActionEdit.addEventListener('click', function(aEvent) { mThis.showAddEditBookmark(this.attributes['data-url'], this.attributes['data-title'], this.attributes['data-tags'].join(' ')); });
				lAActionRemove.innerHTML = '✗';
				lAActionRemove.attributes['data-url'] = aResults[i].content;
				lAActionRemove.attributes['data-title'] = aResults[i].description;
				lAActionRemove.addEventListener('click', function(aEvent) { if (confirm('Are you sure you want to remove this bookmark?\n\n' + this.attributes['data-title'])) { mThis.removeBookmark(this); }});
			
				lTdActions.className = 'actions';
				lTdActions.appendChild(lAActionEdit);
				lTdActions.appendChild(lAActionRemove);
			
				lTdTitle.className = 'title';
				lALink.href = aResults[i].content;
				lALink.innerHTML = aResults[i].description;
			
				lSpanLink.title = aResults[i].content;
				lSpanLink.innerHTML = mThis.cleanUrl(aResults[i].content);
				lALink.appendChild(lSpanLink);
				lTdTitle.appendChild(lALink);
			
				lTdTags.className = 'tags';
				for (var j = 0; j < aResults[i].tags.length; j++) {
					var lTag = document.createElement('a');
					lTag.innerHTML = aResults[i].tags[j];
				
					lTdTags.appendChild(lTag);
				}
			
			
				lTr.appendChild(lTdActions);
				lTr.appendChild(lTdTitle);
				lTr.appendChild(lTdTags);
				lResultsTBody.appendChild(lTr);
			}
		}

		$('add').style.display = 'none';
		$('results').style.display = 'block';

		$('input_search').style.backgroundImage = 'none';
	};
	
	
	/**
	 * Remove bookmark
	 */
	this.removeBookmark = function(aElement)
	{
		mThis.mBgPage.lBookmarksTaggerBackground.remove(aElement.attributes['data-url']);
		
		lTr = aElement.parentNode.parentNode;
		lTr.parentNode.removeChild(lTr);
	}
	
	
	/**
	 * Remove protocol and for some cases also trailing slash
	 */
	this.cleanUrl = function(aUrl)
	{
		aUrl = aUrl.replace(/^https?:\/\//, '');
		
		if (aUrl.split('/').length - 1 == 1) {
			aUrl = aUrl.replace(/\/$/, '');
		}
			
		return aUrl;
	};
	
	
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
	};
	
	
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
	};
	
	
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
	};
	
	
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
	};
	
	
	/**
	 * Load options from localStorage
	 */
	this.loadOptions = function()
	{
		// Nothing for a now.
	};
	
	
	/**
	 * Hide search results and show "add a bookmark" form
	 */
	this.showAddEditBookmark = function(aUrl, aTitle, aTags)
	{
		if (aUrl) {
			$('add_title').innerHTML = 'Edit an existing bookmark';
			$('add_remove').style.display = 'block';
			
			$('add_remove').addEventListener('click', function(aEvent) { if (confirm('Are you sure you want to remove this bookmark?\n\n' + aTitle)) { mThis.mBgPage.lBookmarksTaggerBackground.remove(aUrl); mThis.listenerSearchKeyUp(KEY_ENTER); } });
			
			$('add_input_title').value = aTitle;
			$('add_input_url').value = aUrl;
			$('add_input_tags').value = aTags;
		} else {
			$('add_title').innerHTML = 'Add a new bookmark';
			$('add_remove').style.display = 'none';
			
			$('add_input_title').value = '';
			$('add_input_url').value = 'http://';
			$('add_input_tags').value = '';
		}

		$('results').hide();
		$('add').show();

		$('add_input_title').focus();
	};
}


var lBookmarksTaggerOptions = new bookmarksTaggerOptions();
lBookmarksTaggerOptions.initialize();
