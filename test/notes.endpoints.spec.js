const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures');
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures');


// Primary Test Object - /api/folders/ //
describe('|  Notes Endpoint Test Object  |', function() {
    let db;

    // Build Knex //
    before('make knex instance', () => {
        db = knex(
            {
                client: 'pg',
                connection: process.env.TEST_DB_URL,
            }
        );
        app.set('db', db);
    })

    // Handle Disconnect and Cleaning DB //
    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))

    afterEach('clean after each test', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))


    // Begin Assertions //
    describe(`| /api/notes | GET | Test Object |`, () => {

        // No Notes Found //
        context(`|  No Notes Found  |`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/notes')
                .expect(200, []);
            });
        });

        // Notes Could Be Found //

        context('| Notes Found |', () => {

            // Make Test Notes //
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
            

            // Insert Test Folders //
            beforeEach('insert notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(res => {
                    return db
                    .into('noteful_notes')
                    .insert(testNotes);
                });
            });

            // Assertions //

            it('responds with 200 and all of the notes', () => {
                return supertest(app)
                .get('/api/notes')
                .expect(200, testNotes);
            });


        });

            // Make sure any XSS content that may be in DB entry is removed //
        context('| XSS Attack for GET |', () => {
            // Make Test Notes //
            const testFolders = makeFoldersArray();
            const { maliciousNote, expectedNote } = makeMaliciousNote()

            // Prepare to test //
            beforeEach('| INSERT | Malicious Note |', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(res => {
                    return db
                    .into('noteful_notes')
                    .insert(maliciousNote);
                });
            });

            // Assertions //
            it('Removes XSS attacks', () => {
                return supertest(app)
                .get('/api/notes')
                .expect(200)
                .expect(res => {
                    expect(res.body[0].id).to.eql(expectedNote.id);
                    expect(res.body[0].name).to.eql(expectedNote.name);
                    expect(res.body[0].content).to.eql(expectedNote.content);
                    expect(res.body[0].modified).to.eql(expectedNote.modified);
                    expect(res.body[0].folderid).to.eql(expectedNote.folderid);
                })
            })
        });
    });

        // Note by ID //
    describe('| /api/notes/:id | GET | Test Object |', () => {

        // No Notes Found //
        context('| No Notes Found |', () => {
            it('responds with 404', () => {
                const note_id = "371f5aa9-d8a0-4641-8d59-decca38c6362";
                return supertest(app)
                .get(`/api/folders/${note_id}`)
                .expect(404, {
                    error: {
                        message: `Could not find folder with id: ${note_id}`
                    }
                });
            });
        });

        // Notes Found //
        context('|  Notes Found  |', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
            
            // Insert Test Notes //
            beforeEach('insert notes', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(res => {
                    return db
                    .into('noteful_notes')
                    .insert(testNotes)
                })
            });

            // Assertions //

            it('responds with 200 and the specified note', () => {
                // First Test note //
                const note_id = "cbc787a0-ffaf-11e8-8eb2-f2801f1b9fd1";
                const expectedNote = testNotes[0];
                return supertest(app)
                .get(`/api/notes/${note_id}`)
                .expect(200, expectedNote);
            });
        });

        // Make sure XSS attacks are removed from folders db //
        context(`| XSS Attack for GET by ID |`, () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
            const { maliciousNote, expectedNote } = makeMaliciousNote();

            // Insert malicious note //

            beforeEach('insert malicious note', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                    .into('noteful_notes')
                    .insert([maliciousNote]);
                });
            });

            it('removes XSS attack', () => {
                return supertest(app)
                .get(`/api/notes/${maliciousNote.id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.id).to.eql(expectedNote.id);
                    expect(res.body.name).to.eql(expectedNote.name);
                    expect(res.body.content).to.eql(expectedNote.content);
                    expect(res.body.modified).to.eql(expectedNote.modified);
                    expect(res.body.folderid).to.eql(expectedNote.folderid);
                });
            });
        });
    });
});