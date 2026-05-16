const { Router } = require('express')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const bcrypt = require('bcryptjs')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { User, UserClientFields } = require('../models/user')
const {
  generateAuthToken,
  requireAuthentication,
  userIsAuthorized,
  userIsAdmin
} = require('../lib/auth')

const router = Router()

function sanitizeUser(user) {
  const userObj = user.toJSON()
  delete userObj.password
  return userObj
}

function requireSelfOrAdmin(req, res, next) {
  requireAuthentication(req, res, function () {
    if (userIsAuthorized(req, req.params.userId)) {
      next()
    } else {
      res.status(403).send({ error: 'Forbidden' })
    }
  })
}

/*
 * Route to create a new user.
 */
router.post('/', async function (req, res, next) {
  if (req.body.admin === true) {
    return requireAuthentication(req, res, async function () {
      if (!userIsAdmin(req)) {
        return res.status(403).send({ error: 'Admin permissions required' })
      }
      await createUser(req, res, next)
    })
  }
  await createUser(req, res, next)
})

async function createUser(req, res, next) {
  try {
    const user = await User.create(req.body, { fields: UserClientFields })
    res.status(201).send({ id: user.id })
  } catch (e) {
    if (e instanceof ValidationError || e instanceof UniqueConstraintError) {
      res.status(400).send({ error: e.message })
    } else {
      next(e)
    }
  }
}

/*
 * Route to log in a user and return a JWT.
 */
router.post('/login', async function (req, res) {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' })
  }

  const user = await User.findOne({ where: { email: email } })
  const authenticated = user && bcrypt.compareSync(password, user.password)

  if (!authenticated) {
    return res.status(401).send({ error: 'Invalid login credentials' })
  }

  res.status(200).send({ token: generateAuthToken(user) })
})

/*
 * Route to fetch info about a specific user.
 */
router.get('/:userId', requireSelfOrAdmin, async function (req, res, next) {
  const user = await User.findByPk(req.params.userId)
  if (user) {
    res.status(200).send(sanitizeUser(user))
  } else {
    next()
  }
})

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', requireSelfOrAdmin, async function (req, res) {
  const userId = req.params.userId
  const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
  res.status(200).json({
    businesses: userBusinesses
  })
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', requireSelfOrAdmin, async function (req, res) {
  const userId = req.params.userId
  const userReviews = await Review.findAll({ where: { userId: userId }})
  res.status(200).json({
    reviews: userReviews
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', requireSelfOrAdmin, async function (req, res) {
  const userId = req.params.userId
  const userPhotos = await Photo.findAll({ where: { userId: userId }})
  res.status(200).json({
    photos: userPhotos
  })
})

module.exports = router
