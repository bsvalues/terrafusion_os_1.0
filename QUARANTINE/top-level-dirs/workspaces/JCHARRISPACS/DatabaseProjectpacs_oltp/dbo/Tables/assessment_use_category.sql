CREATE TABLE [dbo].[assessment_use_category] (
    [assessment_use_cd]   VARCHAR (10)  NOT NULL,
    [assessment_use_desc] VARCHAR (200) NOT NULL,
    [sys_flag]            BIT           NULL,
    CONSTRAINT [CPK_assessment_use_category] PRIMARY KEY CLUSTERED ([assessment_use_cd] ASC)
);


GO


create trigger tr_assessment_use_category_delete_insert_update_MemTable
on assessment_use_category
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
where szTableName = 'assessment_use_category'

GO

