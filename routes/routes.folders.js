const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('../services/folders-service.js');

const foldersRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
    folder_id: xss(folder.folder_id),
    name: xss(folder.name)
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knex = req.app.get('db')
        FoldersService.getAllFolders(knex)
        .then(folders => {
            res.json(folders.map(serializeFolder))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { folder_id, name } = req.body;
        const newFolder = { folder_id, name }

        for (const [key, value] of Object.entries(newFolder))
            if (value === null) 
            return res.status(400).json({
                error: {message: `Missing '${key}' in request body.  Valid posts must contain folder_id and name`}
            })

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
        .then(folder => {
            res.status(201)
            .location(path.posix.join(req.originalUrl, `/${folder.id}`))
            .json(serializeFolder(folder))
        })
        .catch(next)
    });

foldersRouter
    .route('/:id')
    .all((req, res, next) => {
    FoldersService.getFolderById(
        req.app.get('db'),
        req.params.id
    )
    .then(folder => {
        if (!folder) {
            return res.status(404).json({
                error: { message: `Could not find folder with id: ${req.params.id}` }
            })
        }
        res.folder = folder
        next()
    })
    .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.id
        )
        .then(rows => {
            res.status(204).end()
        })
        .catch(next);
    })
    .patch(bodyParser, (req, res, next) => {
        const { folder_id, name } = req.body;
        const updateFolder = { folder_id, name };

        const numOfVals = Object.values(updateFolder).filter(Boolean).length;
        if(numOfVals === 0) {
            return res.status(400).json({
                error: {
                    message: `You are missing a required field, please make sure name and folder_id are provided.`
                }
            })
        }
        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.id,
            updateFolder
        )
        .then(rows => {
            res.status(204).end()
        })
        .catch(next)
    });

    module.exports = foldersRouter