const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const productoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    descripcion:  {
        type: String,
        default: null
    },
    combo: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combo',
            defautl: null,
        },
    ],
    tipos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tipo',
            defautl: null,
        },
    ],
    subtipos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subtipo',
            defautl: null,
        },
    ],
    origen: {
        type: String,
        default: null,
    },
    caracteristicas: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Caracteristicasxproducto',
            defautl: null,
        },
    ],
    precio: {
        type: Number,
        default: 0,
        min: 0,
    },
    moneda: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Moneda',
    },
    descuento: {
        type: Number,
        default: 0,
        min: 0,
        max: 99,
    },
    marca: {
        type: String,
        required: true,
    },
    modelo: {
        type: String,
        required: true,
    },
    estado_activo: {
        estado: { type: String, required: true, default: 'Disponible' },
        fecha: {
            type: Date,
            default: Date.now,
        },
    },
    log_estados: [{
        estado: String,
        fecha: Date        
    }
],
    portada: {
        type: String,
        required: true,
    },
    imagenes: [
        {
            type: String,
            required: true,
        },
    ],
    observaciones: {
        observacion: {
            type: String,
        },  
        fecha: {
            type: Date,
        },
    },
})

productoSchema.plugin(uniqueValidator)

productoSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        // the passwordHash should not be revealed
        delete returnedObject.passwordHash
    },
})

const Producto = mongoose.model('Producto', productoSchema)

module.exports = Producto
