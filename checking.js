// Import Environment Variable
require('dotenv').config()
const {
	TWITTER_BEAR_TOKEN
} = process.env

// Import and Config axios
const axios = require('axios')
axios.defaults.headers.common = {
	'Authorization': `bearer ${TWITTER_BEAR_TOKEN}`
}

const checkJoinedTelegrams = async(bot, telegramId, checkTeleList) => {
	try {
		var checkResultsPromises = checkTeleList.map(checkTeleId => {
			// console.log(checkTeleId)
			return bot.getChatMember(checkTeleId, telegramId)
		})

		const members = await Promise.all(checkResultsPromises)
		
		const checkResults = members.reduce((res, member) => {
			return res && ["creator", "administrator", "member"].includes(member.status)
		}, true)
		return checkResults
	} catch (err) {
		console.error(err)
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
		console.error(err.response.data)
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

// Check valid captcha
const checkCaptcha = (pendingCaptchas, telegramId, enteredCaptcha) => {
	return enteredCaptcha == pendingCaptchas[telegramId]
}

module.exports = {
	checkJoinedTelegrams,
	checkValidTwitter,
	checkWalletAddress,
	checkCaptcha
}