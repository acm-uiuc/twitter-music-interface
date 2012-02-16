
var tweetBoxPadding = 20;

twttr.anywhere(function(T) {
	
	T('#send-tweet').tweetBox({
		height: 100,
		label: 'Tweet something',
		defaultContent: '@sigmusicuiuc',
	});
	
	var interval = window.setInterval(function() {
		if (window.frames[1]) {
			window.clearInterval(interval);
			resizeTweetBox();
			
			$(window).resize(resizeTweetBox);
		}
		
	}, 500)
	
});

function resizeTweetBox() {
	var width = $('#send-tweet').width() - tweetBoxPadding;
	$(window.frames[1].document).find('#editor textarea').width(width);
}