CREATE TABLE [dbo].[condo_attribute_code] (
    [attribute_cd]      VARCHAR (10) NOT NULL,
    [attribute_desc]    VARCHAR (50) NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_condo_attribute_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC, [attribute_cd] ASC),
    CONSTRAINT [CFK_condo_attribute_code_characteristic_cd] FOREIGN KEY ([characteristic_cd]) REFERENCES [dbo].[condo_characteristic_code] ([characteristic_cd])
);


GO


create trigger tr_condo_attribute_code_delete_insert_update_MemTable
on condo_attribute_code
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
where szTableName = 'condo_attribute_code'

GO

