CREATE TABLE [dbo].[tax_district_type] (
    [tax_district_type_cd] VARCHAR (10) NOT NULL,
    [tax_district_desc]    VARCHAR (50) NULL,
    [sys_flag]             BIT          NULL,
    [priority]             INT          NOT NULL,
    [is_city]              BIT          CONSTRAINT [CDF_tax_district_type_is_city] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_tax_district_type] PRIMARY KEY CLUSTERED ([tax_district_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_tax_district_type_delete_insert_update_MemTable
on tax_district_type
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
where szTableName = 'tax_district_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Represents if the tax district is a cty tax district', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district_type', @level2type = N'COLUMN', @level2name = N'is_city';


GO

