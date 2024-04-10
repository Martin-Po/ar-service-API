const bcrypt = require('bcrypt')
const productosRouter = require('express').Router()
const Producto = require('../models/producto')
const Moneda = require('../models/moneda')
const Tipo = require('../models/tipo')
const Combo = require('../models/combo')
const CaracteristicaXproducto = require('../models/caracteristicaXproducto')


const middleware = require('../utils/middleware')

productosRouter.get('/', async (request, response) => {
    const productos = await Producto.find({})
    response.json(productos)
})

productosRouter.post(
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

        if (!body.tipos) {
            return response.status(400).json({
                error: 'tipo missing',
            })
        }

        if (!body.origen) {
            return response.status(400).json({
                error: 'origen missing',
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

        if (!body.marca) {
            return response.status(400).json({
                error: 'marca missing',
            })
        }

        if (!body.modelo) {
            return response.status(400).json({
                error: 'modelo missing',
            })
        }

        if (!body.portada) {
            return response.status(400).json({
                error: 'portada missing',
            })
        }

        if (!body.imagenes) {
            return response.status(400).json({
                error: 'imagenes missing',
            })
        }

        if (body.moneda) {
            const moneda = await Moneda.findById(body.moneda)
            if (!moneda) {
                return response.status(404).json({ error: 'Moneda not found' })
            }
        }

        if (body.precio <= 0) {
            return response.status(400).json({
                error: 'Valor no puede ser 0 o menor',
            })
        }
        console.log(body.tipos);

        

        for (const elemento of body.tipos) {
            const tipo = await Tipo.findById(elemento)
            if (!tipo) {
                return response
                    .status(404)
                    .json({ error: 'Tipo ' + elemento + ' not found' })
            }          

        }

// Ahora puedes asignar tiposObjectIdArray al campo tipos en tu documento de Mongoose



        const producto = new Producto({
            name: body.name,
            descripcion: body.descripcion,
            origen: body.origen,
            precio: body.precio,
            moneda: body.moneda,
            marca: body.marca,
            modelo: body.modelo,
            portada: body.portada,
            imagenes: body.imagenes,
        })


        if (body.subtipos) {
            for (const elemento of body.tipos) {
                const tipo = await Tipo.findById(elemento._id)
                if (!tipo) {
                    return response.status(404).json({
                        error: 'Subtipo ' + elemento._id + ' not found',
                    })
                }
            }
            producto.subtipos = body.subtipos
        }

        if (body.observacion) {
            // Crear un nuevo objeto de observación con la observación proporcionada y la fecha de hoy
            const nuevaObservacion = {
                observacion: body.observacion,
                fecha: new Date(),
            }
            // Agregar el nuevo objeto de observación al array de observaciones
            producto.observaciones.push(nuevaObservacion)
        }

        console.log(producto);
        try {
            const savedProducto = await producto.save()
            await savedProducto.populate({
                path: 'moneda',
            })
            response.status(201).json(savedProducto)
        } catch (exception) {
            next(exception)
        }
    }
)

productosRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (
            !(
                body.name ||
                body.descripcion ||
                body.origen ||
                body.marca ||
                body.modelo
            )
        ) {
            return response.status(409).json({
                error: 'Either descripcion, name, origen, marca or modelo must be provided',
            })
        }

        if (body.name) {
            producto.name = body.name
        }

        if (body.descripcion) {
            producto.descripcion = body.descripcion
        }

        if (body.origen) {
            producto.origen = body.origen
        }

        if (body.marca) {
            producto.marca = body.marca
        }

        if (body.modelo) {
            producto.modelo = body.modelo
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/change-price', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
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
            producto.precio = body.precio
        }

        if (body.moneda) {
            const moneda = await Moneda.findById(body.moneda)
            if (!moneda) {
                return response.status(404).json({ error: 'Moneda not found' })
            }
            producto.moneda = body.moneda
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/change-discount', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.descuento) {
            return response
                .status(409)
                .json({ error: 'Descuento must be provided' })
        }

        if (body.descuento) {
            if (body.precio < 0) {
                return response.status(400).json({
                    error: 'Valor no puede ser menor a 0',
                })
            }
            producto.descuento = body.descuento
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/add-tipo', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.tipo) {
            return response.status(409).json({ error: 'Tipo must be provided' })
        }

        const tipo = await Tipo.findById(body.tipo)

        if (!tipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }

        if (producto.tipos.includes(body.tipo)) {
            return response
                .status(400)
                .json({ error: 'Tipo already in producto' })
        }

        producto.tipos.push(body.tipo)

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/add-subtipo', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.subtipo) {
            return response.status(409).json({ error: 'Tipo must be provided' })
        }

        const subtipo = await Subtipo.findById(body.subtipo)

        if (!subtipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }

        if (producto.subtipos.includes(body.subtipo)) {
            return response
                .status(400)
                .json({ error: 'Subtipo already in producto' })
        }

        const tiposDelProducto = await Tipo.find({
            _id: { $in: producto.tipos },
        })

        // Verificar si alguno de los tipos del producto es padre del subtipo que se intenta agregar
        const esTipoPadre = tiposDelProducto.some((tipo) =>
            tipo.subtipos.includes(subtipo._id)
        )

        if (!esTipoPadre) {
            return response
                .status(400)
                .json({ error: 'El subtipo no es válido para este producto' })
        }

        producto.subtipo.push(body.subtipo)

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/add-image', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.imagen) {
            return response
                .status(409)
                .json({ error: 'Imagen must be provided' })
        }

        const tiposDelProducto = await Tipo.find({
            _id: { $in: producto.tipos },
        })

        producto.imagenes.push(body.imagen)

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/change-portada', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.portada) {
            return response
                .status(409)
                .json({ error: 'Portada must be provided' })
        }

        producto.portada = body.portada

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/add-observacion', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.observacion) {
            return response
                .status(409)
                .json({ error: 'Observacion must be provided' })
        }

        producto.observaciones.push(body.observacion)

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.put('/:id/change-state', async (request, response, next) => {
    const body = request.body
    try {
        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!body.estado) {
            return response
                .status(409)
                .json({ error: 'Estado must be provided' })
        }

        if(body.estado === producto.estado_activo.estado)
        {
            return response
                .status(400)
                .json({ error: 'Estado already active' })
        }

        if (producto.estado_activo.estado === 'Disponible')
        {
            const CombosProducto = await Combo.distinct('_id', {
                productos: request.params.id,
            })

            if (CombosProducto.length > 0) {
                return response
                    .status(400)
                    .json({ error: 'El producto se encuentra en un combo' })
            }
        }

        producto.log_estados.push({
            estado: body.estado_activo.estado,
            fecha: body.estado_activo.fecha,
        })

        producto.estado_activo = {
            estado: body.estado,
            fecha: new Date(),
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
            request.params.id,
            producto,
            { new: true }
        )
        return response.json(updatedProducto)
    } catch (exception) {
        next(exception)
    }
})

