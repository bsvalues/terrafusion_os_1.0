CREATE TABLE [dbo].[transfer_appraisal_entity] (
    [entity_id] INT         NOT NULL,
    [entity_cd] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK_transfer_appraisal_entity] PRIMARY KEY CLUSTERED ([entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

