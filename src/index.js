require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const ChatDB = require('./chat-db')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true})
const karmaDb = new ChatDB(process.env.DATABASE_FILE, 5000)

bot.onText(/\/start/, (msg) => {
  const chat = karmaDb.findChat(msg.chat.id)
  if (chat && chat.enabled) return

  let message = ''

  switch (msg.chat.type) {
    case 'supergroup':
    case 'group':
      message = 'Хорошо, теперь в этом чате у людей есть карма!'
      karmaDb.findOrAddChat(msg.chat.id, true)
      break
    default:
      message = 'Отслеживать карму можно только в группах!'
      break
  }

  bot.sendMessage(msg.chat.id, message)
})

bot.onText(/\/stop/, (msg) => {
  const chat = karmaDb.findChat(msg.chat.id)
  if (chat) {
    chat.enabled = false
    bot.sendMessage(msg.chat.id, 'Карма больше не отслеживается')
  }
})

bot.onText(/\/status/, (msg) => {
  const chat = karmaDb.findChat(msg.chat.id)
  if (chat && chat.userList) {
    const rating = chat.userList
      .sort((a, b) => b.karma - a.karma)
      .map(user => {
        return `*${user.karma}* ${user.first_name} ${user.last_name}`
      })
      .join(`\n`)

    bot.sendMessage(msg.chat.id, rating, {parse_mode: 'Markdown'})
  }
})

bot.onText(/\/me/, (msg) => {
  const user = karmaDb.findOrAddUser(msg.chat.id, msg.from)

  bot.sendMessage(msg.chat.id, `${user.first_name} ${user.last_name}, ваша карма ${user.karma}`)
})

bot.onText(/\/(?:k|t) (.+)/, (msg, match) => {
  const textMention = msg.entities.find(entity => entity.type === 'text_mention')
  const mention = msg.entities.find(entity => entity.type === 'mention')

  let user = null

  if (textMention) {
    user = mention.user
  } else if (mention) {
    // strip @
    const username = match[1].slice(1)
    user = karmaDb.findUserInChatByUsername(msg.chat.id, username)
  } else {
    user = karmaDb.findUserInChatByName(msg.chat.id, match[1])
  }

  if (user) {
    const karma = karmaDb.incrementUserKarma(msg.chat.id, user)
    bot.sendMessage(
      msg.chat.id,
      `Карма пользователя ${user.first_name} ${user.last_name} увеличена до ${karma}`
    )
  }
})
