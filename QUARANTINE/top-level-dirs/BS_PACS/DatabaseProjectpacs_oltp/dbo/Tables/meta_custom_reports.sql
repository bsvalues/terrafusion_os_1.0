CREATE TABLE [dbo].[meta_custom_reports] (
    [report_id]    INT           IDENTITY (1, 1) NOT NULL,
    [report_title] VARCHAR (255) NOT NULL,
    [author]       VARCHAR (255) NULL,
    [description]  VARCHAR (MAX) NULL,
    [filename]     VARCHAR (255) NOT NULL,
    [use_sql_dss]  CHAR (10)     NULL,
    [published]    CHAR (10)     NULL,
    CONSTRAINT [CPK_meta_custom_reports] PRIMARY KEY CLUSTERED ([report_id] ASC),
    CONSTRAINT [CUQ_meta_custom_reports_filename] UNIQUE NONCLUSTERED ([filename] ASC)
);


GO

CREATE trigger [tr_meta_custom_reports_delete_insert_update_MemTable]
on [dbo].[meta_custom_reports]
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'meta_custom_reports'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'This is the filename choosen by the user and must be unique.  It is required.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_custom_reports', @level2type = N'COLUMN', @level2name = N'filename';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Report title pulled from the *.rpt file - this is required', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_custom_reports', @level2type = N'COLUMN', @level2name = N'report_title';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'This is the report author pulled from the *.rpt file.  This field is not required.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_custom_reports', @level2type = N'COLUMN', @level2name = N'author';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Pulled from the *.rpt file and not required.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_custom_reports', @level2type = N'COLUMN', @level2name = N'description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Unique report id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_custom_reports', @level2type = N'COLUMN', @level2name = N'report_id';


GO

