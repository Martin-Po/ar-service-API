const logger = require('./logger')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const requestLogger = (request, response, next) => {
    logger.info('Method:', request.method)
    logger.info('Path:  ', request.path)
    logger.info('Body:  ', request.body)
    logger.info('---')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(400).json({ error: 'token missing or invalid' })
    } else if (error.name === 'TokenExpiredError') {
        return response.status(401).json({error: 'token expired'})
    }
    next(error)
}

const tokenExtractor = async (request, response, next) => {
    const authorization = await request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        const token = authorization.substring(7)
        request.token = token
    }
    next()
}

const userExtractor = async (request, response, next) => {
  

    console.log(request.token)
    console.log('prueba user')
    console.log(request.originalUrl)
    try{
        const decodedToken = jwt.verify(request.token, process.env.SECRET)
        if(decodedToken){
            request.user = await User.findById(decodedToken.id.toString())
        
        } else {
            request.user = null
        }
    }
    catch (exception){    
    console.log(exception.name )

        if (exception.name === 'TokenExpiredError') {
            return response.status(401).json({error: 'token expired'})
        }
        return response.status(401).json({ error: 'token missing or invalid' }) 
    }    

    next()
}


module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler,
    tokenExtractor,
    userExtractor
}
