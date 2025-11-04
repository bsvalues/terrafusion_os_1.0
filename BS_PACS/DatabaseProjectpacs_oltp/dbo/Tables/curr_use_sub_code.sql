CREATE TABLE [dbo].[curr_use_sub_code] (
    [sub_cd]      VARCHAR (10) NOT NULL,
    [sub_desc]    VARCHAR (30) NOT NULL,
    [curr_use_cd] CHAR (5)     NOT NULL,
    CONSTRAINT [CPK_curr_use_sub_code] PRIMARY KEY CLUSTERED ([sub_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_curr_use_sub_code_curr_use_cd] FOREIGN KEY ([curr_use_cd]) REFERENCES [dbo].[ag_use] ([ag_use_cd])
);


GO


create trigger tr_curr_use_sub_code_delete_insert_update_MemTable
on curr_use_sub_code
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
where szTableName = 'curr_use_sub_code'

GO

