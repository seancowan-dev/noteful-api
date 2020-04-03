const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures');


// Primary Test Object - /api/folders/ //
describe('|  Folders Endpoint Test Object  |', function() {
    let db;

    // Build Knex //
    before('make knex instance', () => {
        db = knex(
            {
                client: 'pg',
                connection: process.env.TEST_DATABASE_URL,
            }
        );
        app.set('db', db);
    })

    // Handle Disconnect and Cleaning DB //
    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))

    afterEach('clean after each test', () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))


    // Begin Assertions //
    describe(`| /api/folders | GET | Test Object |`, () => {

        // No Folders Found //
        context(`|  No Folders Found  |`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200, []);
            });
        });

        // Folder Could Be Found //

        context('| Folders Found |', () => {

            // Make Test Folders //
            const testFolders = makeFoldersArray();
            

            // Insert Test Folders //
            beforeEach('insert folders', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            });

            // Assertions //

            it('responds with 200 and all of the folders', () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200, testFolders);
            });


        });

            // Make sure any XSS content that may be in DB entry is removed //
        context('| XSS Attack for GET |', () => {
            // Make Test Folders //
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

            // Prepare to test //
            beforeEach('| INSERT | Malicious Article |', () => {
                return db
                .into('noteful_folders')
                .insert(maliciousFolder);
            });

            // Assertions //
            it('Removes XSS attacks', () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200)
                .expect(res => {
                    expect(res.body[0].folder_id).to.eql(expectedFolder.folder_id);
                    expect(res.body[0].name).to.eql(expectedFolder.name);
                })
            })
        });
    });

        // Folder by ID //
    describe('| /api/folders/:id | GET | Test Object |', () => {

        // No Folders Found //
        context('| No Folders Found |', () => {
            it('responds with 404', () => {
                const folder_id = "371f5aa9-d8a0-4641-8d59-decca38c6362";
                return supertest(app)
                .get(`/api/folders/${folder_id}`)
                .expect(404, {
                    error: {
                        message: `Could not find folder with id: ${folder_id}`
                    }
                });
            });
        });

        // Folders Found //
        context('|  Folders Found  |', () => {
            const testFolders = makeFoldersArray();
            
            // Insert Test Articles //
            beforeEach('insert articles', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            });

            // Assertions //

            it('responds with 200 and the specified folder', () => {
                // First Test folder //
                const folder_id = "86a895b4-b446-4a8f-816f-e6e6e0ba0c86";
                const expectedFolder = testFolders[0];
                return supertest(app)
                .get(`/api/folders/${folder_id}`)
                .expect(200, expectedFolder);
            });
        });

        // Make sure XSS attacks are removed from folders db //
        context(`| XSS Attack for GET by ID |`, () => {
            const testFolders = makeFoldersArray();
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

            // Insert malicious folder //

            beforeEach('insert malicious folder', () => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
                .then(() => {
                    return db
                    .into('noteful_folders')
                    .insert([maliciousFolder]);
                });
            });

            it('removes XSS attack', () => {
                return supertest(app)
                .get(`/api/folders/${maliciousFolder.folder_id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.folder_id).to.eql(expectedFolder.folder_id);
                    expect(res.body.name).to.eql(expectedFolder.name);
                });
            });
        });
    });
});