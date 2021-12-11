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
				console.log('Error in inserting', userFields, err)
			}
		}
	)
}

const findUser = filters => {
	// Find an user by filters
	return User.findOne(filters)
}