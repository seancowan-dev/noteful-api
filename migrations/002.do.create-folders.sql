CREATE TABLE noteful_folders (
    folder_id uuid DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    PRIMARY KEY (folder_id)
);