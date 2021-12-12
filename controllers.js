const { model } = require('mongoose')
const { User } = require('./models')

const updateUser = userFields => {
	// Insert new user to DB or update user if telegramId already exists
	// inputUser is an new user object or object containing the fields needed to update

	User.findOneAndUpdate(
		{ telegramId: userFields.telegramId },
		{ $set: userFields },
		{ upsert: true },
		(err, doc) => {
			if (err) {
				console.error('Error in inserting', userFields, err)
			}
		}
	)
}

const findUser = filters => {
	// Find an user by filters
	return User.findOne(filters)
}

const countRefer = async(telegramId) => {
	const referralUsers = await User.find({ referBy: telegramId })
	let joinedUsers = referralUsers.filter(user => {
		return user.isJoinedTelegrams
						&& user.isFollowTwitter
						&& user.isFollowTwitterParter
						&& user.isLikeTweet
						&& user.isRetweet
						// && user.isRegard
	})
	return joinedUsers?.length
}

module.exports.updateUser = updateUser
module.exports.findUser = findUser
module.exports.countRefer = countRefer