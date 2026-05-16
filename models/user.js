const { DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')

const sequelize = require('../lib/sequelize')

const User = sequelize.define('user', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('password', bcrypt.hashSync(value, 8))
    }
  },
  admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
})

exports.User = User
exports.UserClientFields = [
  'name',
  'email',
  'password',
  'admin'
]
