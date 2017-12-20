const DB = require('./db')

class ChatDB extends DB {
  constructor (filename = 'db.json', persistInterval = null) {
    super(filename, persistInterval, {
      chats: [],
      stats: {
        processed: 0
      }
    })
  }

  findChat (chatId) {
    return this.data.chats.find(({id}) => chatId === id)
  }

  findUserInChat (chatId, userId) {
    const chat = this.findChat(chatId)
    if (!chat || !chat.userList) return

    return chat.userList.find(({id}) => userId === id)
  }

  findUserInChatByName (chatId, name) {
    const chat = this.findChat(chatId)
    if (!chat || !chat.userList) return

    return chat.userList.find(({first_name, last_name}) => {
      return `${first_name} ${last_name}`.toLocaleLowerCase().indexOf(name.toLocaleLowerCase()) !== -1
    })
  }

  findUserInChatByUsername (chatId, usernameToFind) {
    const chat = this.findChat(chatId)
    if (!chat || !chat.userList) return

    return chat.userList.find(({username}) => username === usernameToFind)
  }

  addChat (chatId, userList = []) {
    const chat = this.findChat(chatId)
    if (!chat) {
      this.data.chats.push({id: chatId, userList})
    }
  }

  addUserToChat (chatId, user) {
    const chat = this.findChat(chatId)
    if (chat && !this.findUserInChat(chat, user.id)) {
      user.karma = 0
      chat.userList.push(user)
    }

    return user
  }

  findOrAddUser (chatId, user) {
    return this.findUserInChat(chatId, user.id) || this.addUserToChat(chatId, user)
  }

  findOrAddChat (chatId, enable = true) {
    const chat = this.findChat(chatId) || this.addChat(chatId)
    if (enable) chat.enabled = true

    return chat
  }

  changeUserKarma (chatId, user, value = 0) {
    const userInDb = this.findOrAddUser(chatId, user)
    userInDb.karma = (userInDb.karma || 0) + value

    return userInDb.karma
  }

  incrementUserKarma (chatId, user) {
    return this.changeUserKarma(chatId, user, 1)
  }

  decrementUserKarma (chatId, user) {
    return this.changeUserKarma(chatId, user, -1)
  }
}

module.exports = ChatDB
