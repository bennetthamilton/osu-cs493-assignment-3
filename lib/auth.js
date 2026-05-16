const jwt = require('jsonwebtoken')

const jwtSecret = process.env.JWT_SECRET || 'SuperSecretJWTSigningKey'

function generateAuthToken(user) {
  return jwt.sign(
    { sub: user.id, id: user.id, admin: user.admin },
    jwtSecret,
    { expiresIn: '24h' }
  )
}

function requireAuthentication(req, res, next) {
  const authHeader = req.get('Authorization') || ''
  const authHeaderParts = authHeader.split(' ')
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null

  if (!token) {
    return res.status(401).send({ error: 'Authentication required' })
  }

  try {
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch (err) {
    return res.status(401).send({ error: 'Invalid authentication token' })
  }
}

function userIsAdmin(req) {
  return req.user && req.user.admin
}

function userIsAuthorized(req, userId) {
  return userIsAdmin(req) || (req.user && Number(req.user.id) === Number(userId))
}

function requireAdmin(req, res, next) {
  requireAuthentication(req, res, function () {
    if (userIsAdmin(req)) {
      next()
    } else {
      res.status(403).send({ error: 'Admin permissions required' })
    }
  })
}

exports.generateAuthToken = generateAuthToken
exports.requireAuthentication = requireAuthentication
exports.requireAdmin = requireAdmin
exports.userIsAdmin = userIsAdmin
exports.userIsAuthorized = userIsAuthorized
