const bcrypt = require('bcrypt')
const productosRouter = require('express').Router()
const Producto = require('../models/producto')
const Moneda = require('../models/moneda')
const Tipo = require('../models/tipo')
const Subtipo = require('../models/subtipo')
const Combo = require('../models/combo')
const CaracteristicaXproducto = require('../models/caracteristicaXproducto')
const multer = require('multer')
const formidable = require('formidable')
const ObjectId = require('mongoose').Types.ObjectId

const admin = require('firebase-admin')
const serviceAccount = require('../firebaseServiceAccount')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'ar-service-f8abf.appspot.com', // Cambia esto al nombre de tu bucket
})

const bucket = admin.storage().bucket()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // limita el tamaño del archivo a 5MB
    },
})

const middleware = require('../utils/middleware')
const Caracteristica = require('../models/caracteristica')

productosRouter.get('/', async (request, response) => {
    const productos = await Producto.find({})
        .populate({
            path: 'caracteristicas',
        })
        .populate('moneda')
        .populate({
            path: 'tipos',
            select: 'name _id',
        })
        .populate({
            path: 'subtipos',
            select: 'name _id',
        })

    const caracteristicaXproducto = await CaracteristicaXproducto.find(
        {}
    ).populate('caracteristica')

    const populatedProductos = productos.map((producto) => {
        let caracteristicasFiltradas = caracteristicaXproducto.filter(
            (caracteristica) =>
                caracteristica.producto.equals(new ObjectId(producto._id))
        )

        // Crear un nuevo objeto con las propiedades necesarias
        let productoConCaracteristicas = {
            ...producto.toJSON(), // Convertir el documento Mongoose a objeto JSON limpio
            caracteristicas: caracteristicasFiltradas,
        }

        return productoConCaracteristicas
        // return {

        //     ...producto,
        //     caracteristicas2: caracteristicaXproducto.filter(
        //         caracteristica =>{
        //            return (caracteristica.producto.equals(new ObjectId(producto._id)))}
        //     )
        // }
    })

    response.json(populatedProductos)
})



