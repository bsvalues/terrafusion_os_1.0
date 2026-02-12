CREATE TABLE [dbo].[assessment_type] (
    [assessment_type_cd] VARCHAR (50) NOT NULL,
    [assessment_desc]    VARCHAR (50) NOT NULL,
    [sys_flag]           BIT          NOT NULL,
    CONSTRAINT [CPK_assessment_type] PRIMARY KEY CLUSTERED ([assessment_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_assessment_type_delete_insert_update_MemTable
on assessment_type
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
where szTableName = 'assessment_type'

GO

