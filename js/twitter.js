
var tweetBoxPadding = 12;
var tweetCount = 0;
var maxTweets = 6;


twttr.anywhere.config({
	callbackURL: 'http://127.0.0.1/sigmusic/'
});

twttr.anywhere(function(T) {
	
	T('#send-tweet').tweetBox({
		width: 328,
		label: 'Tweet to the app',
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


function addTweet(tweet, noAnim) {
	console.log(tweet);
	var avatar = tweet.userimgurl || null;
	var username = tweet.username || '<no username>';
	var name = tweet.displayname || username;
	var text = tweet.raw_input || '<no text>';
	var params = tweet.params || {};
	
	var profile = 'https://twitter.com/#!/' + username;
	var link = tweet.url || profile;
	
	// build the tweet
	var item = $('<article>').append(
		$('<header>').append(
			$('<a>').attr('href', profile).append(
				$('<img class="avatar">').attr({
					src: avatar,
					alt: name
				}),
				$('<span>').addClass('name').text(name),
				' ',
				$('<span>').addClass('username').text('@' + username)
			),
			' ',
			$('<a class="permalink">').attr('href', link).text('Open')
		),
		$('<p>').text(text),
		$('<aside>').append($('<ul>'))
	)
		
	var hasParams = false;
	var paramList = item.find('aside ul');
	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			hasParams = true;
			
			var value = Math.round(params[key]);
			if (value < 0)
				value = '&minus;' + Math.abs(value);
			
			paramList.append(
				$('<li>').append(
					$('<span class="param">').text(key),
					' ',
					$('<span class="value">').html(value)
				)
			)
		}
	}
	
	if (!hasParams)
		item.find('aside').addClass('empty');
		
	
	// add the tweet to the list
	var id = 'tweet-' + tweetCount;
	var container = $('#feed');
	
	item.attr('id', id);
	container.prepend(item);
	
	// animate the tweet as it comes in
	if (!noAnim) {
		var y = container.offset().top;
		container.offset({top: y - item.outerHeight()});
		container.animate({top: 0}, 1000);
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