productosRouter.get('/marcas', async (request, response) => {
    try {
        const marcas = await Producto.distinct('marca')
        response.json(marcas)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/marcas-disponibles', async (request, response) => {
    try {
        const marcas = await Producto.distinct('marca', { 'estado_activo.estado': 'Disponible' })
        response.json(marcas)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/origenes-disponibles', async (request, response) => {
    try {
        const marcas = await Producto.distinct('origen', { 'estado_activo.estado': 'Disponible' })
        response.json(marcas)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})




productosRouter.get('/origenes', async (request, response) => {
    try {
        const origenes = await Producto.distinct('origen')
        response.json(origenes)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/monedas', async (request, response) => {
    try {
        const monedas = await Moneda.find({})
        response.json(monedas)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/tipos', async (request, response) => {
    try {
        const tipos = await Tipo.find({})
        response.json(tipos)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/subtipos', async (request, response) => {
    try {
        const subtipos = await Subtipo.find({})
        response.json(subtipos)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/caracteristicas', async (request, response) => {
    try {
        const caracteristicas = await Caracteristica.find({})
        response.json(caracteristicas)
    } catch (error) {
        response.status(500).json({ error: 'Internal server error' })
    }
})

productosRouter.get('/:id', async (request, response, next) => {
    const { id } = request.params

    try {
        const producto = await Producto.findById(id).populate('caracteristicas')
        if (!producto) {
            return response.status(404).json({
                error: 'Producto not found',
            })
        }

        // Check each characteristic to identify the problematic one
        for (const caracXProd of producto.caracteristicas) {
            try {
                const prueba = await Caracteristica.findById(
                    caracXProd.caracteristica
                )
                console.log(prueba)
            } catch (exception) {
                console.error(
                    `Error populating caracteristica ${caracXProd.caracteristica}:`,
                    exception
                )
            }
        }

        response.json(producto)
    } catch (exception) {
        next(exception)
    }
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

        // if (!body.imagenes) {
        //     return response.status(400).json({
        //         error: 'imagenes missing',
        //     })
        // }

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
        console.log(body.tipos)

        // Ahora puedes asignar tiposObjectIdArray al campo tipos en tu documento de Mongoose

        const producto = new Producto({
            name: body.name,
            descripcion: body.descripcion,
            origen: body.origen,
            precio: body.precio,
            moneda: body.moneda,
            marca: body.marca,
            modelo: body.modelo,

            portada:
                'https://firebasestorage.googleapis.com/v0/b/ar-service-f8abf.appspot.com/o/no-photo.jpg?alt=media&token=770977fc-e1c7-4802-8915-db2daca9afc2',
            imagenes:
                'https://firebasestorage.googleapis.com/v0/b/ar-service-f8abf.appspot.com/o/no-photo.jpg?alt=media&token=770977fc-e1c7-4802-8915-db2daca9afc2',
        })

        if (body.tipos) {
            for (const elemento of body.tipos) {
                const tipo = await Tipo.findById(elemento)
                if (!tipo) {
                    return response
                        .status(404)
                        .json({ error: 'Tipo ' + elemento + ' not found' })
                }
            }
            producto.tipos = body.tipos
        }

        if (body.subtipos) {
            for (const elemento of body.subtipos) {
                const subtipo = await Subtipo.findById(elemento)
                if (!subtipo) {
                    return response.status(404).json({
                        error: 'Subtipo ' + elemento + ' not found',
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

        console.log(producto)
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

productosRouter.put(
    '/:id/add-image',
    upload.single('portada'),
    async (request, response, next) => {
        const body = request.body
        try {
            return response.status(200)
        } catch (exception) {
            console.log('algo dio error')
            next(exception)
        }
    }
)

productosRouter.put('/:id/change-portada', (request, response, next) => {
    const form = new formidable.IncomingForm()
    form.parse(request, async (err, fields, files) => {
        if (err) {
            return next(err)
        }

        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!files.portada) {
            return response.status(400).json({ error: 'No file uploaded' })
        }

        const file = files.portada
        const filePath = file[0].filepath // Path temporal donde formidable guarda el archivo
        const fileName = `${Date.now()}_${producto.marca}${producto.modelo}`
        const blob = bucket.file(`images/${fileName}`)

        try {
            await bucket.upload(filePath, {
                destination: blob.name,
                metadata: {
                    contentType: file[0].mimetype,
                    public: true,
                },
            })

            await bucket.upload(filePath, {
                destination: blob.name,
                metadata: {
                    contentType: file[0].mimetype,
                },
            })

            // Configura los permisos de acceso público después de crear el archivo
            await blob.makePublic()

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            // Aquí podrías guardar la URL en tu base de datos si lo necesitas
            await Producto.findByIdAndUpdate(request.params.id, {
                portada: publicUrl,
            })
            // await producto.save();
            response.status(200).json({ url: publicUrl })
        } catch (error) {
            next(error)
        }
    })
})

productosRouter.put('/:id/change-imagenes', (request, response, next) => {
    const form = new formidable.IncomingForm()
    form.parse(request, async (err, fields, files) => {
        if (err) {
            return next(err)
        }

        const producto = await Producto.findById(request.params.id)

        if (!producto) {
            return response.status(404).json({ error: 'Producto not found' })
        }

        if (!files.imagenes) {
            return response.status(400).json({ error: 'No file uploaded' })
        }

        const publicUrl = []

        for (const imagen of files.imagenes) {
            const file = files.portada
            const filePath = imagen.filepath // Path temporal donde formidable guarda el archivo
            const fileName = `${Date.now()}_${producto.marca}${producto.modelo}`
            const blob = bucket.file(`images/${fileName}`)

            try {
                await bucket.upload(filePath, {
                    destination: blob.name,
                    metadata: {
                        contentType: imagen.mimetype,
                        public: true,
                    },
                })

                await bucket.upload(filePath, {
                    destination: blob.name,
                    metadata: {
                        contentType: imagen.mimetype,
                    },
                })

                await blob.makePublic()

                publicUrl.push(
                    `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                )

                // await producto.save();
            } catch (error) {
                next(error)
            }
        }
        response.status(200).json({ url: publicUrl })

        try {
            await Producto.findByIdAndUpdate(request.params.id, {
                imagenes: publicUrl,
            })
        } catch (error) {
            next(error)
        }
    })
})

productosRouter.put(
    '/:id/append-observacion',
    async (request, response, next) => {
        const body = request.body
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto not found' })
            }

            if (!body.observacion) {
                return response
                    .status(409)
                    .json({ error: 'Observacion must be provided' })
            }

            const observacion = {
                observacion: body.observacion,
                fecha: Date.now(),
            }

            producto.observaciones.push(observacion)

            const updatedProducto = await Producto.findByIdAndUpdate(
                request.params.id,
                producto,
                { new: true }
            )
            return response.json(updatedProducto.observaciones.slice(-1)[0])
        } catch (exception) {
            next(exception)
        }
    }
)

productosRouter.put(
    '/:id/delete-observacion',
    async (request, response, next) => {
        const body = request.body
        try {
            const producto = await Producto.findById(request.params.id)

            if (!producto) {
                return response
                    .status(404)
                    .json({ error: 'Producto not found' })
            }

            if (!body.observacion_id) {
                return response
                    .status(409)
                    .json({ error: 'Observacion must be provided' })
            }

            const updatedObservaciones = producto.observaciones.filter(
                (observacion) => {
                    return observacion.id !== body.observacion_id
                }
            )

            const updatedProducto = await Producto.findByIdAndUpdate(
                request.params.id,
                { observaciones: updatedObservaciones }
            )
            return response.json(updatedProducto)
        } catch (exception) {
            next(exception)
        }
    }
)

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

        if (body.estado === producto.estado_activo.estado) {
            return response.status(400).json({ error: 'Estado already active' })
        }

        if (producto.estado_activo.estado === 'Disponible') {
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
            estado: producto.estado_activo.estado,
            fecha: producto.estado_activo.fecha,
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
