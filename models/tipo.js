
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const tipoSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    subtipos:   [{   
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subtipo',
    }],

})

tipoSchema.plugin(uniqueValidator)

tipoSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    }
})

const Tipo = mongoose.model('Tipo', tipoSchema)

module.exports = Tipo