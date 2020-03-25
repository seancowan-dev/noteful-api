const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('../services/notes-service.js');

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    id: xss(note.id),
    name: xss(note.name),
    content: xss(note.content),
    modified: note.modified,
    folderid: xss(note.folderid)
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knex = req.app.get('db')
        NotesService.getAllNotes(knex)
        .then(notes => {
            res.json(notes.map(serializeNote))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { id, name, content, modified, folderid } = req.body;
        const newNote = { id, name, modified, folderid }

        for (const [key, value] of Object.entries(newNote))
            if (value === null) 
            return res.status(400).json({
                error: {message: `Missing '${key}' in request body.  Valid posts must contain, id, name, modified, and folderID`}
            })

        newNote.content = content;

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res.status(201)
            .location(path.posix.join(req.originalUrl, `/${note.id}`))
            .json(serializeNote(note))
        })
        .catch(next)
    });

notesRouter
    .route('/:id')
    .all((req, res, next) => {
    NotesService.getNoteById(
        req.app.get('db'),
        req.params.id
    )
    .then(note => {
        if (!note) {
            return res.status(404).json({
                error: { message: `Could not find note with id: ${req.params.id}` }
            })
        }
        res.note = note
        next()
    })
    .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note))
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.id
        )
        .then(rows => {
            res.status(204).end()
        })
        .catch(next);
    })
    .patch(bodyParser, (req, res, next) => {
        const { id, name, modified, folderid } = req.body;
        const updateNote = { id, name, modified, folderid };

        const numOfVals = Object.values(updateNote).filter(Boolean).length;
        if(numOfVals === 0) {
            return res.status(400).json({
                error: {
                    message: `You are missing a required field, please make sure id, name, modified and folderID are provided.`
                }
            })
        }
        NotesService.updateNote(
            req.app.get('db'),
            req.params.id,
            updateNote
        )
        .then(rows => {
            res.status(204).end()
        })
        .catch(next)
    });

    module.exports = notesRouter