if (!localStorage['initialized']) {
	localStorage['initialized'] = true;
}

chrome.bookmarks.onCreated.addListener(function(id, bookmark) { 
	console.log('Bookmark has been added'); console.log(id); console.log(bookmark); 

	chrome.tabs.getSelected(null,
		function(aSelectedTab) {
			console.log(aSelectedTab);
			//chrome.pageAction.show(aSelectedTab.id);
		}
	);
});
