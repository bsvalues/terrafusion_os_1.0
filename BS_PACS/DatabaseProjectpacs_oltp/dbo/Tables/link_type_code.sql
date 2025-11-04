CREATE TABLE [dbo].[link_type_code] (
    [prop_link_type_cd]   VARCHAR (5)  NOT NULL,
    [prop_link_type_desc] VARCHAR (20) NOT NULL,
    [notify_when_present] BIT          CONSTRAINT [CDF_link_type_code_notify_when_present] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_link_type_code] PRIMARY KEY CLUSTERED ([prop_link_type_cd] ASC)
);


GO


create trigger tr_link_type_code_delete_insert_update_MemTable
on link_type_code
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
where szTableName = 'link_type_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To display Linked properties warning in Property View', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'link_type_code', @level2type = N'COLUMN', @level2name = N'notify_when_present';


GO

