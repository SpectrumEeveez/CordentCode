const path = require('path')
const poky = require('poky')
const Discord = require('discord.js')
const verificationServer = require(path.join(__dirname, '..', 'verificationService', 'verificationServer.js'))
const config = require(path.join(__dirname, 'config.js'))
const saves = require(path.join(__dirname, 'userData.js'))
const messageHandler = require(path.join(__dirname, 'messageHandler.js'))
const guildMemberAddHandler = require(path.join(__dirname, 'guildMemberAddHandler.js'))
const createRichEmbed = require(path.join(__dirname, 'createRichEmbed.js'))

const client = new Discord.Client() // Woo! Client's here.

const logToCoreServer = async (message, eventName) => {
	try {
		await client.guilds.find('id', config.coreServer).channels.find('name', 'logs').send(createRichEmbed(eventName, message, '#2C3E50'))
	}
	catch (err) {
		console.error('Failed to log: ' + err)
	}
}

const findOptimalSendChannel = (server) => {
	const optimalChannelNames = ['bots', 'bot', 'general', 'main', 'admin', 'admins']
	const serverChannels = server.channels.array()

	let optimalChannel = serverChannels.find((channel) => optimalChannelNames.includes(channel.name.toLowerCase()))

	if (optimalChannel) return optimalChannel

	if (serverChannels.length > 0) {
		return serverChannels[0]
	}
	else {
		return false
	}
}

const updateStatus = async () => {
	await client.user.setPresence({
		'status': 'idle',
		'game': {
			'name': 'Currently Managing'
		}
	})

	/*
	await client.user.setPresence({
		'status': 'online',
		'game': {
			'name': 'Protecting ' + client.guilds.array().length + ' servers'
		}
	})*/
}

client.on('ready', async () => {
	console.log('Discord client is ready!')

	await logToCoreServer('The Wolf Has has been awoken. *I have awoken.* Active on ' + client.guilds.array().length + ' servers.', 'Startup')

	updateStatus()

	setInterval(updateStatus, 30000)
})

client.on('guildCreate', async (guild) => {
	console.log('Added to guild: ' + guild.name + ' (' + guild.id + ')')

	const optimalSendChannel = findOptimalSendChannel(guild)

	await poky(2000)

	if (guild.me.hasPermission('ADMINISTRATOR')) {
		await logToCoreServer('Added to server *' + guild.name + '*! (' + guild.id + ')', 'Server join')

		if (guild.verificationLevel < 1) await guild.setVerificationLevel(1)

		if (guild.explicitContentFilter < 2) await guild.setExplicitContentFilter(2)

		if (optimalSendChannel) await optimalSendChannel.send(createRichEmbed('Hi!', 'Wolfie here. I\'ll be sure to keep your server safe.\n\nBe sure to move my role to the top of the roles list!', '#3498DB', 'https://media.giphy.com/media/fteMNRlup4JdMIb51f/giphy.gif'))
	}
	else {
		await logToCoreServer('Joined guild *' + guild.name + '*! (' + guild.id + ') (Wasn\'t granted administrator permission.) Leaving now.', 'No admin permission on server join')

		if (optimalSendChannel) await optimalSendChannel.send(createRichEmbed('Uh oh.', 'Unfortunately it seems like you\'ve configured WolfBot incorrectly! I require the **administrator** permission to be enabled to function. Exiting server.', '#E74C3C'))

		await guild.leave()
	}
})

client.on('guildDelete', async (guild) => {
	console.log('Removed / left from guild: ' + guild.name + ' (' + guild.id + ')')

	await logToCoreServer('Exited or was removed from server ' + guild.name + '. (' + guild.id + ')', 'Server exit')
})

client.on('message', async (message) => {
	if (message.author.bot) return
	if (message.author.id === client.user.id) return

	// By this point, we know that the message author is not a bot & is not Cordent

	if (!message.member || !message.guild) {
		await message.channel.send(createRichEmbed('Can\'t chat!', 'Sorry, bb! Cordent commands don\'t function via DM.', '#E74C3C'))
		return
	}

	// By this point, we know that the message has a member and a guild.

	await messageHandler(message)
})

client.on('guildMemberAdd', (member) => {
	if (member.user.bot) return
	if (member.id === client.user.id) return

	guildMemberAddHandler(member)
})

client.login(config.auth.token === 'discord-bot-token' ? process.env.DCTOKEN : config.auth.token) // Login with configured token

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled rejection: ' + reason)
	console.log(p)
})