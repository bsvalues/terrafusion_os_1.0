CREATE TABLE [dbo].[penalty_interest_frequency_type] (
    [penalty_interest_frequency_type_cd]   VARCHAR (5)  NOT NULL,
    [penalty_interest_frequency_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_penalty_interest_frequency_type] PRIMARY KEY CLUSTERED ([penalty_interest_frequency_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger [dbo].[tr_penalty_interest_frequency_type_delete_insert_update_MemTable]
on [dbo].[penalty_interest_frequency_type]
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
where szTableName = 'penalty_interest_frequency_type'

GO

