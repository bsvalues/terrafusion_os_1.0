CREATE TABLE [dbo].[reet_type_fee] (
    [reet_type_cd] VARCHAR (12) NOT NULL,
    [fee_type_cd]  VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_reet_type_fee] PRIMARY KEY CLUSTERED ([reet_type_cd] ASC, [fee_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_reet_type_fee_fee_type_cd] FOREIGN KEY ([fee_type_cd]) REFERENCES [dbo].[fee_type] ([fee_type_cd]),
    CONSTRAINT [CFK_reet_type_fee_reet_type_cd] FOREIGN KEY ([reet_type_cd]) REFERENCES [dbo].[reet_type_code] ([reet_type_cd])
);


GO


create trigger tr_reet_type_fee_delete_insert_update_MemTable
on reet_type_fee
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
where szTableName = 'reet_type_fee'

GO

