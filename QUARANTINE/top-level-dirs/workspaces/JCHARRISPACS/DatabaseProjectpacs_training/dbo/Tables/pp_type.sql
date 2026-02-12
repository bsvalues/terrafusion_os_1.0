CREATE TABLE [dbo].[pp_type] (
    [pp_type_cd]            CHAR (10)    NOT NULL,
    [pp_type_desc]          VARCHAR (50) NOT NULL,
    [vit_flag]              CHAR (1)     NULL,
    [sys_flag]              CHAR (1)     NULL,
    [asset_listing_type_cd] CHAR (1)     NULL,
    [classification]        VARCHAR (5)  NULL,
    [abstract_type]         VARCHAR (10) NULL,
    CONSTRAINT [CPK_pp_type] PRIMARY KEY CLUSTERED ([pp_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_pp_type_delete_insert_update_MemTable
on pp_type
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
where szTableName = 'pp_type'

GO

