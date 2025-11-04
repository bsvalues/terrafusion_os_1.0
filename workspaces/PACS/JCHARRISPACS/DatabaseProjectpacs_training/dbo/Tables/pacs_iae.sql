CREATE TABLE [dbo].[pacs_iae] (
    [iae_id]        INT          IDENTITY (1, 1) NOT NULL,
    [parent_id]     INT          NULL,
    [short_name]    VARCHAR (16) NULL,
    [description]   VARCHAR (32) NULL,
    [export_sp]     VARCHAR (32) NULL,
    [import_sp]     VARCHAR (32) NULL,
    [header_file]   VARCHAR (16) NULL,
    [delimiter]     VARCHAR (2)  NULL,
    [export_report] VARCHAR (32) NULL,
    [import_report] VARCHAR (32) NULL,
    CONSTRAINT [CPK_pacs_iae] PRIMARY KEY CLUSTERED ([iae_id] ASC) WITH (FILLFACTOR = 100)
);


GO

