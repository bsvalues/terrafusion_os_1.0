CREATE TABLE [dbo].[special_assessment_status_cd] (
    [status_cd]   VARCHAR (10) NOT NULL,
    [status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_special_assessment_status_cd] PRIMARY KEY CLUSTERED ([status_cd] ASC)
);


GO


create trigger tr_special_assessment_status_cd_delete_insert_update_MemTable
on special_assessment_status_cd
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
where szTableName = 'special_assessment_status_cd'

GO

