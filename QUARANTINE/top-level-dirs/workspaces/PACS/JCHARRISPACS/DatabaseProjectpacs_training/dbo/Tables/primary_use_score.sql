CREATE TABLE [dbo].[primary_use_score] (
    [primary_use_cd] NCHAR (10)  NOT NULL,
    [is_primary]     BIT         NOT NULL,
    [points]         VARCHAR (4) NOT NULL
);


GO


create trigger tr_primary_use_score_delete_insert_update_MemTable
on primary_use_score
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
where szTableName = 'primary_use_score'

GO

