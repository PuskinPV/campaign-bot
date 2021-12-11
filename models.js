const mongoose = require('mongoose')

// Connect to DB
mongoose.connect('mongodb://localhost:27017/mrs_campaign_bot',
	err => {
		if (!err) {
			console.log('Connection succeeded')
		} else {
			console.log('Error in connection', err)
		}
	}
)

var userSchema = new mongoose.Schema({
	telegramId: { type: String, required: true, unique: true },
	username: { type: String },
	twitterId: { type: String },
	twitterUsername: { type: String },
	addressWallet: { type: String },
	referBy: { type: String, default: null },	

	isRegard: { type: Boolean, default: false },
	isJoinedTelegrams: { type: Boolean, default: false },
	isFollowTwitter: { type: Boolean, default: false },
	isFollowTwitterParter: { type: Boolean, default: false },
	isLikeTweet: { type: Boolean, default: false },
	isRetweet: { type: Boolean, default: false }
})

mongoose.model("User", userSchema)

module.exports.User = mongoose.model('User')