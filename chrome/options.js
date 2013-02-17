function BookmarksTaggerOptions()
{
	var mThis = this;

	this.mSearching = false;
	this.mEditExistingUrl = false;
	this.mBgPage = false;
	
	this.mTagListMaxHeight = 250;

	
	/**
	 * Initialize
	 */
	this.initialize = function() 
	{
		this.addListeners();
	};

	
	/**
	 * Add all listeners
	 */
	this.addListeners = function() 
	{
		document.addEventListener('DOMContentLoaded', function() 
		{
			mThis.mBgPage = chrome.extension.getBackgroundPage();
			mThis.initializeSearchTerm();
			mThis.loadUsedTags();

			$('button_add').addEventListener('click', function(aEvent) { mThis.showAddEditBookmark(false, false, false); });
			$('button_remove_all').addEventListener('click', function(aEvent) { mThis.removeAll(); });
			$('button_show_all').addEventListener('click', function(aEvent) { mThis.showAll(); });
			$('button_import').addEventListener('click', function(aEvent) { mThis.importBookmarks(); });
			$('button_search').addEventListener('click', function(aEvent) { mThis.listenerSearchKeyUp(KEY_ENTER); });

			$('input_search').addEventListener('keyup', function(aEvent) { mThis.listenerSearchKeyUp(aEvent.which); });

			var $add_input_url = $('add_input_url');
			$add_input_url.addEventListener('focus', function(aEvent) { mThis.listenerUrlFocus(aEvent); });
			$add_input_url.addEventListener('keyup', function(aEvent) { mThis.listenerUrlKeyUp(aEvent); });

			$('add_input_title').addEventListener('keyup', function(aEvent) { mThis.listenerTitleKeyUp(aEvent); });
			$('add_input_tags').addEventListener('keyup', function(aEvent) { mThis.listenerTagsKeyUp(aEvent); });
			
			$('add_button_save').addEventListener('click', function(aEvent) { mThis.saveBookmarkButton(); });
			
			$('x-in-search').addEventListener('click', function(aEvent) { mThis.showAll(); $('input_search').focus(); });
		});
	};
	

	/**
	 * Check if user came from omnibox with search term entered
	 */
	this.initializeSearchTerm = function() 
	{
		var lSearchTerm = decodeURIComponent(window.location.hash.substring(1));

		if (lSearchTerm) {
			var $input_search = $('input_search');
			$input_search.value = lSearchTerm;
			$input_search.focus();

			this.searchByTags($input_search.value, this.checkForRedirect);
		} else {
			mThis.showAll();
		}
	};
	
	
	/**
	 * Import bookmarks from browser
	 */
	this.importBookmarks = function()
	{
		if (confirm('Do you want to import all bookmarks from your browser?')) {
			var lBookmarkTree = chrome.bookmarks.getTree(function(aBookmarkTreeNodes)
			{
				for (var i = 0; i < aBookmarkTreeNodes.length; i++) {
					mThis.processBookmarkNode(aBookmarkTreeNodes[i]);
				}
			});
		}
	};
	
	
	/**
	 * Process bookmark tree nodes
	 */
	this.processBookmarkNodes = function(aNodes)
	{
		for (var i = 0; i < aNodes.length; i++) {
			mThis.processBookmarkNode(aNodes[i]);
		}
	};
	
	
	/**
	 * Process bookmark node
	 */
	this.processBookmarkNode = function(aNode)
	{
		if (aNode.title && !aNode.children) {
			chrome.extension.sendMessage({ getPageInfo: aNode.url }, function(aResponse)
			{
				if (aResponse.status != 'ok') {
					mThis.saveBookmark(aNode.url, aNode.title, []);
				}
			});
		} else if (aNode.children && aNode.children.length > 0) {
			this.processBookmarkNodes(aNode.children);
		}
	};
	
	
	/**
	 * Load all tags used in bookmarks
	 */
	this.loadUsedTags = function()
	{
		var lTagList = $('tag-list');
		
		while (lTagList.childNodes.length > 0) {
			lTagList.removeChild(lTagList.firstChild);
		}
		
		this.mBgPage.lBookmarksTaggerBackground.getUsedTags(function(aTags) 
		{ 
			var lSortedTags = [];
			for (var i in aTags) {
				lSortedTags.push({
					'tag': i,
					'usage': aTags[i]
				});
			}
			
			lSortedTags.sort(function(a, b) { return b.usage - a.usage; });
			
			for (var i in lSortedTags) {
				var lTag = document.createElement('a');
				lTag.addEventListener('click', function(aEvent) { $('input_search').value = this.innerHTML; $('x-in-search').show(); mThis.searchByTags(this.innerHTML, mThis.printResults); });
				lTag.innerHTML = lSortedTags[i].tag;
				
				lTagList.appendChild(lTag);
			}
			
			var lClearBoth = document.createElement('div');
			lClearBoth.className = 'clear';
			lTagList.appendChild(lClearBoth);
			
			if (lTagList.offsetHeight > mThis.mTagListMaxHeight) {
				var lTagListMore = document.createElement('div');
				lTagListMore.id = 'tag-list-more';
				lTagListMore.innerHTML = '↓↓↓';
				
				lTagList.appendChild(lTagListMore);
			}
			
			if (lSortedTags.length == 0) {
				lTagList.parentNode.hide();
			} else {
				lTagList.parentNode.show();
			}
		});
	};
	
	
	/**
	 * When user is coming from the omnibox and there is only one results we
	 * want him to redirect to that page
	 */
	this.checkForRedirect = function(aResults) 
	{
		if (aResults.length == 1) {
			chrome.tabs.getSelected(null, function(aSelectedTab) {
				chrome.tabs.update(aSelectedTab.id, {
					url : aResults[0].content
				});
			});
		} else {
			mThis.printResults(aResults);
		}
	};

	
	/**
	 * Listener for search input box for key up event
	 */
	this.listenerSearchKeyUp = function(aKeyCode) 
	{
		switch (aKeyCode) {
			case KEY_ESCAPE:
			case KEY_TAB:
			case KEY_LEFT:
			case KEY_RIGHT:
				break;
	
			case KEY_UP:
			case KEY_DOWN:
				// go through suggestions
				break;
	
			case KEY_ENTER:
			default:
				$('x-in-search').show();
				var lInputSearchValue = $('input_search').value;
	
				if (lInputSearchValue == '') {
					this.showAll(this.printResults);
				} else {
					this.searchByTags(lInputSearchValue, this.printResults);
				}
				
				break;
		}
	};

	
	/**
	 * Search by tags will show ajax loader and execute searchByTags function
	 * from background page
	 */
	this.searchByTags = function(aTags, aCallback) 
	{
		if (!this.mSearching) {
			if (aTags) {
				this.mSearching = true;
				$('input_search').style.backgroundImage = 'url("media/loading.gif")';
				this.mBgPage.lBookmarksTaggerBackground.searchByTags(aTags, function(aResults) { aCallback(aResults); });
			} else {
				this.showAll();
			}
		}
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
				lAActionEdit.attribute_url   = aResults[i].content;
				lAActionEdit.attribute_title = aResults[i].description;
				lAActionEdit.attribute_tags  = aResults[i].tags;

				lAActionEdit.addEventListener('click', function(aEvent) 
				{
					mThis.showAddEditBookmark(this.attribute_url, this.attribute_title, this.attribute_tags.join(' '));
				});
				
				lAActionRemove.innerHTML = '✗';
				lAActionRemove.attribute_url   = aResults[i].content;
				lAActionRemove.attribute_title = aResults[i].description;
				lAActionRemove.addEventListener('click', function(aEvent) { mThis.removeBookmark(this); });

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
					lTag.addEventListener('click', function(aEvent) { $('input_search').value = this.innerHTML; mThis.searchByTags(this.innerHTML, mThis.printResults); });

					lTdTags.appendChild(lTag);
				}

				lTr.appendChild(lTdActions);
				lTr.appendChild(lTdTitle);
				lTr.appendChild(lTdTags);
				lResultsTBody.appendChild(lTr);
			}
		}

		$('add').hide();
		$('results').show();

		$('input_search').style.backgroundImage = 'none';
		mThis.mSearching = false;
	};

	
	/**
	 * Remove bookmark click
	 */
	this.removeBookmark = function(aElement) 
	{
		if (confirm('Are you sure you want to remove this bookmark?\n\n' + aElement.attribute_title)) {
			this.mBgPage.lBookmarksTaggerBackground.remove(aElement.attribute_url);

			var lTr = aElement.parentNode.parentNode;
			lTr.parentNode.removeChild(lTr);

			this.searchByTags($('input_search').value, mThis.printResults);
			$('input_search').focus();
			
			this.loadUsedTags();
		}
	};

	
	/**
	 * Edit bookmark click
	 */
	this.editBookmark = function(aElement) 
	{

	};
	

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
			$('add_input_tags').focus();
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
				$('add_input_title').focus();
				break;
				
			default:
				var lPageUrl = $('add_input_url').value;
				if (!this.mEditExistingUrl) {
					if (this.urlIsEmpty(lPageUrl)) {
						this.urlExists(lPageUrl);
					} else {
						$('add_input_title').disabled = 'disabled';
						$('add_input_tags').disabled  = 'disabled';
						$('add_button_save').disabled = 'disabled';
					}
				}
				break;
		}
	};
	
	
	/**
	 * Check if url is already in the DB
	 */
	this.urlExists = function(aUrl)
	{
		$('add_input_url').style.backgroundImage = 'url("media/loading.gif")';
		chrome.extension.sendMessage({ getPageInfo: aUrl }, function(aResponse)
		{
			if (aResponse.status == 'ok') {
				$('infobox').removeEventListeners();
				$('infobox').addEventListener('click', function(aEvent) { mThis.showAddEditBookmark(aResponse.url, aResponse.title, aResponse.tags.join(' ')); });
				$('add_input_title').disabled = 'disabled';
				$('add_input_tags').disabled  = 'disabled';
				$('add_button_save').disabled = 'disabled';
				$('infobox').show();
			} else {
				$('add_input_title').disabled = '';
				$('add_input_tags').disabled  = '';
				$('add_button_save').disabled = '';
				$('infobox').hide();
			}
			
			$('add_input_url').style.backgroundImage = 'none';
		})
	};
	
	
	/**
	 * Check if url is not empty
	 */
	this.urlIsEmpty = function(aUrl)
	{
		return /https?:\/\/.+/.test(aUrl);
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
			setTimeout(function() { lInputUrl.setSelectionRange(7, 7); }, 1);
		}
	};
	
	
	/**
	 * Create tags bubbles
	 */
	this.createTagsBubbles = function()
	{
		var lTagsBubbles         = $('add-tags');
		var lTagsBubblesChildren = document.querySelectorAll('td[id="add-tags"] a');
		var lPageTags            = uniqueArray($('add_input_tags').value.split(' '));

		for (var i = 0; i < lTagsBubblesChildren.length; i++) {
			lTagsBubblesChildren[i].parentNode.removeChild(lTagsBubblesChildren[i])
		}
		
		for (var j = 0; j < lPageTags.length; j++) {
			var lTag = document.createElement('a');
			lTag.innerHTML = lPageTags[j];
			lTag.addEventListener('click', function(aEvent) { mThis.listenerTagClick(aEvent, this); });
			lTagsBubbles.appendChild(lTag);
		}
	};
	
	
	/**
	 * Anchor listener for removing tags by clicking on them
	 */
	this.listenerTagClick = function(aEvent, aElement)
	{
		var lTag = aElement.innerHTML;
		var lLeftTrim = new RegExp('\\s+' + lTag);
		var lRightTrim = new RegExp(lTag + '\\s+');
		
		$('add_input_tags').value = $('add_input_tags').value.replace(lLeftTrim, '').replace(lRightTrim, '').replace(lTag, '');
		aElement.parentNode.removeChild(aElement);
	};
	
	
	/**
	 * Input box listener for typing tags
	 */
	this.listenerTagsKeyUp = function(aEvent)
	{
		this.createTagsBubbles();
		
		switch (aEvent.which) {
			case KEY_ENTER:
				this.saveBookmarkButton();
				break;
		}
	};

	
	/**
	 * Hide search results and show "add a bookmark" form
	 */
	this.showAddEditBookmark = function(aUrl, aTitle, aTags) 
	{
		$('add_remove').removeEventListener('click', function() {});
		$('infobox').hide();
		
		if (aUrl) {
			this.mEditExistingUrl = aUrl;
			$('add_title').innerHTML = 'Edit an existing bookmark';
			$('add_remove').style.display = 'block';

			$('add_remove').removeEventListeners();
			$('add_remove').addEventListener('click', function(aEvent) 
			{
				if (confirm('Are you sure you want to remove this bookmark?\n\n' + aTitle)) {
					mThis.mBgPage.lBookmarksTaggerBackground.remove(aUrl);
					mThis.listenerSearchKeyUp(KEY_ENTER);
					$('input_search').focus();
				}
			});

			$('add_input_url').value = aUrl;
			$('add_input_title').value = aTitle;
			$('add_input_title').disabled = '';
			$('add_input_tags').value = aTags;
			$('add_input_tags').disabled = '';
			$('add_button_save').disabled = '';
			
			$('results').hide();
			$('add').show();
			
			$('add_input_tags').focus();
		} else {
			this.mEditExistingUrl = false;
			$('add_title').innerHTML = 'Add a new bookmark';
			$('add_remove').style.display = 'none';

			$('add_input_url').value = 'http://';
			$('add_input_title').value = '';
			$('add_input_title').disabled = 'disabled';
			$('add_input_tags').value = '';
			$('add_input_tags').disabled = 'disabled';
			$('add_button_save').disabled = 'disabled';
			
			$('results').hide();
			$('add').show();
			
			$('add_input_url').focus();
		}
		
		this.createTagsBubbles();
	};

	
	/**
	 * Show a confirmation message and then remove all
	 */
	this.removeAll = function() 
	{
		if (confirm('Are you sure you want to permanently remove all your tagged bookmarks in Bookmarks Tagger?\n\nYour chrome bookmarks will not be removed.')) {
			mThis.mBgPage.lBookmarksTaggerBackground.removeAll(function() { mThis.loadUsedTags(); mThis.showAll(); });
		}
	};
	
	
	/**
	 * Save bookmark button
	 */
	this.saveBookmarkButton = function()
	{
		this.saveBookmark($('add_input_url').value, $('add_input_title').value, uniqueArray($('add_input_tags').value.split(' ')));
	};
	
	
	/**
	 * Save bookmark
	 */
	this.saveBookmark = function(aPageUrl, aPageTitle, aPageTags)
	{
		if (this.mEditExistingUrl == aPageUrl || !this.mEditExistingUrl) {
			chrome.extension.sendMessage({ saveBookmark: { url: aPageUrl, title: aPageTitle, tags: aPageTags }}, function(aResponse)
			{
				if (aResponse.status == 'ok') {
					mThis.searchByTags($('input_search').value, mThis.printResults);
					mThis.loadUsedTags();
				}
			});
		} else if (this.mEditExistingUrl != aPageUrl) {
			chrome.extension.sendMessage({ removeBookmark: mThis.mEditExistingUrl }, function(aResponse)
			{
				if (aResponse.status == 'ok') {
					chrome.extension.sendMessage({ saveBookmark: { url: aPageUrl, title: aPageTitle, tags: aPageTags }}, function(aResponse)
					{
						if (aResponse.status == 'ok') {
							mThis.searchByTags($('input_search').value, mThis.printResults);
							mThis.loadUsedTags();
						}
					});
				}
			});
		}
	};
	
	
	/**
	 * Show all bookmarks
	 */
	this.showAll = function()
	{
		if (!this.mSearching) {
			this.mSearching = true;
			$('x-in-search').hide();
			$('input_search').value = '';
			$('input_search').style.backgroundImage = 'url("media/loading.gif")';
			this.mBgPage.lBookmarksTaggerBackground.showAll(function(aResults) { mThis.printResults(aResults); });
		}
	};
}

var lBookmarksTaggerOptions = new BookmarksTaggerOptions();
lBookmarksTaggerOptions.initialize();
