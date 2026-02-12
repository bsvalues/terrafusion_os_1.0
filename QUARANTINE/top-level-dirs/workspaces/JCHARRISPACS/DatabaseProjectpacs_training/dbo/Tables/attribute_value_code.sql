CREATE TABLE [dbo].[attribute_value_code] (
    [characteristic_cd] VARCHAR (10)    NOT NULL,
    [attribute_cd]      VARCHAR (20)    NOT NULL,
    [attribute_desc]    VARCHAR (50)    NOT NULL,
    [acres]             NUMERIC (18, 4) CONSTRAINT [CDF_attribute_value_code_acres] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_attribute_value_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC, [attribute_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_attribute_value_code_characteristic_cd] FOREIGN KEY ([characteristic_cd]) REFERENCES [dbo].[characteristic_value_code] ([characteristic_cd])
);


GO


create trigger tr_attribute_value_code_delete_insert_update_MemTable
on attribute_value_code
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
where szTableName = 'attribute_value_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Maximum # of Acres for a Primary Zoning Area', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'attribute_value_code', @level2type = N'COLUMN', @level2name = N'acres';


GO

