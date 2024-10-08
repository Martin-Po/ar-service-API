const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User.find({})
    response.json(users)
})

usersRouter.post('/', async (request, response, next) => {
    const { username, name, password, role } = request.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        passwordHash,
        role
    })

    try{
        const savedUser = await user.save()
        response.status(201).json(savedUser)
    }
    catch(exception) {
        next(exception)
    }  

})

module.exports = usersRouter