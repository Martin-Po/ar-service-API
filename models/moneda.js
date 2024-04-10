
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const monedaSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    descripcion:  {
        type: String,
        default: null
    },

})

monedaSchema.plugin(uniqueValidator)

monedaSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    }
})

const Moneda = mongoose.model('Moneda', monedaSchema)

module.exports = Moneda