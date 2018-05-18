const path = require('path')
const ofs = require('fs')
const util = require('util')
const fs = {
	'readFile': util.promisify(ofs.readFile),
	'writeFile': util.promisify(ofs.writeFile),
	'stat': util.promisify(ofs.stat)
}

const savesPath = path.join(__dirname, '..', 'saves')

module.exports = {
	'getUser': async (id) => {
		const userSaveLocation = path.join(savesPath, id.toString())

		try {
			return JSON.parse(await fs.readFile(userSaveLocation))
		}
		catch (err) {
			const baseUser = {
				'created': new Date()
			}

			await fs.writeFile(userSaveLocation, JSON.stringify(baseUser))
			return baseUser
		}
	},
	'setUser': async (id, data) => {
		const userSaveLocation = path.join(savesPath, id.toString())

		try {
			await fs.writeFile(userSaveLocation, JSON.stringify(data))
		}
		catch (err) {
			throw err
		}
	},
	'userExists': async (id) => {
		const userSaveLocation = path.join(savesPath, id.toString())
		
		try {
			await fs.readFile(userSaveLocation)
		}
		catch (err) {
			return false
		}

		return true
	}
}