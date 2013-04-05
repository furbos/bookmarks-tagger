var bookmarksTaggerBackground = function()
{
	var mThis = this;
	
	this.mDatabaseVersion = 2;
	this.mDatabaseName    = 'bookmarks-tagger';
	this.mStoreBookmarks  = 'bookmarks';
	this.mIndexTags       = 'tags';
	
	this.mSuggestions = [];
	this.mUsedTags    = {};
	
	this.mTransactionReadOnly  = 'readonly';
	this.mTransactionReadWrite = 'readwrite';
	

	/**
	 * Initialize
	 */
	this.initialize = function()
	{
		this.initializeDatabase();
		this.checkDatabaseVersion();
		this.addListeners();
	};


	/**
	 * Create database and proper indexes
	 */
	this.initializeDatabase = function()
	{
		var lOpenDb = window.indexedDB.open(this.mDatabaseName, this.mDatabaseVersion);
		lOpenDb.onupgradeneeded = function(aEvent)
		{
			var lDb = aEvent.target.result;

			if (lDb.objectStoreNames.contains('bookmarks')) return true;
			var lObjectStore = lDb.createObjectStore(mThis.mStoreBookmarks, { keyPath: 'url' });
			lObjectStore.createIndex(mThis.mIndexTags, mThis.mIndexTags, { unique: false, multiEntry: true });
		}
	};


	/**
	 * Check which connection method to use
	 */
	this.checkDatabaseVersion = function()
	{
		var lOpenDb = window.indexedDB.open(this.mDatabaseName);
		lOpenDb.onsuccess = function(aEvent)
		{
			var lDb = aEvent.target.result;
			try {
				var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadWrite);
				var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
				lObjectStore.delete(0);
			} catch(aException) {
				if (aException.name == 'READ_ONLY_ERR') {
					mThis.mTransactionReadOnly  = IDBTransaction.READ_ONLY;
					mThis.mTransactionReadWrite = IDBTransaction.READ_WRITE;
				}
			}
		}
	};


	/**
	 * Add event listeners
	 */
	this.addListeners = function()
	{
		chrome.omnibox.onInputChanged.addListener(this.listenerOmniboxOnInputChanged);
		chrome.omnibox.onInputEntered.addListener(this.listenerOmniboxOnInputEntered);
		
		chrome.extension.onMessage.addListener(this.listenerExtensionOnMessage);
	};
	
	
	/**
	 * Omnibox listener to be called when user is typing tags
	 */
	this.listenerOmniboxOnInputChanged = function(aText, aSuggest)
	{
		mThis.searchByTags(aText, aSuggest);
	};
	
	
	/**
	 * Create tags from a string
	 */
	this.textToTags = function(aText)
	{
		return aText.replace(/^\s+/, '').replace(/(\s{2,}|\s+$)/, ' ').replace(/\s+$/, ' ').split(' ');
	};
	
	
	/**
	 * Searching bookmarks by tags
	 */
	this.searchByTags = function(aText, aCallback)
	{
		var lUserInputTags = this.textToTags(aText);
		var lFilterTags  = [];
		var lSearchTagRequest = window.indexedDB.open(mThis.mDatabaseName);
		
		lSearchTagRequest.onsuccess = function(aEvent)
		{
			var lDb            = aEvent.target.result;
			var lTransaction   = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadOnly);
			var lObjectStore   = lTransaction.objectStore(mThis.mStoreBookmarks);
			var lIndex         = lObjectStore.index(mThis.mIndexTags);
			mThis.mSuggestions = [];
			
			if (lUserInputTags.length == 1 && lUserInputTags[0].length > 0) {

				var rangeTagSearch = window.IDBKeyRange.bound(lUserInputTags[0], lUserInputTags[0] + '\uffff');
				lIndexOpenCursor = lIndex.openCursor(rangeTagSearch);

			} else if (lUserInputTags.length > 1) {
				lLastIndex = lUserInputTags.length - 1;
				
				if (lUserInputTags[lLastIndex].length > 0) {
					var rangeTagSearch = window.IDBKeyRange.bound(lUserInputTags[lLastIndex], lUserInputTags[lLastIndex] + '\uffff');
					lIndexOpenCursor = lIndex.openCursor(rangeTagSearch);
					
					lFilterTags = lUserInputTags.slice(0, lLastIndex);
				} else {
					var rangeTagSearch = window.IDBKeyRange.bound(lUserInputTags[lLastIndex - 1], lUserInputTags[lLastIndex - 1]);
					lIndexOpenCursor = lIndex.openCursor(rangeTagSearch);
					
					lFilterTags = lUserInputTags.slice(0, lLastIndex - 1);
				}
				
			} else {
				aCallback([]);
				return;
			}

			lIndexOpenCursor.onsuccess = function(e)
			{
				var lCursor = e.target.result;
				
				if (lCursor) {
					lCursor.value.title = lCursor.value.title.replace('&', '&amp;');
					mThis.mSuggestions.push(lCursor.value);
					lCursor.continue();
				} else {
					mThis.filterTags(lFilterTags, aCallback);
				}
			}
		}
	};
	
	
	/**
	 * Omnibox listener to be called when user accepts a selected page / entered tags
	 */
	this.listenerOmniboxOnInputEntered = function(aText)
	{
		var lUrl = '';

		if (aText.indexOf('http') == 0) {
			lUrl = aText;
		} else {
			lUrl = 'options.html#' + encodeURIComponent(aText);
		}
		
		chrome.tabs.getSelected(null,
			function(aSelectedTab) {
				chrome.tabs.update(aSelectedTab.id, { url: lUrl });
			}
		);
	};
	
	
	/**
	 * Filter sites which doesn't contain all tags
	 */
	this.filterTags = function(aTags, aSuggestionCallback)
	{
		var lSuggestions = [];
		
		skipResult:
		for (var i in this.mSuggestions) {
			for (var t in aTags) { 
				if (!inArray(aTags[t], this.mSuggestions[i].tags)) continue skipResult;
			}
			
			if (this.mSuggestions[i]) {
				lSuggestions.push({ 
					content: this.mSuggestions[i].url,
					description: this.mSuggestions[i].title,
					tags: this.mSuggestions[i].tags
				});
			}
		}

		var lDefaultDescription = '';
		if (lSuggestions.length == 1) {
			lDefaultDescription = 'Go directly to the "' + lSuggestions[0].description + '"';
		} else {
			lDefaultDescription = 'Show results for the tags.';
		}
		
		chrome.omnibox.setDefaultSuggestion({ description: lDefaultDescription });
		aSuggestionCallback(lSuggestions);
	};
	
	
	/**
	 * Handles recieved messages accross extension
	 */
	this.listenerExtensionOnMessage = function(aRequest, aSender, aSendResponse)
	{
		if (aRequest.getPageInfo) {
			var lPageInfoRequest = window.indexedDB.open(mThis.mDatabaseName);
			lPageInfoRequest.onsuccess = function(aEvent)
			{
				var lDb = aEvent.target.result;
				var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadOnly);
				var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
				
				var lRequest = lObjectStore.get(aRequest.getPageInfo);
				
				lRequest.onsuccess = function(aEvent)
				{
					var lResult = aEvent.target.result;
					var lResponse = {};

					if (lResult) {
						lResponse = { status: 'ok', title: lResult.title, tags: lResult.tags, url: lResult.url };
					} else {
						lResponse = { status: 'error' };
					}
					
					aSendResponse(lResponse);
				}
			}
		} else if (aRequest.removeBookmark) {
			var lRemoveBookmarkRequest = window.indexedDB.open(mThis.mDatabaseName);
			lRemoveBookmarkRequest.onsuccess = function(aEvent)
			{
				var lDb = aEvent.target.result;
				var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadWrite);
				var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
				
				var lRequest = lObjectStore.delete(aRequest.removeBookmark);

				lRequest.onsuccess = function(aEvent)
				{
					aSendResponse({ status: 'ok' });
				}
			}
		} else if (aRequest.saveBookmark) {
			var lSaveBookmarkRequest = window.indexedDB.open(mThis.mDatabaseName);
			lSaveBookmarkRequest.onsuccess = function(aEvent)
			{
				var lDb = aEvent.target.result;
				var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadWrite);
				var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);

				var lRequest = lObjectStore.put({
					title: aRequest.saveBookmark.title,
					url  : aRequest.saveBookmark.url, 
					tags : aRequest.saveBookmark.tags 
				});
				
				lRequest.onsuccess = function(aEvent)
				{
					aSendResponse({ status: 'ok' });
				}				
			}
		}
		
		return true;
	};
	
	
	/**
	 * Remove all entries
	 */
	this.removeAll = function(aCallback)
	{
		var lRemoveAllRequest = window.indexedDB.open(mThis.mDatabaseName);
		lRemoveAllRequest.onsuccess = function(aEvent)
		{
			var lDb = aEvent.target.result;
			var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadWrite);
			var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
			
			var lKeyRange = window.IDBKeyRange.lowerBound(0);
			var lRequest = lObjectStore.openCursor(lKeyRange);
			
			lRequest.onsuccess = function(aEvent)
			{
				var lResult = aEvent.target.result;
				
				if (lResult) {
					lResult.delete();
					lResult.continue();
				} else {
					aCallback();
				}
			}
		}
	};
	
	
	/**
	 * Remove a bookmark by url
	 */
	this.remove = function(aUrl)
	{
		var lRemoveRequest = window.indexedDB.open(mThis.mDatabaseName);
		lRemoveRequest.onsuccess = function(aEvent)
		{
			var lDb = aEvent.target.result;
			var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadWrite);
			var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
			lObjectStore.delete(aUrl);
		}
	};
	
	
	/**
	 * Show all entries
	 */
	this.showAll = function(aCallback)
	{
		var lShowAllRequest = window.indexedDB.open(mThis.mDatabaseName);
		lShowAllRequest.onsuccess = function(aEvent)
		{
			mThis.mSuggestions = [];
			
			var lDb = aEvent.target.result;
			var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadOnly);
			var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
			
			var lKeyRange = window.IDBKeyRange.lowerBound(0);
			var lRequest = lObjectStore.openCursor(lKeyRange);
			
			lRequest.onsuccess = function(aEvent)
			{
				var lResult = aEvent.target.result;
				
				if (lResult) {
					mThis.mSuggestions.push({ 
						content: lResult.value.url,
						description: lResult.value.title,
						tags: lResult.value.tags
					});
					
					lResult.continue();
				} else {
					aCallback(mThis.mSuggestions);
				}
			}
		}
	};
	
	
	/**
	 * Get all used tags
	 */
	this.getUsedTags = function(aCallback)
	{
		var lUsedTagsRequest = window.indexedDB.open(mThis.mDatabaseName);
		lUsedTagsRequest.onsuccess = function(aEvent)
		{
			mThis.mUsedTags = {};
			
			var lDb = aEvent.target.result;
			var lTransaction = lDb.transaction([mThis.mStoreBookmarks], mThis.mTransactionReadOnly);
			var lObjectStore = lTransaction.objectStore(mThis.mStoreBookmarks);
			
			var lKeyRange = window.IDBKeyRange.lowerBound(0);
			var lRequest = lObjectStore.openCursor(lKeyRange);
			
			lRequest.onsuccess = function(aEvent)
			{
				var lResult = aEvent.target.result;

				if (lResult) {
					if (lResult.value.tags != []) {
						for(var i = 0; i < lResult.value.tags.length; i++) {
							if (mThis.mUsedTags.hasOwnProperty(lResult.value.tags[i])) {
								mThis.mUsedTags[lResult.value.tags[i]] = mThis.mUsedTags[lResult.value.tags[i]] + 1;
							} else {
								mThis.mUsedTags[lResult.value.tags[i]] = 1;
							}
						}
					}
					
					lResult.continue();
				} else {
					aCallback(mThis.mUsedTags);
				}
			}
		}
	};
};


var lBookmarksTaggerBackground = new bookmarksTaggerBackground();
lBookmarksTaggerBackground.initialize();
