CREATE TABLE [dbo].[bill_calc_type] (
    [bill_calc_type_cd]   VARCHAR (10) NOT NULL,
    [bill_calc_type_desc] VARCHAR (50) NULL,
    [modify_wizard]       BIT          CONSTRAINT [CDF_modify_wizard] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_bill_calc_type] PRIMARY KEY CLUSTERED ([bill_calc_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

create trigger [dbo].[tr_bill_calc_type_delete_insert_update_MemTable]
on [dbo].[bill_calc_type]
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
where szTableName = 'bill_calc_type'

GO

