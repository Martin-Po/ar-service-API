const app = require('./app')
const http = require('http')
const config = require('./utils/config')
const logger = require('./utils/logger')

const server = http.createServer(app)

console.log('aca');
console.log(`aca2 puerto ${config.PORT}`)

app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)

})