const path = require('path')
const config = require(path.join(__dirname, 'config.js'))
const saves = require(path.join(__dirname, 'userData.js'))
const verif = require(path.join(__dirname, 'userVerif.js'))
const createRichEmbed = require(path.join(__dirname, 'createRichEmbed.js'))
const gban = require(path.join(__dirname, 'gban.js'))
const moment = require('moment')

let currentFrequency = {'38943': 2}

setInterval(() => {
	currentFrequency = {}
}, config.spamGuard.time) // Reset frequency counts

module.exports = async (message) => {
	// By this point, we know that the message has a member and a guild.

	let senderData = await saves.getUser(message.member.id)
	let senderVerifs = await verif.getVerifs(message.member.id)

	if (senderData.hasOwnProperty('banned') && senderData.banned === true) {
		if (message.member.kickable) {
			await message.member.kick('SCN network global ban.')
			await message.delete()
			await (await message.member.createDM()).send(createRichEmbed('Kick notice', 'Because you are globally banned from the SCN network, you have been kicked from the server ' + message.guild.name + '.', '#E74C3C'))
			return
		}
	}

	if (currentFrequency.hasOwnProperty(message.member.id)) {
		currentFrequency[message.member.id]++
	}
	else currentFrequency[message.member.id] = 0

	if (currentFrequency[message.member.id] > config.spamGuard.threshold) {
		if (message.guild.ownerID === message.member.id || message.member.hasPermission('ADMINISTRATOR')) return // Don't try to kick if admin or owner. (Owner also covered by unkickable.)
		if (!message.member.kickable) return // Don't attempt to kick unkickable members.

		currentFrequency[message.member.id] = 0

		await message.channel.send(createRichEmbed('Spam detected', 'Member ' + message.member + ' is likely spamming. They are being punished.', '#E74C3C'))

		const returnInvite = await message.channel.createInvite({
			'maxAge': 86400, // Expires after a day
			'maxUses': 1, // Only for this one member, once
			'unique': true // Make it unique, so that no one else steals the one use!
		}, 'Letting a kicked member back in. (' + message.member.name + ')')

		await (await message.member.createDM()).send(createRichEmbed('Kick notice', 'You have been kicked from the server ' + message.guild.name + ' for spamming. Repeating this action could result in a global ban.\n\nYou may rejoin with the following link: ' + returnInvite.url, '#E74C3C'))
		
		await message.member.kick('Spamming in channel #' + message.channel.name + '. (Sending many messages in a short period.)')

		if (senderData.hasOwnProperty('autoSpamKicks')) {
			senderData['autoSpamKicks']++
		}
		else senderData['autoSpamKicks'] = 1

		if (senderData['autoSpamKicks'] > 5) {
			senderData.banned = true
			senderData.banReason = 'Uncordial conduct: Spamming'
		}

		await saves.setUser(message.member.id, senderData)
		return
	}

	// By this point, it is known that this message isn't spam.

	if (message.content.indexOf('--') === 0) {
		const args = message.content.split('!')[1].split(' ')

		if (args[0] && args[0] === 'report') {
			if (senderVerifs.length === 0) {
				await message.channel.send(createRichEmbed('Verification required', 'You need to verify your Discord to do that. I\'ll DM you a verification link.', '#FF9800'))
				await verif.sendVerifLink(message.member)
				return
			}

			if (senderData.hasOwnProperty('lastReportAt')) {
				const lastReportAt = moment(senderData.lastReportAt)
				if (lastReportAt.isAfter(moment().subtract(8, 'hours'))) {
					const waitTime = lastReportAt.add(8, 'hours').fromNow()
					await message.channel.send(createRichEmbed('Woah there, speedy!', 'You\'ve made a report pretty recently, you\'ll be able to report again ' + waitTime + '.', '#FF9800'))
					return
				}
			}

			if (senderData.hasOwnProperty('noReport') && senderData.noReport === true) {
				await message.channel.send(createRichEmbed('Prohibited action.', 'You aren\'t allowed to file reports in the SCN network. This is likely due to abuse of the report command.', '#2C3E50'))
				return
			}

			if (args[1]) {
				if (config.reportReasons.includes(args[1].toLowerCase())) {
					const createdInvite = await message.channel.createInvite({
						'temporary': false,
						'maxAge': 0,
						'maxUses': 0,
						'unique': true
					}, 'User ' + message.author.username + ' (' + message.member.id + ') has requested Cordent staff support for reason: ' + args[1])
					await message.client.guilds.find('id', config.coreServer).channels.find('name', 'reports').send('Support request: \n\nJoin link: ' + createdInvite.url + '\n\nReason: **' + args[1].toUpperCase() + '**\n\nBy: ' + message.author.username + ' ( ' + message.author.id + ')')
					await message.channel.send(createRichEmbed('Thanks for the report!', 'The report has been created. Our staff should attend to it as soon as possible.\n\nHeads up: **Abusing the report feature may result in a permanent global ban from the Cordent network.**', '#2980B9'))
					senderData.lastReportAt = moment()

					await saves.setUser(message.member.id, senderData)
				}
				else {
					await message.channel.send(createRichEmbed('Incorrect usage', 'I don\'t know that punishment reason. See https://cordent.net/rules for information!', '#FF9800'))
				}
			}
			else {
				await message.channel.send(createRichEmbed('Incorrect usage', 'Usage: !report <reason>', '#FF9800'))
			}
		}

		if (args[0] && args[0] === 'gban') {
			if (senderData.staff) {
				if (message.mentions.members.array().length > 0) {
					const banReason = message.content.split('> ')[1]

					if (!banReason || banReason.length < 3) {
						await message.channel.send(createRichEmbed('Incorrect usage', 'You must provide a punishment reason!', '#FF9800'))
						return
					}

					if (!senderData.hasOwnProperty('bansCreated')) {
						senderData.bansCreated = 1
					}
					else senderData.bansCreated++

					senderData.lastBan = moment()

					const target = message.mentions.members.array()[0]

					const targetID = target.id

					let targetData = await saves.getUser(targetID)

					targetData.banned = true
					targetData.banReason = banReason

					console.log('Staff member ' + message.author.username + ' (' + message.member.id + ') has banned member ' + target.displayName + ' (' + target.id + ')')

					await saves.setUser(targetID, targetData)

					await message.channel.send(createRichEmbed('GG', '**GG**! Punishment has been registered to SCN network. A global ban is underway.', '#2C3E50'))

					const gbanRes = await gban(target.user)

					await message.channel.send(createRichEmbed('Global ban completed', 'Success: ' + gbanRes.success + '\nFailed: ' + gbanRes.failed, '#3498DB'))
				}
				else {
					await message.channel.send(createRichEmbed('Incorrect usage', 'You must mention a member to punish!', '#FF9800'))
				}
			}
		}

		if (args[0] && args[0] === 'unban') {
			if (senderData.staff) {
				if (message.mentions.members.array().length > 0) {
					const target = message.mentions.members.array()[0]

					const targetID = target.id

					console.log('Staff member ' + message.author.username + ' (' + message.member.id + ') has banned member ' + target.displayName + ' (' + target.id + ')')

					let targetData = await saves.getUser(targetID)

					targetData.banned = false

					await saves.setUser(targetID, targetData)

					await message.channel.send(createRichEmbed('Completed!', 'Punishment has been deregistered from Cordent network.', '#2C3E50'))
				}
				else {
					if (message.content.includes('unban ')) {
						const targetID = message.content.split('unban ')[1]
						if (await saves.userExists(targetID)) {
							let targetData = await saves.getUser(targetID)

							targetData.banned = false

							await saves.setUser(targetID, targetData)

							await message.channel.send(createRichEmbed('Completed!', 'Punishment has been deregistered by ID from Cordent network.', '#2C3E50'))
						}
						else {
							await message.channel.send(createRichEmbed('Unknown user ID', 'I haven\'t met that user before!', '#E74C3C'))
						}
					}
					else await message.channel.send(createRichEmbed('Incorrect usage', 'You must mention a member to unban.', '#FF9800'))
				}
			}
		}

		if (args[0] && args[0] === 'noreport') {
			if (senderData.staff) {
				if (message.mentions.members.array().length > 0) {
					const targetID = message.mentions.members.array()[0]
					let targetData = await saves.getUser(targetID)

					targetData.noReport = true

					await saves.setUser(targetID, targetData)

					await message.channel.send(createRichEmbed('GG', '**GG**! Punishment has been registered to Cordent network. This user will be prohibited from filing reports.', '#2C3E50'))
				}
				else await message.channel.send(createRichEmbed('Incorrect usage', 'You must mention a member to target.', '#FF9800'))
			}
		}

		if (args[0] && args[0] === 'allowreport') {
			if (senderData.staff) {
				if (message.mentions.members.array().length > 0) {
					const targetID = message.mentions.members.array()[0]
					let targetData = await saves.getUser(targetID)

					targetData.noReport = false

					await saves.setUser(targetID, targetData)

					await message.channel.send(createRichEmbed('Completed!', 'Punishment has been deregistered from Cordent network.', '#2C3E50'))
				}
				else await message.channel.send(createRichEmbed('Incorrect usage', 'You must mention a member to target.', '#FF9800'))
			}
		}

		if (args[0] && args[0] === 'w2c') {
			if (senderData.staff) {
				await message.delete()
				await message.channel.send(createRichEmbed('SCN', message.content.slice(args[0].length + 1), '#2C3E50'))
			}
		}

		if (args[0] && args[0] === 'staffcard') {
			if (senderData.staff) {
				await message.channel.send(createRichEmbed('Staff Card', 'The user ' + message.member + ' is a verified SCN staff member.', '#8BC34A'))
			}
		}
	}
}