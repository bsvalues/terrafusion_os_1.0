CREATE TABLE [dbo].[building_permit_issuer] (
    [issuer_cd]       VARCHAR (5)   NOT NULL,
    [issuer_desc]     VARCHAR (30)  NULL,
    [url]             VARCHAR (150) NULL,
    [url_description] VARCHAR (32)  NULL,
    CONSTRAINT [CPK_building_permit_issuer] PRIMARY KEY CLUSTERED ([issuer_cd] ASC)
);


GO


create trigger tr_building_permit_issuer_delete_insert_update_MemTable
on building_permit_issuer
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
where szTableName = 'building_permit_issuer'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies the description for the URL', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_issuer', @level2type = N'COLUMN', @level2name = N'url_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies the URL for a Bldg Permit Issuer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_issuer', @level2type = N'COLUMN', @level2name = N'url';


GO

