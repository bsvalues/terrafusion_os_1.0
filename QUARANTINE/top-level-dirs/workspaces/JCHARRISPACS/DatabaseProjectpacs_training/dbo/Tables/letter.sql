CREATE TABLE [dbo].[letter] (
    [letter_id]     INT           NOT NULL,
    [letter_name]   VARCHAR (63)  NOT NULL,
    [letter_desc]   VARCHAR (255) NOT NULL,
    [event_type_cd] VARCHAR (20)  NULL,
    [create_dt]     DATETIME      NOT NULL,
    [letter_type]   VARCHAR (15)  NOT NULL,
    [letter_copies] INT           NOT NULL,
    [system_type]   CHAR (1)      NULL,
    CONSTRAINT [CPK_letter] PRIMARY KEY CLUSTERED ([letter_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_letter_delete_insert_update_MemTable
on letter
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
where szTableName = 'letter'

GO

