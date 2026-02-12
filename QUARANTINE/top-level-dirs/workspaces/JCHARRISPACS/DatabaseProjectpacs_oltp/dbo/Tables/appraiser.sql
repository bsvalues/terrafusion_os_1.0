CREATE TABLE [dbo].[appraiser] (
    [appraiser_id]        INT          NOT NULL,
    [appraiser_nm]        VARCHAR (40) NOT NULL,
    [appraiser_full_name] VARCHAR (75) NULL,
    [inactive]            VARCHAR (1)  NULL,
    [sys_flag]            BIT          CONSTRAINT [CDF_appraiser_sys_flag] DEFAULT ((0)) NOT NULL,
    [pacs_user_id]        INT          NULL,
    CONSTRAINT [CPK_appraiser] PRIMARY KEY CLUSTERED ([appraiser_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_appraiser_nm]
    ON [dbo].[appraiser]([appraiser_nm] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_appraiser_delete_insert_update_MemTable
on appraiser
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
where szTableName = 'appraiser'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'System Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'appraiser', @level2type = N'COLUMN', @level2name = N'sys_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS User ID associated with the Appraiser ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'appraiser', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

