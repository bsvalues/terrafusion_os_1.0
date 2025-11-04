CREATE TABLE [dbo].[pp_appr_meth_cd] (
    [meth_code]        CHAR (4)     NOT NULL,
    [meth_description] VARCHAR (15) NULL,
    [seg_type]         CHAR (2)     NOT NULL,
    [is_default]       CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_appr_meth_cd] PRIMARY KEY CLUSTERED ([meth_code] ASC, [seg_type] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_appr_meth_cd_delete_insert_update_MemTable
on pp_appr_meth_cd
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
where szTableName = 'pp_appr_meth_cd'

GO

