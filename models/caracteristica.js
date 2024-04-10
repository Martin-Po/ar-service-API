
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const caracteristicaSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    descripcion:  {
        type: String,
        default: null
    },

})

caracteristicaSchema.plugin(uniqueValidator)

caracteristicaSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    }
})

const Caracteristica = mongoose.model('Caracteristica', caracteristicaSchema)

module.exports = Caracteristica