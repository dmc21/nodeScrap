const TelegramBot = require('node-telegram-bot-api');
const token = '<token>';
const bot = new TelegramBot(token, {polling: true});
  
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text == "/chatId")
        bot.sendMessage(chatId, `Hola ${msg.chat.first_name}! Tu chatId es: ${msg.chat.id}`);

  });

module.exports = bot;