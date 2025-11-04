CREATE TABLE [dbo].[pp_rendition_penalty_entity] (
    [import_entity_cd] CHAR (5) NOT NULL,
    [system_entity_id] INT      NULL,
    CONSTRAINT [CPK_pp_rendition_penalty_entity] PRIMARY KEY CLUSTERED ([import_entity_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

