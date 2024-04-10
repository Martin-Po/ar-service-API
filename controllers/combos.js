const bcrypt = require('bcrypt')
const combosRouter = require('express').Router()
const Caracteristica = require('../models/caracteristica')
const middleware = require('../utils/middleware')
const Caracteristicaxproducto = require('../models/caracteristicaXproducto')
const Combo = require('../models/combo')
const Producto = require('../models/producto')
const Moneda = require('../models/moneda')


combosRouter.get('/', async (request, response) => {
    const combos = await Combo.find({})
    response.json(combos)
})

combosRouter.post(
    '/',
    middleware.userExtractor,
    async (request, response, next) => {
        const body = request.body

        if (!body.name) {
            return response.status(400).json({
                error: 'name missing',
            })
        }
        if (!body.descripcion) {
            return response.status(400).json({
                error: 'descripcion missing',
            })
        }
        if (!body.productos) {
            return response.status(400).json({
                error: 'productos missing',
            })
        }

        if (!body.precio) {
            return response.status(400).json({
                error: 'precio missing',
            })
        }

        if (!body.moneda) {
            return response.status(400).json({
                error: 'moneda missing',
            })
        }

        if (body.precio <= 0) {
            return response.status(400).json({
                error: 'Valor no puede ser 0 o menor',
            })
        }

        if (body.productos.length <= 1) {
            return response.status(400).json({
                error: 'Combo debe tener más de un producto',
            })
        }

        for (const elemento of body.productos) {
            const producto = await Producto.findById(elemento)
            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto ' + elemento + ' not found' })
            }
        }

        const combo = new Combo({
            name: body.name,
            descripcion: body.descripcion,
            productos: body.productos,
            precio: body.precio,
            moneda: body.moneda,
        })

        try {
            const savedCombo = await combo.save()
            response.status(201).json(savedCombo)
        } catch (exception) {
            next(exception)
        }
    }
)

combosRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const combo = await Combo.findById(request.params.id)

        if (!combo) {
            return response.status(404).json({ error: 'Combo not found' })
        }

        if (!body.name && !body.descripcion) {
            return response
                .status(409)
                .json({ error: 'Either descripcion or name must be provided' })
        }

        if (body.name) {
            combo.name = body.name
        }

        if (body.descripcion) {
            combo.descripcion = body.descripcion
        }

        const updatedCombo = await Combo.findByIdAndUpdate(
            request.params.id,
            combo,
            { new: true }
        )
        return response.json(updatedCombo)
    } catch (exception) {
        next(exception)
    }
})



combosRouter.put('/:id/change-price', async (request, response, next) => {
    const body = request.body
    try {
        const combo = await Combo.findById(request.params.id)

        if (!combo) {
            return response.status(404).json({ error: 'Combo not found' })
        }

        if (!body.precio && !body.moneda) {
            return response
                .status(409)
                .json({ error: 'Either precio or moneda must be provided' })
        }

        if (body.precio) {
            if (body.precio <= 0) {
                return response.status(400).json({
                    error: 'Valor no puede ser 0 o menor',
                })
            }
            combo.precio = body.precio
        }

        if (body.moneda) {
            const moneda = await Moneda.findById(body.moneda)
            if (!moneda) {
                return response.status(404).json({ error: 'Moneda not found' })
            }
            combo.moneda = body.moneda
        }

        const updatedCombo = await Combo.findByIdAndUpdate(
            request.params.id,
            combo,
            { new: true }
        )
        return response.json(updatedCombo)
    } catch (exception) {
        next(exception)
    }
})

combosRouter.put('/:id/change-discount', async (request, response, next) => {
    const body = request.body
    try {
        const combo = await Combo.findById(request.params.id)

        if (!combo) {
            return response.status(404).json({ error: 'Combo not found' })
        }

        if (!body.descuento) {
            return response
                .status(409)
                .json({ error: 'Descuento must be provided' })
        }

        if (body.descuento) {
            if (body.descuento < 0 || body.descuento > 99) {
                return response.status(400).json({
                    error: 'El descuento debe estar entre 0 y 99',
                })
            }
            combo.descuento = body.descuento
        }

        const updatedCombo = await Combo.findByIdAndUpdate(
            request.params.id,
            combo,
            { new: true }
        )
        return response.json(updatedCombo)
    } catch (exception) {
        next(exception)
    }
})

combosRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const combo = await Combo.findById(request.params.id)

            if (!combo) {
                return response.status(404).json({ error: 'combo not found' })
            }
            try {
                // Actualizar los documentos en la colección Productos
                await Producto.updateMany(
                    { combos: { $in: combo._id } }, // Filtra los documentos que contienen las referencias eliminadas
                    { $pull: { combos: { $in: combo._id } } } // Elimina las referencias del array Caracteristicas
                )

                // Eliminar la característica en sí misma de la colección Caracteristicas
                await Combo.findByIdAndDelete(request.params.id)

                response.status(204).end()
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = combosRouter
