
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const caracteristicaxproductoSchema = mongoose.Schema({
    caracteristica:   {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caracteristica',
        required: true
    },
    producto:   {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    valor:  {
        type: String,
        default: null
    },

})

caracteristicaxproductoSchema.plugin(uniqueValidator)

caracteristicaxproductoSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    }
})

const Caracteristicaxproducto = mongoose.model('Caracteristicaxproducto', caracteristicaxproductoSchema)

module.exports = Caracteristicaxproducto