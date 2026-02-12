CREATE TABLE [dbo].[land_type] (
    [land_type_cd]         CHAR (10)    NOT NULL,
    [land_type_desc]       VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [ag_or_wild_or_timber] CHAR (1)     NULL,
    [state_land_type_desc] VARCHAR (30) NULL,
    [is_permanent_crop]    BIT          CONSTRAINT [CDF_land_type_is_permanent_crop] DEFAULT ((0)) NOT NULL,
    [rc_type]              CHAR (1)     NULL,
    CONSTRAINT [CPK_land_type] PRIMARY KEY CLUSTERED ([land_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_land_type_delete_insert_update_MemTable
on land_type
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
where szTableName = 'land_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_type', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

