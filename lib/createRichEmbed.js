const Discord = require('discord.js')

module.exports = (title, description, color, image) => {
	let genEmbed = new Discord.RichEmbed({
		title,
		description
	})

	genEmbed.setColor(color)

	if (image) genEmbed.setImage(image)

	return genEmbed
}