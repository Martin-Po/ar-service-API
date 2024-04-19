const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')
const middleware = require('../utils/middleware')


loginRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    if (!username) {
        return response.status(409).json({ error: 'Username not provided' })
    }

    if (!password) {
        return response.status(409).json({ error: 'Password not provided' })
    }

    const user = await User.findOne({ username })
    const passwordCorrect =
        user === null
            ? false
            : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
        return response.status(401).json({
            error: 'invalid username or password',
        })
    }

    const userForToken = {
        username: user.username,
        id: user._id,
        role: user.role,
    }

    const token = jwt.sign(userForToken, process.env.SECRET, {
        expiresIn: 60 * 60,
    })

    response.status(200).send({
        token,
        username: user.username,
        name: user.name,
        role: user.role,
    })
})

loginRouter.post(
    '/checkuser',
    middleware.userExtractor,
    async (request, response, next) => {
        response.status(200).end()
    }
)

module.exports = loginRouter
