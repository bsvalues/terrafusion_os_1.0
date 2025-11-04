CREATE TABLE [dbo].[building_permit_import_error] (
    [run_id]      INT           NOT NULL,
    [record_id]   INT           NOT NULL,
    [error_id]    INT           NOT NULL,
    [property_id] VARCHAR (12)  NULL,
    [tidemark_id] VARCHAR (15)  NULL,
    [permit_date] DATETIME      NULL,
    [permit_num]  VARCHAR (30)  NULL,
    [error_desc]  VARCHAR (255) NULL,
    CONSTRAINT [CPK_building_permit_import_error] PRIMARY KEY CLUSTERED ([run_id] ASC, [record_id] ASC, [error_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_building_permit_import_error_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_building_permit] ([run_id])
);


GO

