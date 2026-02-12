CREATE TABLE [dbo].[fin_vendor] (
    [fin_vendor_id]     INT          NOT NULL,
    [fms_vendor_id]     VARCHAR (15) NOT NULL,
    [fms_vendor_name]   VARCHAR (80) NOT NULL,
    [active]            BIT          NOT NULL,
    [fms_vendor_number] VARCHAR (30) NOT NULL,
    [create_date]       DATETIME     NOT NULL,
    [last_update_date]  DATETIME     NULL,
    CONSTRAINT [CPK_fin_vendor] PRIMARY KEY CLUSTERED ([fin_vendor_id] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_fin_vendor_delete_insert_update_MemTable
on fin_vendor
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
where szTableName = 'fin_vendor'

GO

