const fs = require('fs')
const path = require('path')

class DB {
  constructor (filename = 'db.json', persistInterval = null, initDb = {}) {
    this.path = path.resolve('./data', filename)
    this.initDb = initDb

    if (!fs.existsSync(this.path)) {
      this.create()
    } else {
      this.load()
    }

    this.interval = null
    if (typeof persistInterval === 'number') {
      this.persistInterval = persistInterval
      this.startPersist()
    } else {
      this.persistInterval = null
    }
  }

  startPersist () {
    if (this.persistInterval !== null && this.interval === null) {
      this.interval = setInterval(this.persist.bind(this), this.persistInterval)
    }
  }

  stopPersist () {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  get serializedData () {
    return this.serialize(this.data)
  }

  serialize (db) {
    return JSON.stringify(db)
  }

  deserialize (raw) {
    return JSON.parse(raw)
  }

  create (init = {}) {
    this.data = this.initDb
    this.persist()
  }

  load () {
    const data = fs.readFileSync(this.path, 'utf8')
    this.data = this.deserialize(data)
  }

  persist () {
    fs.writeFileSync(this.path, this.serializedData)
  }
}

module.exports = DB
