CREATE TABLE [dbo].[data_workflow_page] (
    [page_id]     INT            IDENTITY (1, 1) NOT NULL,
    [workflow_id] INT            NOT NULL,
    [page_order]  INT            NOT NULL,
    [name]        VARCHAR (50)   NOT NULL,
    [layout]      VARCHAR (7500) NOT NULL,
    CONSTRAINT [CPK_data_workflow_page] PRIMARY KEY CLUSTERED ([workflow_id] ASC, [page_order] ASC) WITH (FILLFACTOR = 100)
);


GO

