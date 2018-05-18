const path = require('path')
const config = require(path.join(__dirname, 'config.js'))
const saves = require(path.join(__dirname, 'userData.js'))
const verif = require(path.join(__dirname, 'userVerif.js'))
const moment = require('moment')
const createRichEmbed = require(path.join(__dirname, 'createRichEmbed.js'))

module.exports = async (member) => {
	const memberData = await saves.getUser(member.id)
	const memberVerifs = await verif.getVerifs(member.id)

	if (memberData.banned) {
		if (member.bannable) {
			await (await member.createDM()).send(createRichEmbed('Global Ban', 'You can\'t join the server ' + member.guild.name + ' because you\'re **globally banned** by Cordent.\n\nReason: *' + (memberData.banReason ? memberData.banReason : 'None') + '*', '#E74C3C'))
			await member.ban('This member is globally banned by Cordent.')
			return
		}
	}

	let mandateVerif = memberVerifs.length === 0 || ((memberData.hasOwnProperty('currentVerifStatus') && memberData.currentVerifStatus === false) && (memberData.hasOwnProperty('lastVerificationAt') && moment(memberData.lastVerificationAt).isBefore(moment().subtract(1, 'days'))))

	if (mandateVerif) {
		await (await member.createDM()).send(createRichEmbed('Verification required', 'You need to pass the verification checkpoint to join the server ' + member.guild.name + '.', '#FF9800'))
		await verif.sendVerifLink(member)
		await member.kick('This member needs to verify before joining.')
		return
	}

	memberData.currentVerifStatus = false

	await (await member.createDM()).send(createRichEmbed(config.messages.welcome[Math.floor(Math.random() * config.messages.welcome.length)], 'You successfully joined ' + member.guild.name + '! Be sure to always follow Cordent global rules! https://cordent.net/rules', '#8BC34A'))

	await saves.setUser(member.id, memberData)
}