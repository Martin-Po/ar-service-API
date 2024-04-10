const bcrypt = require('bcrypt')
const caracteristicasRouter = require('express').Router()
const Caracteristica = require('../models/caracteristica')
const middleware = require('../utils/middleware')
const Caracteristicaxproducto = require('../models/caracteristicaXproducto')

caracteristicasRouter.get('/', async (request, response) => {
    const caracteristicas = await Caracteristica.find({})
    response.json(caracteristicas)
})

caracteristicasRouter.post(
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

        const caracteristica = new Caracteristica({
            name: body.name,
            descripcion: body.descripcion,
        })

        try {
            const savedCaracteristica = await caracteristica.save()
            response.status(201).json(savedCaracteristica)
        } catch (exception) {
            next(exception)
        }
    }
)

caracteristicasRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const caracteristica = await Caracteristica.findById(request.params.id)

        if (!caracteristica) {
            return response.status(404).json({ error: 'Caracteristica not found' })
        }

        if (!body.name && !body.descripcion) {
            return response
                .status(409)
                .json({ error: 'Either name or descripcion must be provided' })
        }

        if (body.name) {          
            caracteristica.name = body.name
        }

        if (body.descripcion) {          
            caracteristica.descripcion = body.descripcion
        }
       
        const updatedCaracteristica = await Caracteristica.findByIdAndUpdate(
            request.params.id,
            caracteristica,
            { new: true }
        )
        return response.json(updatedCaracteristica)
    } catch (exception) {
        next(exception)
    }
})

caracteristicasRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const caracteristica = await Caracteristica.findById(
                request.params.id
            )

            if (!caracteristica) {
                return response
                    .status(404)
                    .json({ error: 'caracteristica not found' })
            }

            try {
                const idsEliminados = await Caracteristicaxproducto.distinct(
                    '_id',
                    { caracteristica: request.params.id }
                )

                // Actualizar los documentos en la colección Productos
                await Producto.updateMany(
                    { caracteristicas: { $in: idsEliminados } }, // Filtra los documentos que contienen las referencias eliminadas
                    { $pull: { caracteristicas: { $in: idsEliminados } } } // Elimina las referencias del array Caracteristicas
                )

                // Eliminar los documentos de la colección CaracteristicasXProducto
                await Caracteristicaxproducto.deleteMany({
                    caracteristica: { $in: [request.params.id] },
                })

                // Eliminar la característica en sí misma de la colección Caracteristicas
                await Caracteristica.findByIdAndDelete(request.params.id)

                response.status(204).end()
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = caracteristicasRouter
