const bcrypt = require('bcrypt')
const subtiposRouter = require('express').Router()
const Tipo = require('../models/tipo')
const Subtipo = require('../models/subtipo')
const Producto = require('../models/producto')

const middleware = require('../utils/middleware')

subtiposRouter.get('/', async (request, response) => {
    const subtipo = await Subtipo.find({})
    response.json(subtipo)
})

subtiposRouter.post(
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
            if (!body.tipoid) {
                return response.status(400).json({
                    error: 'tipo missing',
                })
            }

            const tipo = await Tipo.findById(body.tipoid)

            if (!tipo) {
                return response.status(404).json({ error: 'Tipo not found' })
            }

       
            const subtipo = new Subtipo({
                name: body.name,
                tipos: tipo._id
            })

            try {
                const savedSubtipo = await subtipo.save()
                
                tipo.subtipos = tipo.subtipos.concat(savedSubtipo._id)
                await tipo.save()

                response.status(201).json(savedSubtipo)

            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

subtiposRouter.put('/:id', async (request, response, next) => {
    const body = request.body
    try {
        const subtipo = await Subtipo.findById(request.params.id)

        if (!subtipo) {
            return response.status(404).json({ error: 'Subtipo not found' })
        }

        if (!body.name) {
            return response.status(400).json({
                error: 'name missing',
            })
        }

        subtipo.name = body.name

        const updatedsubtipo = await Subtipo.findByIdAndUpdate(
            request.params.id,
            subtipo,
            { new: true }
        ).populate('tipos', { name: 1 })
        return response.json(updatedsubtipo)
    } catch (exception) {
        next(exception)
    }
})

subtiposRouter.put('/:id/add-tipo', async (request, response, next) => {
    const body = request.body

    const tipoId = body.tipo

    try {
        const updatedtipo = await Tipo.findById(tipoId)
        const subtipo = await Subtipo.findById(request.params.id)

        //#region Integrity handling
        if (!updatedtipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }

        if (!subtipo) {
            return response.status(404).json({ error: 'Subtipo not found' })
        }
        if (subtipo.tipos.includes(updatedtipo._id)) {
            return response
                .status(400)
                .json({ error: 'Tipo already exists in the subtipo' })
        }
        //#endregion Integrity handling

        updatedtipo.subtipos = updatedtipo.subtipos.concat(subtipo._id)
        await updatedtipo.save()

        subtipo.tipos = subtipo.tipos.concat(updatedtipo._id)
        await subtipo.save()
        const populatedsubtipo = await Subtipo.findById(subtipo._id).populate(
            'tipos',
            { name: 1 }
        )
        response.status(201).json(populatedsubtipo)
    } catch (exception) {
        next(exception)
    }
})

subtiposRouter.put('/:id/remove-tipo', async (request, response, next) => {
    const body = request.body

    const tipoId = body.tipo

    try {
        const tipo = await Tipo.findById(tipoId)
        const subtipo = await Subipo.findById(request.params.id)

        //#region Integrity handling
        if (!tipo) {
            return response.status(404).json({ error: 'Tipo not found' })
        }

        if (!subtipo) {
            return response.status(404).json({ error: 'Subtipo not found' })
        }
        if (!subtipo.tipos.includes(tipoId._id)) {
            return response
                .status(400)
                .json({ error: 'Tipo doesnt exists in the subtipo' })
        }
        //#endregion Integrity handling

        if (!subtipo.tipos.length === 1) {
            return response
                .status(400)
                .json({ error: 'Subtipo must have at least one Tipo' })
        }

        await Tipo.findByIdAndUpdate(
            tipoId,
            { $pull: { subtipos: subtipos.id } },
            { new: true }
        )

        const updatedsubtipo = await Subtipo.findByIdAndUpdate(
            subtipo.id,
            { $pull: { tipos: tipoId } },
            { new: true }
        )

        response.status(201).json(updatedsubtipo)
    } catch (exception) {
        next(exception)
    }
})

subtiposRouter.delete(
    '/:id',
    middleware.userExtractor,
    async (request, response, next) => {
        try {
            const subtipo = await Subtipo.findById(request.params.id)

            if (!subtipo) {
                return response
                    .status(404)
                    .json({ error: 'Subtipo not found' })
            }

            try {
                await Tipo.updateMany(
                    { subtipos: { $in: [request.params.id] } },
                    { $pull: { subtipos: request.params.id } }
                )
                await Producto.updateMany(
                    { subtipos: { $in: [request.params.id] } },
                    { $pull: { subtipos: request.params.id } }
                )
                await Subtipo.findByIdAndDelete(request.params.id)

                response.status(200).json({ msg: 'Subtipo erased correctly' })
            } catch (exception) {
                next(exception)
            }
        } catch (exception) {
            next(exception)
        }
    }
)

module.exports = subtiposRouter
