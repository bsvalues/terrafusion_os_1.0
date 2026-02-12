CREATE TABLE [dbo].[data_workflow] (
    [workflow_id] INT          IDENTITY (1, 1) NOT NULL,
    [name]        VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_data_workflow] PRIMARY KEY CLUSTERED ([workflow_id] ASC) WITH (FILLFACTOR = 100)
);


GO

