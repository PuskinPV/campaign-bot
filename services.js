const countPoint = (user) => {
	let point = 0
	if (user?.isJoinedTelegrams) point += 4
	if (user?.isRegard) point += 1
	if (user?.isFollowTwitter) point += 1
	if (user?.isFollowTwitterParter) point += 1
	if (user?.isLikeTweet && user?.isRetweet) point += 1
	return point
}

module.exports = {
	countPoint
}