CREATE TABLE [dbo].[tax_district] (
    [tax_district_id]      INT          NOT NULL,
    [tax_district_cd]      VARCHAR (20) NOT NULL,
    [tax_district_desc]    VARCHAR (50) NULL,
    [tax_district_type_cd] VARCHAR (10) NOT NULL,
    [fin_vendor_id]        INT          NULL,
    [fin_vendor_site_id]   INT          NULL,
    [location_code]        VARCHAR (10) CONSTRAINT [CDF_tax_district_location_code] DEFAULT ('') NULL,
    [location_desc]        VARCHAR (30) CONSTRAINT [CDF_tax_district_location_desc] DEFAULT ('') NULL,
    CONSTRAINT [CPK_tax_district] PRIMARY KEY CLUSTERED ([tax_district_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tax_district_fin_vendor_id] FOREIGN KEY ([fin_vendor_id]) REFERENCES [dbo].[fin_vendor] ([fin_vendor_id]),
    CONSTRAINT [CFK_tax_district_fin_vendor_site_id] FOREIGN KEY ([fin_vendor_site_id]) REFERENCES [dbo].[fin_vendor_site] ([fin_vendor_site_id]),
    CONSTRAINT [CFK_tax_district_tax_district_id] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[account] ([acct_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_tax_district_tax_district_type_cd] FOREIGN KEY ([tax_district_type_cd]) REFERENCES [dbo].[tax_district_type] ([tax_district_type_cd]) ON DELETE CASCADE
);


GO



create trigger tr_tax_district_delete_insert_update_MemTable
on tax_district
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
where szTableName = 'tax_district'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Location Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district', @level2type = N'COLUMN', @level2name = N'location_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Location Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district', @level2type = N'COLUMN', @level2name = N'location_desc';


GO

