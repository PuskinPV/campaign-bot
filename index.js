require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');

const { updateUser, findUser } = require('./controllers')

// Import Environment Variable
const {
	BOT_URL,
	BOT_TOKEN,
	TWITTER_BEAR_TOKEN,
	TWITTER,
	TELEGRAM_CHANNEL,
	TELEGRAM_GROUP,
	PARTNER_TWITTER,
	PARTNER_TELEGRAM_CHANNEL,
	PARTNER_TELEGRAM_GROUP,
	PINNED_TWEET_URL,
} = process.env

// Import constants
const { REGEX_FLOW } = require('./constants')

// Import and Config axios
const axios = require('axios')
axios.defaults.headers.common = {
	'Authorization': `bearer ${TWITTER_BEAR_TOKEN}`
}

// Init Default Member
const member = {
	telegramId: null,
	username: null,
	twitterId: null,
	twitterUsername: null,
	addressWallet:null,
	referBy: null,	

	isRegard: false,
	isJoinedTelegrams: false,
	isFollowTwitter: false,
	isFollowTwitterParter: false,
	isLikeTweet: false,
	isRetweet: false
};

// Config Bot
const bot = new TelegramBot(BOT_TOKEN, {polling: true});

// Fields
const TELEGRAM_LIST = [`@${TELEGRAM_GROUP}`, `@${TELEGRAM_CHANNEL}`, `@${PARTNER_TELEGRAM_GROUP}`, `@${PARTNER_TELEGRAM_CHANNEL}`];

const STATE = {
	'START': 0,
	'CAPTCHA': 1,
	'JOIN_IN': 2,
	'TWITTER': 3,
	'WALLET': 4
}

var state = STATE.START;

//handle callback query data



const checkJoinedTelegrams = async(telegramId, checkTeleList) => {
	// Need to fix
	return true
	var checkResultsPromises = checkTeleList.map(checkTeleId => {
		console.log(checkTeleId)
		return bot.getChatMember(checkTeleId, telegramId)
	})

	const members = await Promise.all(checkResultsPromises)
	
	const checkResults = members.reduce((res, member) => {
		return res && ["creator", "administrator", "member"].includes(member.status)
	}, true)
	return checkResults
}


// Check Valid Twitter
const checkValidTwitter = async(username) => {
	// username format: @username
	const pureUsername = username.match(/[\w]+/)?.[0] || ''
	try {
		const res = await axios.get(`https://api.twitter.com/2/users/by/username/${pureUsername}`)
		const userId = res.data.data?.id
		return typeof userId !== 'undefined'
	} catch (err) {
		// Ignore
		console.log(err.response.data)
		return true
	}
}

// Check Valid Wallet Address
const Web3 = require('web3')
const rpcURL = 'https://mainnet.infura.io/v3/2c6976208ef0479dbc1a402db2ceb870'
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
const checkWalletAddress = (address) => {
	var isValid = web3.utils.isAddress(address);
	return isValid;
}

const checkCaptcha = (a, b, result) => {
	console.log(a + b, result, a + b == result)
	return a + b == result;
}
let a = Math.floor(Math.random() * 10);
let b = Math.floor(Math.random() * 10);


