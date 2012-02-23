
var tweetBoxPadding = 24;

twttr.anywhere.config({
	callbackURL: 'http://127.0.0.1/sigmusic/'
});

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

var tweetCount = 0;
var maxTweets = 5;

function addTweet(tweet, noAnim) {
	var avatar = tweet.avatar;
	var name = tweet.name;
	var username = tweet.username;
	var text = tweet.text;
	
	var profile = 'https://twitter.com/#!/' + username;
	var link = tweet.link || profile;
	
	// build the tweet
	var item = $('<article>').append(
		$('<header>').append(
			$('<a>').attr('href', profile).append(
				$('<img>').addClass('avatar').attr({
					src: avatar,
					alt: name
				}),
				$('<span>').addClass('name').text(name),
				' ',
				$('<span>').addClass('username').text('@' + username)
			),
			' ',
			$('<a>').addClass('permalink').attr('href', link).text('Open')
		),
		$('<p>').text(text)
	)
		
	
	// add the tweet to the list
	var id = 'tweet-' + tweetCount;
	var container = $('#feed');
	
	item.attr('id', id);
	container.prepend(item);
	
	// animate the tweet as it comes in
	if (!noAnim) {
		var y = container.offset().top;
		container.offset({ top: y - item.outerHeight() });
		container.animate({ top: 0 }, 1000);
	}
	
	// do fun twittery stuff to the text in the tweet
	twttr.anywhere(function(T) {
		T('#' + id + ' p').hovercards();
	});
	tweetCount++;
	
	hideExtraTweets();
}

function hideExtraTweets() {
	var tweets = $('#feed article');
	if (tweets.length > maxTweets) {
		tweets.eq(maxTweets - 1).nextAll().delay(1000).fadeOut(500, function() {
			$(this).remove();
		})
	}
}