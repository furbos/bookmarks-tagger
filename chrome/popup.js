function bookmarksTaggerPopup()
{
	var mThis = this;
	
	this.mPageTitle = '';
	this.mPageUrl   = '';
	this.mPageTags  = [];
	
	this.mBgPage    = false;
	
	
	/**
	 * Initialize
	 */
	this.initialize = function()
	{
		this.initializeVariables();
		this.mBgPage = chrome.extension.getBackgroundPage();
		this.addListeners();
		this.getPageInfo();
	};
	
	
	/**
	 * Initialize window.* IndexedDB objects
	 */
	this.initializeVariables = function()
	{
		window.IDBKeyRange    = window.IDBKeyRange ||window.webkitIDBKeyRange;
		window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
		window.indexedDB      = window.indexedDB || window.webkitIndexedDB;
	};
	
	
	/**
	 * Add event listeners
	 */
	this.addListeners = function()
	{
		document.addEventListener('DOMContentLoaded', function () {
			$('tags').addEventListener('keyup', function(aEvent) { mThis.listenerTagsKeyUp(aEvent); });
			$('title').addEventListener('keyup', function(aEvent) { mThis.listenerTitleKeyUp(aEvent); });
			$('remove').addEventListener('click', function(aEvent) { mThis.removeBookmark(); window.close(); });
		});
	};
	
	
	/**
	 * Create tags bubbles
	 */
	this.createTagsBubbles = function()
	{
		lTagsBubbles         = $('tags-bubbles');
		lTagsBubblesChildren = document.querySelectorAll('div[id="tags-bubbles"] a');

		for (var i = 0; i < lTagsBubblesChildren.length; i++) {
			lTagsBubblesChildren[i].parentNode.removeChild(lTagsBubblesChildren[i])
		}
		
		for (var j = 0; j < this.mPageTags.length; j++) {
			lTag = document.createElement('a');
			lTag.innerHTML = this.mPageTags[j];
			lTag.addEventListener('click', function(aEvent) { mThis.listenerAnchorClick(aEvent, this); });
			lTagsBubbles.appendChild(lTag);
		}
	};
	
	
	/**
	 * Input box listener for typing tags
	 */
	this.listenerTagsKeyUp = function(aEvent)
	{
		this.mPageTags = uniqueArray($('tags').value.split(' '));
		this.createTagsBubbles();
		
		switch (aEvent.which) {
			case KEY_ENTER:
				this.saveBookmark();
				window.close();
				break;
		}
	};
	
	
	/**
	 * Input box listener for typing title
	 */
	this.listenerTitleKeyUp = function(aEvent)
	{
		this.mPageTitle = $('title').value;
		
		switch (aEvent.which) {
			case KEY_ENTER:
				this.saveBookmark();
				$('tags').focus();
				break;
		}
	}
	
	
	/**
	 * Anchor listener for removing tags by clicking on them
	 */
	this.listenerAnchorClick = function(aEvent, aElement)
	{
		lTag = aElement.innerHTML;
		var lLeftTrim = new RegExp('\\s+' + lTag);
		var lRightTrim = new RegExp(lTag + '\\s+');
		
		lTags = $('tags');
		lTags.value = lTags.value.replace(lLeftTrim, '').replace(lRightTrim, '').replace(lTag, '');
		aElement.parentNode.removeChild(aElement);
		
		this.mPageTags = uniqueArray($('tags').value.split(' '));
		
		this.saveBookmark();
	};
	
	
	/**
	 * Get page about page loaded on the current tab
	 */
	this.getPageInfo = function()
	{
		chrome.tabs.getSelected(undefined, function(aTab) 
		{
			mThis.mPageUrl   = aTab.url;
			mThis.mPageTitle = aTab.title;

			chrome.extension.sendMessage({ getPageInfo: mThis.mPageUrl }, function(aResponse)
			{
				console.log(aResponse);
				if (aResponse.status == 'ok') {
					mThis.mPageTitle = aResponse.title;
					mThis.mPageTags  = aResponse.tags;
					
					$('remove').style.display = 'block';
					mThis.createTagsBubbles();
				} else {
					$('remove').style.display = 'none';
				}
				
				$('title').value = mThis.mPageTitle;
				$('tags').value  = mThis.mPageTags.join(' ');
			});
		});
	};

	
	/**
	 * Save bookmark
	 */
	this.saveBookmark = function()
	{
		if (this.mPageTags.length > 0) {
			chrome.extension.sendMessage({ saveBookmark: { url: this.mPageUrl, title: this.mPageTitle, tags: this.mPageTags }}, function(aResponse)
			{
				if (aResponse.status == 'ok') {
					// do something
				}
			});
		}
	};
	
	
	/**
	 * Remove bookmark
	 */
	this.removeBookmark = function()
	{
		chrome.extension.sendMessage({ removeBookmark: this.mPageUrl }, function(aResponse)
		{
			if (aResponse.status == 'ok') {
				// do something
			}
		});
	};
}


var lBookmarksTaggerPopup = new bookmarksTaggerPopup();
lBookmarksTaggerPopup.initialize();
