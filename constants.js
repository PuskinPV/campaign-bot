module.exports.REGEX_FLOW = {
	'START': /\/start (.+)|\/start/i,
	'CAPTCHA': /^[a-zA-Z0-9]{4}$/,
	'JOIN': /Join in/,
	'CONFIRM': /CONFIRM/,
	'TWITTER': /^@[A-Za-z0-9_]{1,15}$/,
	'WALET': /^(0x){1}[0-9a-fA-F]{40}$/,
	'ACCOUNT': /^👤 Account$/,
	'USEFUL_LINKS': /^📌 Useful Links$/
}

module.exports.COMPLETE_REPLY_MARKUP = {
	keyboard: [
		[
			{
				text: "👤 Account"
			},
			{
				text: "📌 Useful Links"
			}
		]
	],
	resize_keyboard: true
}