bot.onText(/.*/, async(msg) => {
	if (REGEX_FLOW.START.test(msg.text)) {
		a = Math.floor(Math.random() * 10);
		b = Math.floor(Math.random() * 10);
		bot.sendMessage(msg.chat.id, `${a} + ${b} = ?`)
		state = STATE.CAPTCHA
		return
	}
	console.log("state", state);
	
	switch(state) {
		// Handle Captcha (state 1)
		case STATE.CAPTCHA:
			// Check Captcha
			const isPassCaptcha = checkCaptcha(a, b, msg.text)
			console.log(isPassCaptcha)
			if (isPassCaptcha) {
				bot.sendMessage(msg.chat.id, 
					'Please complete the following tasks.',
					{
						reply_markup: {
							// "resize_keyboard":true,
							"inline_keyboard":[
								[{ text: "Join MetaRacers' Telegram Announcement", url: `https://t.me/${TELEGRAM_CHANNEL}` }],
								[{ text: "Join MetaRacers' Telegram Community", url: `https://t.me/${TELEGRAM_GROUP}` }],
								[{ text: "Follow MetaRacers' Twitter", url: `https://twitter.com/${TWITTER}` }],
								[{ text: 'Join BSCStation’s Telegram Announcement', url: `https://t.me/${PARTNER_TELEGRAM_CHANNEL}`}],
								[{ text: 'Join BSCStation’s Community', url: `https://t.me/${PARTNER_TELEGRAM_CHANNEL}`}],
								[{ text: "Follow BSCStation's Twitter", url: `https://twitter.com/${PARTNER_TWITTER}` }],
								[{ text: 'Retweet + Share + Tag 3 friends ', url: PINNED_TWEET_URL }],
								[{ text: 'Confirm ✅ ', callback_data: 'CONFIRM' }]
							]
						}
					}	
				);
				// bot.on("callback_query", (data)=>{				
				// 	if(data?.data == 'CONFIRM'){
				// 		console.log(state)
				// 	}
				// })
				state += 1;

			} else {
				bot.sendMessage(msg.chat.id, '❌ Wrong verification code. Please enter correct verification code.')
			}
			break;
		// check join (state 2)
		case STATE.JOIN_IN: 
			if (REGEX_FLOW.CONFIRM.test(msg.text)) {
				// check join all telegram
				const isJoinedTelegrams = await checkJoinedTelegrams(msg.chat.id, TELEGRAM_LIST);
				
				if (isJoinedTelegrams) {
					bot.sendMessage(msg.chat.id, 'Please send your twitter username begins with the “@”')
					state += 1
				} else {
					bot.sendMessage(msg.chat.id, 'You have unfinished tasks. Please complete tasks and press Confirm.')
				}
			} else {
				bot.sendMessage(msg.chat.id, 'Please Click Confirm Button')
			}
			break
		
		// Check Twitter (state 3)
		case STATE.TWITTER:
			if (REGEX_FLOW.TWITTER.test(msg.text)) {
				const isValidTwitter = await checkValidTwitter(msg.text)
				// console.log(isValidTwitter, msg.text)
				if (isValidTwitter) {
          bot.sendMessage(msg.chat.id, 'Send your Binance Smart Chain (BEP20) wallet address. (Do not send address from exchange)')
					state += 1
					break
				}
			}
			bot.sendMessage(msg.chat.id, '⚠️ Invalid username. Send your correct twitter username begins with the “@”')
			break
		
		// Check Wallet Address (state 4)
		case STATE.WALLET:
			if (REGEX_FLOW.WALET.test(msg.text)) {
				const isValidWallet = checkWalletAddress(msg.text)
				if (isValidWallet) {
					//TODO: button ACCOUNT and USEFULL LINK
					bot.sendMessage(msg.chat.id, 
						'Congratulations! 🎉\n' +
						'You have successfully registered for MRS Airdrop.\n\n' +
						'Your Referral Link 👇' +
						`${BOT_URL}?start=${msg.chat.id}`
					)
				} else {
					bot.sendMessage(msg.chat.id, '❌ Invalid BEP20 wallet address, please send correct BEP20 wallet address.')
				}
			}
			break
	}
});

bot.on("callback_query",async (data)=>{				
	// press confirm to check all
	if(data?.data == 'CONFIRM'){
		const isJoinedTelegrams = await checkJoinedTelegrams(data.message.chat.id,TELEGRAM_LIST);
		if (isJoinedTelegrams) {
			bot.sendMessage(data.message.chat.id, 'Please send your twitter username begins with the “@”')
			state += 1
			} else {
			await bot.answerCallbackQuery(data.id, "You have unfinished tasks. Please complete tasks and press Confirm.", show_alert=true)	
			// bot.sendMessage(data.message.chat.id, 'You have unfinished tasks. Please complete tasks and press Confirm.')
			}
		} else {
			bot.sendMessage(data.message.chat.id, 'Please Click Confirm Button')
		}
	}
);