productosRouter.delete(
    '/:id/tipos/:tipoId',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto not found' })
            }

            const tipoId = request.params.tipoId

            if (!producto.tipos.includes(tipoId)) {
                return response
                    .status(400)
                    .json({ error: 'Tipo is not in producto' })
            }

            // Remove the tipo from the producto
            producto.tipos = producto.tipos.filter(
                (id) => id.toString() !== tipoId
            )

            // Save the updated list
            const updatedProducto = await producto.save()

            // Populate the owner field in the response
            await updatedProducto.populate({
                path: 'tipos',
            })

            return response.json(updatedProducto)
        } catch (exception) {
            next(exception)
        }
    }
)

productosRouter.delete(
    '/:id/imagenes/:imagenId',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto not found' })
            }

            const imagenId = request.params.imagenId

            if (!producto.imagenes.includes(imagenId)) {
                return response
                    .status(400)
                    .json({ error: 'Imagen is not in producto' })
            }

            if (producto.imagenes.length() === 1) {
                return response
                    .status(400)
                    .json({ error: 'Cannot erase only image in producto' })
            }

            // Remove the tipo from the producto
            producto.imagenes = producto.imagenes.filter(
                (id) => id.toString() !== imagenId
            )

            // Save the updated list
            const updatedProducto = await producto.save()

            // Populate the owner field in the response
            await updatedProducto

            return response.json(updatedProducto)
        } catch (exception) {
            next(exception)
        }
    }
)

productosRouter.delete(
    '/:id/subtipos/:subtipoId',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto not found' })
            }

            const subtipoId = request.params.subtipoId

            if (!producto.subtipos.includes(subtipoId)) {
                return response
                    .status(400)
                    .json({ error: 'Subtipo is not in producto' })
            }

            // Remove the tipo from the producto
            producto.subtipos = producto.subtipos.filter(
                (id) => id.toString() !== subtipoId
            )

            // Save the updated list
            const updatedProducto = await producto.save()

            // Populate the owner field in the response
            await updatedProducto.populate({
                path: 'subtipos',
            })

            return response.json(updatedProducto)
        } catch (exception) {
            next(exception)
        }
    }
)

productosRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'producto not found' })
            }
            try {
                const CombosProducto = await Combo.distinct('_id', {
                    productos: request.params.id,
                })

                if (CombosProducto.length > 0) {
                    return response
                        .status(400)
                        .json({ error: 'El producto se encuentra en un combo' })
                }
                
                await CaracteristicaXproducto.deleteMany({
                    producto: { $in: [request.params.id] },
                })

                // Eliminar la característica en sí misma de la colección Caracteristicas
                await Producto.findByIdAndDelete(request.params.id)

                response.status(204).end()
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = productosRouter
