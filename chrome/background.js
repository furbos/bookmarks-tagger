var bookmarksTaggerBackground = function()
{
	var mThis = this;
	
	this.mDatabaseVersion   = '1.0';
	this.mDatabaseName      = 'bookmarks-tagger';
	this.mDatabaseBookmarks = 'bookmarks';
	this.mDatabaseTags      = 'tags';
	
	this.mSuggestions = [];
	
	this.mDebugTimer = 0;
	
	
	/**
	 * Initialize
	 */
	this.initialize = function()
	{
		this.initializeVariables();
		this.initializeDatabase();
		this.addListeners();
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
	 * Create database and proper indexes
	 */
	this.initializeDatabase = function()
	{
		//var lDeleteRequest = window.indexedDB.deleteDatabase('bookmarks-tagger');

		var lOpenRequest = window.indexedDB.open(this.mDatabaseName);
		lOpenRequest.onsuccess = function(aEvent)
		{
			lDb = aEvent.target.result;

			if (mThis.mDatabaseVersion != lDb.version) {
				lSetVersionRequest = lDb.setVersion(mThis.mDatabaseVersion);
				lSetVersionRequest.onsuccess = function(lEvent)
				{
					var lObjectStore = lDb.createObjectStore(mThis.mDatabaseBookmarks, { keyPath: 'url' });
					lObjectStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
					
					/*var lExamples = [ 
						{ 
							title: 'tag 1-2-3-4', 
							url: 'http://www.example.com/', 
							tags: [ 'tag1', 'tag2', 'tag3', 'tag4' ] 
						},
						{ 
							title: 'tag 1-2-3-5', 
							url: 'http://www.example.org/', 
							tags: [ 'tag1', 'tag2', 'tag3', 'tag5' ] 
						},
						{
							title: 'tag 1-2-4-6-s',
							url: 'https://www.google.com/',
							tags: [ 'tag1', 'tag2', 'tag4', 'tag6', 'supertag' ]
						}
					];
					
					for (var i in lExamples) {
						lObjectStore.add(lExamples[i]);
					}*/
				};
			}
		}
	};
	
	
	/**
	 * Add event listeners for omnibox
	 */
	this.addListeners = function()
	{
		chrome.omnibox.onInputChanged.addListener(this.listenerOmniboxOnInputChanged);
		chrome.omnibox.onInputStarted.addListener(this.listenerOmniboxOnInputStarted);
		chrome.omnibox.onInputEntered.addListener(this.listenerOmniboxOnInputEntered);
		
		chrome.extension.onMessage.addListener(this.listenerExtensionOnMessage);
	};
	
	
	/**
	 * Omnibox listener to be called when user is typing tags
	 */
	this.listenerOmniboxOnInputChanged = function(aText, aSuggest)
	{
		mThis.mDebugTimer = new Date().getTime();
		var lUserInputTags = aText.replace(/^\s+/, '').replace(/(\s{2,}|\s+$)/, ' ').replace(/\s+$/, ' ').split(' ');
		var lSearchTagRequest = window.indexedDB.open(mThis.mDatabaseName);
		var lFilterTags  = [];
		
		lSearchTagRequest.onsuccess = function(aEvent)
		{
			var lDb            = aEvent.target.result;
			var lTransaction   = lDb.transaction([mThis.mDatabaseBookmarks], 'readonly');
			var lObjectStore   = lTransaction.objectStore(mThis.mDatabaseBookmarks);
			var lIndex         = lObjectStore.index(mThis.mDatabaseTags);
			mThis.mSuggestions = [];
			
			if (lUserInputTags.length == 1 && lUserInputTags[0].length > 0) {

				var rangeTagSearch = IDBKeyRange.bound(lUserInputTags[0], lUserInputTags[0] + '\uffff');
				lIndexOpenCursor = lIndex.openCursor(rangeTagSearch);

			} else if (lUserInputTags.length > 1) {
				lLastIndex = lUserInputTags.length - 1;
				
				if (lUserInputTags[lLastIndex].length > 0) {
					var rangeTagSearch = IDBKeyRange.bound(lUserInputTags[lLastIndex], lUserInputTags[lLastIndex] + '\uffff');
					lIndexOpenCursor = lIndex.openCursor(rangeTagSearch);
					
					lFilterTags = lUserInputTags.slice(0, lLastIndex);
					
				} else {
					lIndexOpenCursor = lIndex.get(lUserInputTags[lLastIndex - 1]);
					lFilterTags = lUserInputTags.slice(0, lLastIndex - 1);
				}
				
			} else {
			
				return;
				
			}
			
			lIndexOpenCursor.onsuccess = function(e)
			{
				var lCursor = e.target.result;
				
				if (lCursor) {
					mThis.mSuggestions.push(lCursor.value);
					lCursor.continue();
				} else {
					mThis.filterTags(lFilterTags, aSuggest);
				}
			}
		}
	};
	
	
	/**
	 * Omnibox listener to be called when user types keyword
	 */
	this.listenerOmniboxOnInputStarted = function()
	{
	
	};
	
	
	/**
	 * Omnibox listener to be called when user accepts a selected page / entered tags
	 */
	this.listenerOmniboxOnInputEntered = function(aText)
	{
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
	this.filterTags = function(aTags, aSuggestCallback)
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
					description: this.mSuggestions[i].title 
				});
			}
		}

		var lDebugTimer = new Date().getTime() - this.mDebugTimer;
		chrome.omnibox.setDefaultSuggestion({ description: 'Searching took ' + lDebugTimer + 'ms' });
		aSuggestCallback(lSuggestions);
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
				var lTransaction = lDb.transaction([mThis.mDatabaseBookmarks], 'readonly');
				var lObjectStore = lTransaction.objectStore(mThis.mDatabaseBookmarks);
				
				var lRequest = lObjectStore.get(aRequest.getPageInfo);
				
				lRequest.onsuccess = function(aEvent)
				{
					var lResult = aEvent.target.result;
					
					if (lResult) {
						var lResponse = { status: 'ok', title: lResult.title, tags: lResult.tags };
					} else {
						var lResponse = { status: 'error' };
					}
					
					aSendResponse(lResponse);
				}
			}
		} else if (aRequest.removeBookmark) {
			var lRemoveBookmarkRequest = window.indexedDB.open(mThis.mDatabaseName);
			lRemoveBookmarkRequest.onsuccess = function(aEvent)
			{
				var lDb = aEvent.target.result;
				var lTransaction = lDb.transaction([mThis.mDatabaseBookmarks], 'readwrite');
				var lObjectStore = lTransaction.objectStore(mThis.mDatabaseBookmarks);
				
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
				var lTransaction = lDb.transaction([mThis.mDatabaseBookmarks], 'readwrite');
				var lObjectStore = lTransaction.objectStore(mThis.mDatabaseBookmarks);

				var lRequest = lObjectStore.put({
					title: aRequest.saveBookmark.title, 
					url:   aRequest.saveBookmark.url, 
					tags:  aRequest.saveBookmark.tags 
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
	 * Remove all doubles (and empty strings) from the array
	 */
	this.uniqueArray = function(aArray)
	{
		var lUniqueArray = [];
		
		for (var i in aArray) {
			if (!inArray(aArray[i], lUniqueArray) && aArray[i].replace(/^\s+/, '').replace(/\s+$/, '') != '') lUniqueArray.push(aArray[i]);
		}
		
		return lUniqueArray;
	};
}


var lBookmarksTaggerBackground = new bookmarksTaggerBackground();
lBookmarksTaggerBackground.initialize();