CREATE TABLE [dbo].[fin_vendor_site] (
    [fin_vendor_site_id]   INT          NOT NULL,
    [fin_vendor_id]        INT          NOT NULL,
    [fms_vendor_site_id]   VARCHAR (15) NOT NULL,
    [fms_vendor_site_code] VARCHAR (15) NOT NULL,
    [active]               BIT          NOT NULL,
    CONSTRAINT [CPK_fin_vendor_site] PRIMARY KEY CLUSTERED ([fin_vendor_site_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fin_vendor_site_fin_vendor_id] FOREIGN KEY ([fin_vendor_id]) REFERENCES [dbo].[fin_vendor] ([fin_vendor_id])
);


GO


create trigger tr_fin_vendor_site_delete_insert_update_MemTable
on fin_vendor_site
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
where szTableName = 'fin_vendor_site'

GO

