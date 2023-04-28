import Discord from 'discord.js';
import moment from 'moment';

export async function createWebhookMessage(title: string, message: any[], imgLink: string, color: Discord.ColorResolvable, webhookUrl: string) {
    const embed = new Discord.MessageEmbed()
            .setTitle(`Hades - ${title}`)
            .setColor(color)
            .setFooter(`Hades | ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);

    for (var i = 0; i < message.length; i++) {
        embed.addField(message[i].key, message[i].value);
    }

    if (imgLink !== '') {
        embed.setThumbnail(imgLink)
    }

    const webhookClient = new Discord.WebhookClient({ url: webhookUrl });
    try {
        await webhookClient.send({ content: null, embeds: [embed] });

        return true;
    } catch (e) {
        console.log(`Discord.tsx -- createWebhookMessage: ${e}`);
        return false;
    }
}