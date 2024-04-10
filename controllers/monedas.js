const bcrypt = require('bcrypt')
const monedasRouter = require('express').Router()
const Moneda = require('../models/moneda')
const middleware = require('../utils/middleware')

monedasRouter.get('/', async (request, response) => {
    const monedas = await Moneda.find({})
    response.json(monedas)
})

monedasRouter.post(
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

        const moneda = new Moneda({
            name: body.name,
            descripcion: body.descripcion,
        })

        try {
            const savedMoneda = await moneda.save()
            response.status(201).json(savedMoneda)
        } catch (exception) {
            next(exception)
        }
    }
)

monedasRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const moneda = await Moneda.findById(request.params.id)

        if (!moneda) {
            return response.status(404).json({ error: 'Moneda not found' })
        }

        if (!body.name && !body.descripcion) {
            return response
                .status(409)
                .json({ error: 'Either name or descripcion must be provided' })
        }

        if (body.name) {
            moneda.name = body.name
        }

        if (body.descripcion) {
            moneda.descripcion = body.descripcion
        }

        const updatedMoneda = await Moneda.findByIdAndUpdate(
            request.params.id,
            moneda,
            { new: true }
        )
        return response.json(updatedMoneda)
    } catch (exception) {
        next(exception)
    }
})

monedasRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const moneda = await Moneda.findById(request.params.id)

            if (!moneda) {
                return response.status(404).json({ error: 'moneda not found' })
            }

            const combosConMoneda = await Combo.countDocuments({ moneda: request.params.id });
            const productosConMoneda = await Producto.countDocuments({ moneda: request.params.id });

            if (combosConMoneda > 0) {
                return response.status(400).json({ error: 'Se encontraron combos con precios en esta moneda' });
            }

            if (productosConMoneda > 0) {
                return response.status(400).json({ error: 'Se encontraron productos con precios en esta moneda' });
            }

            await Moneda.findByIdAndDelete(request.params.id)

            response.status(204).end()
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = monedasRouter
