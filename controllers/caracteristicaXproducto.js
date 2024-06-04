const bcrypt = require('bcrypt')
const caracteristicaXproductoRouter = require('express').Router()
const CaracteristicaXproducto = require('../models/caracteristicaXproducto')
const Caracteristica = require('../models/caracteristica')
const Producto = require('../models/producto')

const middleware = require('../utils/middleware')

caracteristicaXproductoRouter.get('/', async (request, response) => {
    const caracteristicaXproducto = await CaracteristicaXproducto.find({}).populate('caracteristica')
    response.json(caracteristicaXproducto)
})

caracteristicaXproductoRouter.post(
    '/',
    middleware.userExtractor,
    async (request, response, next) => {
        const body = request.body
        try {
            if (!body.caracteristica) {
                return response.status(400).json({
                    error: 'caracteristica missing',
                })
            }
            if (!body.producto_id) {
                return response.status(400).json({
                    error: 'producto missing',
                })
            }

            const producto = await Producto.findById(body.producto_id)
            if (!producto) {
                return response.status(400).json({
                    error: 'Producto deoes not  exist',
                })
            }

            const savedCaracteristicas = [];

            for (const newCaracteristica of body.caracteristica) {
                console.log('vuelta');
                if (!newCaracteristica.valor) {
                    return response.status(400).json({
                        error: 'Valor missing',
                    });
                }
    
                const caracteristica = await Caracteristica.findById(newCaracteristica.id);
    
                if (!caracteristica) {
                    return response.status(400).json({
                        error: 'Caracteristica does not exist',
                    });
                }
    
                const caracteristicaXproducto = new CaracteristicaXproducto({
                    caracteristica: caracteristica._id,
                    producto: producto._id,
                    valor: newCaracteristica.valor,
                });
    
                try {
                    const savedCaracteristicaXproducto = await caracteristicaXproducto.save();
                    savedCaracteristicas.push(savedCaracteristicaXproducto);
    
                    await Producto.findByIdAndUpdate(producto._id, {
                        $push: {
                            caracteristicas: savedCaracteristicaXproducto._id,
                        },  
                    });
                } catch (exception) {
                    next(exception);
                    return;
                }
            }

            response.status(201).json(savedCaracteristicas);
    

        } catch (exception) {
            console.log('dioerro 2');
            next(exception)
        }
    }
)

caracteristicaXproductoRouter.put(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        const body = request.body

        try {
            // Find the list by ID
            const caracteristicaXproducto =
                await CaracteristicaXproducto.findById(request.params.id)

            if (!caracteristicaXproducto) {
                return response
                    .status(404)
                    .json({ error: 'CaracteristicaXproducto not found' })
            }

            if (!body.valor) {
                return response
                    .status(409)
                    .json({ error: 'valor must be provided' })
            }
            caracteristicaXproducto.valor = body.valor
            const updatedCaracteristicaXproducto =
                await caracteristicaXproducto.save()

            return response.json(updatedCaracteristicaXproducto)
        } catch (exception) {
            next(exception)
        }
    }
)

caracteristicaXproductoRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const caracteristicaXproducto =
                await CaracteristicaXproducto.findById(request.params.id)

            if (!caracteristicaXproducto) {
                return response
                    .status(404)
                    .json({ error: 'CaracteristicaxProducto not found' })
            }

            try {
                await Producto.updateMany(
                    { caracteristicas: { $in: [request.params.id] } },
                    { $pull: { caracteristicas: request.params.id } }
                )
                await CaracteristicaXproducto.findByIdAndDelete(
                    request.params.id
                )

                response.status(204).end()
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = caracteristicaXproductoRouter
