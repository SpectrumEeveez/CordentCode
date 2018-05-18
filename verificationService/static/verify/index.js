if (decodeURIComponent(window.location.search).length === 0) {
	alert('Error. Invalid verification!')
	window.location.assign('https://cordent.net')
}

async function recaptchaLoaded() {
	try {
		const res = await fetch(window.location.origin + '/verify/recaptchaKey')

		const body = await res.text()

		grecaptcha.render(document.querySelector('#recaptchaRender'), {
			'sitekey': body,
			'callback': 'submitCaptcha'
		})
	}
	catch (err) {
		alert('Uh oh, failed to load captcha data.')
		return
	}
}

async function submitCaptcha(res) {
	const qs = decodeURIComponent(window.location.search).split('?')[1]

	try {
		document.querySelector('#message').textContent = 'Processing data...'

		const verifRes = await fetch(window.location.origin + '/verify/submitVerification', {
			'method': 'POST',
			'body': JSON.stringify({
				'id': qs.split('&q&')[1],
				'vtok': qs.split('&q&')[0],
				'tok': res
			})
		})

		let jsonRes = await verifRes.json()

		if (jsonRes.error === false) {
			document.querySelector('#message').textContent = 'Success! You should be good to go. Feel free to return to the Discord app.'
		}
		else {
			document.querySelector('#message').textContent = 'Error: ' + jsonRes.error
		}
	}
	catch (err) {
		console.log(err)
		document.querySelector('#message').textContent = 'Error, request failed. Apologies. (Try again later!)'
		return
	}
}