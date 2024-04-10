
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const comboSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    descripcion:  {
        type: String,
        default: null
    },
    productos:   [{   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
    }],
    precio: {  
        type: Number,
        default: 0,
        min: 0,
    },
    moneda:   {   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Moneda',
    },
    descuento: {
        type: Number,
        default: 0,
        min: 0,
        max: 99,
    },

})

comboSchema.plugin(uniqueValidator)

comboSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    }
})

const Combo = mongoose.model('Combo', comboSchema)

module.exports = Combo