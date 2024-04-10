const bcrypt = require('bcrypt')
const tiposRouter = require('express').Router()
const Tipo = require('../models/tipo')
const Subtipo = require('../models/subtipo')

const middleware = require('../utils/middleware')

tiposRouter.get('/', async (request, response) => {
    const tipo = await Tipo.find({})
    response.json(tipo)
})

tiposRouter.post(
    '/',
    middleware.userExtractor,
    async (request, response, next) => {
        const body = request.body
        try {
            if (!body.name) {
                return response.status(400).json({
                    error: 'name missing',
                })
            }
            const tipo = new Tipo({
                name: body.name,
            })

            try {
                const savedTipo = await tipo.save()
                response.status(201).json(savedTipo)
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

tiposRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const tipo = await Tipo.findById(request.params.id)

        if (!tipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }

        if (!body.name) {
            return response.status(400).json({
                error: 'name missing',
            })
        }

        tipo.name = body.name

        const updatedtipo = await Tipo.findByIdAndUpdate(
            request.params.id,
            tipo,
            { new: true }
        ).populate('subtipos', { name: 1 })
        return response.json(updatedtipo)
    } catch (exception) {
        next(exception)
    }
})

tiposRouter.put('/:id/add-subtipo', async (request, response, next) => {
    const body = request.body

    const subtipoId = body.subtipo

    try {
        const updatedsubtipo = await Subtipo.findById(subtipoId)
        const tipo = await Tipo.findById(request.params.id)

        //#region Integrity handling
        if (!updatedsubtipo) {
            return response.status(404).json({ error: 'Subtipo not found' })
        }

        if (!tipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }
        if (tipo.subtipos.includes(updatedsubtipo._id)) {
            return response
                .status(400)
                .json({ error: 'Subtipo already exists in the tipo' })
        }
        //#endregion Integrity handling

        updatedsubtipo.tipos = updatedsubtipo.tipos.concat(tipo._id)
        await updatedsubtipo.save()

        tipo.subtipos = tipo.subtipos.concat(updatedsubtipo._id)
        await tipo.save()
        const populatedtipo = await Tipo.findById(tipo._id).populate(
            'subtipos',
            { name: 1 }
        )
        response.status(201).json(populatedtipo)
    } catch (exception) {
        next(exception)
    }
})

tiposRouter.put('/:id/remove-subtipo', async (request, response, next) => {
    const body = request.body

    const subtipoId = body.subtipo

    try {
        const subtipo = await Subtipo.findById(subtipoId)
        const tipo = await Tipo.findById(request.params.id)

        //#region Integrity handling
        if (!subtipo) {
            return response.status(404).json({ error: 'Subtipo not found' })
        }

        if (!tipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }
        if (!tipo.subtipos.includes(subtipo._id)) {
            return response
                .status(400)
                .json({ error: 'Subtipo doesnt exists in the tipo' })
        }
        //#endregion Integrity handling

        if (subtipo.tipos.length === 1) {
            // Eliminar subtipo y dependencias
        } else {
            await Subtipo.findByIdAndUpdate(
                subtipoId,
                { $pull: { tipos: tipo.id } },
                { new: true }
            )

            const updatedtipo = await Tipo.findByIdAndUpdate(
                tipo.id,
                { $pull: { subtipos: subtipoId } },
                { new: true }
            )
        }

        response.status(201).json(updatedtipo)
    } catch (exception) {
        next(exception)
    }
})

tiposRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const tipo = await Tipo.findById(request.params.id)

            if (!tipo) {
                return response
                    .status(404)
                    .json({ error: 'CaracteristicaxProducto not found' })
            }

            try {

                const idsEliminados = await Subtipo.distinct(
                    '_id',
                    { tipos: request.params.id }
                )

                for (const elemento of idsEliminados) {
                    const subtipo = await Subtipo.findById(elemento._id)
                    if (subtipo.tipos.length === 1) {
                        return response
                    .status(404)
                    .json({ error: 'Only tipo on subtipo ' + subtipo._id })
                    }
                }
                //Corroborar si es el único tipo

                await Subtipo.updateMany(
                    { tipo: { $in: [request.params.id] } },
                    { $pull: { tipos: request.params.id } }
                )
                await Tipo.findByIdAndDelete(request.params.id)

                response.status(200).json({ msg: 'Tipo erased correctly' })

            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = tiposRouter
