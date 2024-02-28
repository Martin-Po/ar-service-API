const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')

const logger = require('./utils/logger')
const middleware = require('./utils/middleware')

const path = require('path')



console.log(process.env.NODE_ENV)
console.log('chau')

app.use(cors())
app.use(express.static('build')) 
app.use(express.json())
app.use(middleware.requestLogger)


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'))})
        
if (process.env.NODE_ENV === 'test') {
    const testingRouter = require('./controllers/testing')
    app.use('/api/testing', testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

    
module.exports = app