const FoldersService = {
    getAllFolders(knex){
        return knex.select('*').from('noteful_folders');
    },
    insertFolder(knex, folder) {
        return knex
        .insert(folder)
        .into('noteful_folders')
        .returning('*')
        .then(rows => {
            return rows[0]
        });
    },
    getFolderById(knex, id) {
        return knex.from('noteful_folders').select('*').where('folder_id', id).first();
    },
    deleteFolder(knex, id) {
        return knex('noteful_folders').where('folder_id', id).delete();
    },
    updateFolder(knex, id, newFolder) {
        return knex('noteful_folders').where('folder_id', id).update(newFolder);
    },
}

module.exports = FoldersService