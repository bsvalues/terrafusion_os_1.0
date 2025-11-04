CREATE TABLE [dbo].[building_permit_tidemark_inspection_update_import] (
    [run_id]           INT           NOT NULL,
    [record_id]        INT           NOT NULL,
    [permit_number]    VARCHAR (30)  NULL,
    [property_id]      VARCHAR (12)  NULL,
    [inspection_code]  VARCHAR (255) NULL,
    [inspection_desc]  VARCHAR (50)  NULL,
    [inspection_date]  DATETIME      NULL,
    [percent_complete] VARCHAR (8)   NULL,
    [permit_status]    VARCHAR (5)   NULL,
    CONSTRAINT [CPK_building_permit_tidemark_inspection_update_import] PRIMARY KEY CLUSTERED ([run_id] ASC, [record_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_building_permit_tidemark_inspection_update_import_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_building_permit] ([run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Permit Status import field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_tidemark_inspection_update_import', @level2type = N'COLUMN', @level2name = N'permit_status';


GO

