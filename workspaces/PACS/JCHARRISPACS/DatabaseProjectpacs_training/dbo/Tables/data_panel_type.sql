CREATE TABLE [dbo].[data_panel_type] (
    [page_type_id] INT           IDENTITY (1, 1) NOT NULL,
    [name]         VARCHAR (32)  NOT NULL,
    [subsegment]   VARCHAR (255) NULL,
    CONSTRAINT [CPK_data_panel_type] PRIMARY KEY CLUSTERED ([page_type_id] ASC) WITH (FILLFACTOR = 100)
);


GO

