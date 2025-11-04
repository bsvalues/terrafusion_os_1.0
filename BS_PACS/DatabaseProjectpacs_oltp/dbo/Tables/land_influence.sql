CREATE TABLE [dbo].[land_influence] (
    [szLandInfluenceCode] VARCHAR (10) NOT NULL,
    [szLandInfluenceDesc] VARCHAR (64) NOT NULL,
    [rc_type]             CHAR (1)     NULL,
    CONSTRAINT [CPK_land_influence] PRIMARY KEY CLUSTERED ([szLandInfluenceCode] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_land_influence_delete_insert_update_MemTable
on land_influence
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
where szTableName = 'land_influence'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_influence', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

