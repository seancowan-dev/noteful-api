CREATE TABLE noteful_notes (
    id uuid DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    content TEXT,
    modified TIMESTAMPTZ DEFAULT now() NOT NULL,
    folderID uuid NOT NULL,
    PRIMARY KEY(id)
)