function addListeners()
{
	console.log('add listeners');
	window.addEventListener('keyup', addBookmark, false);
}

function addBookmark(aEvent)
{
	console.log('addBookmark');
	console.log(aEvent);
	switch(aEvent.which) {
		case 78:
			console.log('yea');
			break;
	}
}


addListeners();
