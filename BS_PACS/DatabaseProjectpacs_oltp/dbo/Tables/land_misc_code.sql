CREATE TABLE [dbo].[land_misc_code] (
    [misc_cd]   VARCHAR (6)  NOT NULL,
    [misc_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_land_misc_code] PRIMARY KEY CLUSTERED ([misc_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_land_misc_code_delete_insert_update_MemTable
on land_misc_code
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
where szTableName = 'land_misc_code'

GO

