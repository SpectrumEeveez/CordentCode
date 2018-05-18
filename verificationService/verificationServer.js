const path = require('path')
const V = require('vaxic')
const Grecaptcha = require('grecaptcha')
const config = require(path.join(__dirname, '..', 'lib', 'config.js'))
const saves = require(path.join(__dirname, '..', 'lib', 'userData.js'))
const verif = require(path.join(__dirname, '..', 'lib', 'userVerif.js'))

const reClient = new Grecaptcha(config.verificationService.recaptcha.secretKey)

const app = new V()

app.use(V.static(path.join(__dirname, 'static')))

app.add('GET', '/verify/recaptchaKey', (req, res) => {
	res.writeHead(200)
	res.end(config.verificationService.recaptcha.siteKey)
})

app.add('POST', '/verify/submitVerification', async (req, res) => {
	let rj
	try {
		rj = JSON.parse(req.body)
	}
	catch (err) {
		res.writeHead(400)
		res.end('Failed to parse request.')
		return
	}
	
	if (rj.hasOwnProperty('tok') && rj.hasOwnProperty('id') && rj.hasOwnProperty('vtok')) {
		if (await saves.userExists(rj.id)) {
			if (await reClient.verify(rj.tok)) {
				try {
					await verif.addVerif(rj.id, {
						'id': rj.vtok,
						'at': new Date(),
						'ip': req.connection.remoteAddress
					})
				}
				catch (err) {
					res.writeHead(400)
					res.end(JSON.stringify({
						'error': 'Bad verification token. Has it already been used?'
					}))
					return
				}

				res.writeHead(200)
				res.end(JSON.stringify({
					'error': false,
					'message': 'Verification has been completed!'
				}))
				return
			}
			else {
				res.writeHead(400)
				res.end(JSON.stringify({
					'error': 'Bad reCAPTCHA token.'
				}))
				return
			}
		}
		else {
			res.writeHead(400)
			res.end(JSON.stringify({
				'error': 'Unknown Discord user.'
			}))
			return
		}
	}
	else {
		res.writeHead(400)
		res.end('Bad contents.')
		return
	}
})

app.on('promiseHandleRejection', (err) => {
	console.error(err)
})

app.add((req, res) => {
	res.writeHead(404)

	res.end('404: Couldn\'t find the requested resource.')
})

app.listen(config.verificationService.port, config.verificationService.host, () => {
	console.log('Verification service is listening. ' + config.verificationService.host + ':' + config.verificationService.port)
})