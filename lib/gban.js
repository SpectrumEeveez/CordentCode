module.exports = async (user) => {
	let success = 0
	let failed = 0

	for (guild of user.client.guilds.array()) {
		const guildMembers = guild.members.array()
		for (let i = 0; i < guildMembers.length; i++) {
			if (guildMembers[i].id === user.id) {
				if (guildMembers[i].kickable) {
					await guildMembers[i].kick('This member has been banned globally by Wolfie.')
					success++
				}
				else failed++
			}
		}
	}

	return {
		success,
		failed
	}
}