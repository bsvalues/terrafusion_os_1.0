CREATE TABLE [dbo].[streets] (
    [street_name]   VARCHAR (50)   NOT NULL,
    [street_prefix] VARCHAR (10)   NULL,
    [street_sufix]  VARCHAR (10)   NULL,
    [date_added]    DATETIME       NULL,
    [street_id]     INT            NOT NULL,
    [comment]       VARCHAR (1000) NULL,
    CONSTRAINT [CPK_streets] PRIMARY KEY CLUSTERED ([street_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_streets_street_name_street_prefix_street_sufix] UNIQUE NONCLUSTERED ([street_name] ASC, [street_prefix] ASC, [street_sufix] ASC) WITH (FILLFACTOR = 90)
);


GO

create trigger tr_streets_delete_insert_update_MemTable
on dbo.streets
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
where szTableName = 'streets'

GO

