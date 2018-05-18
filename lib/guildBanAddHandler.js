const path = require('path')
const config = require(path.join(__dirname, 'config.js'))
const saves = require(path.join(__dirname, 'userData.js'))
const createRichEmbed = require(path.join(__dirname, 'createRichEmbed.js'))

module.exports = async (guild, member) => {
	const memberData = await saves.getUser(member.id)

	if (memberData.hasOwnProperty('manualBanCount')) {
		memberData.manualBanCount++
	}
	else memberData.manualBanCount = 1

	await saves.setUser(member.id, memberData)
}