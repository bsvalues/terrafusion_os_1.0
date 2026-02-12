CREATE TABLE [dbo].[oa_change_entity] (
    [entity_id] INT         NOT NULL,
    [entity_cd] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK_oa_change_entity] PRIMARY KEY CLUSTERED ([entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

