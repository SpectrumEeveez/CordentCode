const path = require('path')
const moment = require('moment')
const config = require(path.join(__dirname, 'config.js'))
const saves = require(path.join(__dirname, 'userData.js'))
const createRichEmbed = require(path.join(__dirname, 'createRichEmbed.js'))

const idChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const createVerif = async (id) => {
	const userData = await saves.getUser(id)

	let verifID = new Date().getTime() + ''

	for (let i = 0; i < 10; i++) verifID += idChars[Math.floor(Math.random() * idChars.length)]

	userData.currentVerification = verifID

	userData.currentVerifStatus = false

	await saves.setUser(id, userData)

	return verifID
}

module.exports = {
	createVerif,
	'addVerif': async (id, props) => {
		const userData = await saves.getUser(id)

		if (!userData.hasOwnProperty('currentVerification') || userData.currentVerification !== props.id) {
			throw new Error('Invalid verification ID.')
		}

		if (!userData.hasOwnProperty('currentVerifStatus') || userData.currentVerifStatus !== false) {
			throw new Error('Unexpected current verification status of user.')
		}

		userData.lastVerificationAt = props.hasOwnProperty('at') ? props.at : new Date().toString()

		userData.currentVerifStatus = true

		if (userData.hasOwnProperty('verifications')) {
			userData.verifications.push(props)
		}
		else {
			userData.verifications = [props]
		}

		await saves.setUser(id, userData)

		return true
	},
	'getVerifs': async (id) => {
		const userData = await saves.getUser(id)

		if (userData.hasOwnProperty('verifications')) {
			return userData.verifications
		}
		else return []
	},
	'sendVerifLink': async (member) => {
		const createdVerif = await createVerif(member.id)
		await (await member.createDM()).send(createRichEmbed('Verification', 'You can verify yourself with the following link: https://cordent.net/verify/?' + createdVerif + '&q&' + member.id, '#FF9800'))
	}
}