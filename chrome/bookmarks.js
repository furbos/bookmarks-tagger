function bookmarkTagger() 
{
	var __construct = function()
	{
		addEventListeners();
	}


	var addEventListeners = function()
	{
		console.log('add listeners');
	
		//window.addEventListener('keydown', keyDownEvent, false);
console.log(chrome);
console.log(chrome.bookmarks);
			var dlg = new goog.ui.Dialog();
			dlg.setContent('sdsd');
			dlg.setTitle('qwerqwerqwer');
			dlg.setVisible(true);
	}


	var keyDownEvent = function(aEvent)
	{
		// Catch ctrl+d
		if (aEvent.ctrlKey && aEvent.which == 68) {
			console.log('bookmark');
			console.log(aEvent);
			addBookmark();
			document.getElementById('login_username').focus();
		}
	}

	
	var createBackground = function()
	{
		console.log('createBackground');
		lBackground = document.createElement('div');
		lBackground.innerHTML = 'asdasdasdasdasdasd';
		document.appendChild(lBackground);
	}

	
	var addBookmark = function()
	{
		console.log('addBookmark');
		createBackground();
	}
	

	__construct();
}


bookmarkTagger();
