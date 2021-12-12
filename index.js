require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');

const { updateUser, findUser, countRefer } = require('./controllers')

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
const { 
	REGEX_FLOW,
	COMPLETE_REPLY_MARKUP
} = require('./constants')

// Import and Config axios
const axios = require('axios')
axios.defaults.headers.common = {
	'Authorization': `bearer ${TWITTER_BEAR_TOKEN}`
}

// Import services
const { countPoint } = require('./services')

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
	'WALLET': 4,
	'COMPLETE': 5
}

var state = STATE.START;

//handle callback query data


const checkJoinedTelegrams = async(telegramId, checkTeleList) => {
	try {
		var checkResultsPromises = checkTeleList.map(checkTeleId => {
			console.log(checkTeleId)
			return bot.getChatMember(checkTeleId, telegramId)
		})

		const members = await Promise.all(checkResultsPromises)
		
		const checkResults = members.reduce((res, member) => {
			return res && ["creator", "administrator", "member"].includes(member.status)
		}, true)
		return checkResults
	} catch (err) {
		console.log(err)
	}
}


// Check Valid Twitter
const checkValidTwitter = async(username) => {
	// Return object with keys {isValid, twitterId}
	try {
		const res = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`)
		const twitterId = res.data.data?.id
		return {
			isValid: typeof twitterId !== 'undefined',
			twitterId: twitterId
		}
	} catch (err) {
		// Ignore
		console.log(err.response.data)
		return {
			isValid: true
		}
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


bot.onText(/.*/, async(msg, match) => {
	if (REGEX_FLOW.START.test(msg.text)) {
		const existsUser = await findUser({ telegramId: msg.chat.id })
		const refelId = match[0].split(' ')[1]
		if (refelId && !existsUser) {
			updateUser({
				telegramId: msg.chat.id,
				referBy: refelId
			})
			console.log(msg.chat.username)
		}
		
		a = Math.floor(Math.random() * 10);
		b = Math.floor(Math.random() * 10);
		bot.sendMessage(msg.chat.id, `${a} + ${b} = ?`,{
			reply_markup: {
				remove_keyboard:true
			}
		})
		state = STATE.CAPTCHA
		return
	}
	console.log("state", state);
	
	switch(state) {
		// Handle Captcha (state 1)
		case STATE.CAPTCHA:
			// Check Captcha
			const isPassCaptcha = checkCaptcha(a, b, msg.text)
			if (isPassCaptcha) {
				await bot.sendMessage(msg.chat.id, 
					"Metaracers' Tasks:\n" +
					`🔹️ <a href='https://t.me/${TELEGRAM_CHANNEL}'>Metaracers' Telegram Channel</a>\n` +
					`🔹️ <a href='https://t.me/${TELEGRAM_GROUP}'>Metaracers' Community</a>\n` +
					`🔹️ <a href='https://twitter.com/${TWITTER}'>Metaracers' Twitter</a>` +
					"\nPress Confirm after completing all tasks!"
					,{
						parse_mode: "HTML",
						disable_web_page_preview: true
					})
				await bot.sendMessage(msg.chat.id, 
					"BSCStation's Tasks:\n" +
					`🔹️ <a href='https://t.me/${PARTNER_TELEGRAM_CHANNEL}'>BSCStation's Telegram Channel</a>\n` +
					`🔹️ <a href='https://t.me/${PARTNER_TELEGRAM_GROUP}'>BSCStation's Community</a>\n` +
					`🔹️ <a href='https://twitter.com/${PARTNER_TWITTER}'>BSCStation's Twitter</a>\n` +
					`🔹️ <a href='${PINNED_TWEET_URL}'>Retweet + Share + Tag 3 friends</a>` +
					"\nPress Confirm after completing all tasks!"
				,{
					parse_mode:"HTML",
					disable_web_page_preview: true,
					reply_markup:{
						inline_keyboard:[
							[{ text: 'Confirm ✅ ', callback_data: 'CONFIRM' }]
						],
					}
				});

				state = STATE.JOIN_IN;

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
				const username = msg.text.match(/[\w]+/)?.[0] || ''
				const { isValid, twitterId } = await checkValidTwitter(username)
				if (isValid) {
					const existsUser = await findUser({ twitterId: twitterId })
					if (existsUser && existsUser.telegramId != msg.chat.id) {
						// check if this twitter has been taken by another
						bot.sendMessage(msg.chat.id, 'Your twitter has been used by another!')
					} else {
						// Save [twitterId, twitterUsername] to database
						updateUser({
							telegramId: msg.chat.id,
							twitterId: twitterId,
							twitterUsername: username
						})

						// Next step
						bot.sendMessage(msg.chat.id, 'Send your Binance Smart Chain (BEP20) wallet address. (Do not send address from exchange)')
						state = STATE.WALLET
					}
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
					// Save [wallet] to database
					updateUser({
						telegramId: msg.chat.id,
						addressWallet: msg.text
					})
					//TODO: button ACCOUNT and USEFULL LINK
					bot.sendMessage(msg.chat.id, 
						'🎉 <b>Congratulations</b>! 🎉\n' +
						'You have completed the <b>Metaracers x BSCStation Campaign</b>.\n' +
						'Tasks completion will be checked again before result. ' +
						'Fake/bots will be rejected.\n\n' +
						'👇 Your Referral Link 👇\n' +
						`${BOT_URL}?start=${msg.chat.id}`,
						{
							parse_mode: "HTML",
							reply_markup: COMPLETE_REPLY_MARKUP
						}
					)
					state = STATE.COMPLETE
					break
				}
			}
			bot.sendMessage(msg.chat.id, '❌ Invalid BEP20 wallet address, please send correct BEP20 wallet address.')
			break

		default:
			if (REGEX_FLOW.ACCOUNT.test(msg.text)) {
				const referralCount = await countRefer(msg.chat.id)
				const user = await findUser({ telegramId: msg.chat.id })
				
				bot.sendMessage(msg.chat.id, 
					`🆔 <b>Telegram ID:</b> ${user.telegramId}\n` +
					`🏦 <b>Wallet Address:</b> <pre>${user.addressWallet}</pre>\n` +
					`💬 <b>Twitter: </b> <a href='https://twitter.com/${user.twitterUsername}'>@${user.twitterUsername}</a>\n` +
					`💰 <b>Point:</b> ${countPoint(user)}\n\n` +
					`👥 <b>People invited:</b> ${referralCount}\n` +
					`🔗 <b>Referral Link:</b> ${BOT_URL}?start=${msg.chat.id}`,
					{
						parse_mode: "HTML",
						disable_web_page_preview: true
					}
				)
			} else if (REGEX_FLOW.USEFUL_LINKS.test(msg.text)) {
				bot.sendMessage(msg.chat.id, 
					`<b>Website: </b>https://www.meta-racers.com\n` +
					`<b>Twitter: </b>https://twitter.com/MetaRacersBsc\n` +
					`<b>Telegram Channel : </b>https://t.me/MetaRacersbsc_official\n` +
					`<b>Telegram Group: </b>https://t.me/MetaRacersBsc_Global\n`
				,
				{
					parse_mode: "HTML"
				})
			}
	}
});

bot.on("callback_query", async(data)=>{
	// Press confirm to check all
	if(data?.data == 'CONFIRM'){
		const isJoinedTelegrams = await checkJoinedTelegrams(data.message.chat.id,TELEGRAM_LIST);
		if (isJoinedTelegrams) {
			// Save username & isJoinedTelegrams to database
			updateUser({
				telegramId: data.message.chat.id,
				username: data.message.chat.username,
				isJoinedTelegrams: true,
				// Will be checked again before result
				isFollowTwitter: true,
				isFollowTwitterParter: true,
				isLikeTweet: true,
				isRetweet: true
			})

			// Next step
			bot.sendMessage(data.message.chat.id, 'Please send your twitter username begins with the “@”')
			state = STATE.TWITTER
		} else {
			await bot.answerCallbackQuery(data.id, "You have unfinished tasks. Please complete tasks and press Confirm.", show_alert=true)	
			// bot.sendMessage(data.message.chat.id, 'You have unfinished tasks. Please complete tasks and press Confirm.')
		}
	} else {
		bot.sendMessage(data.message.chat.id, 'Please Click Confirm Button')
	}
});