CREATE TABLE [dbo].[attribute] (
    [imprv_attr_id]      INT          NOT NULL,
    [imprv_attr_desc]    VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [cCompSalesAdjust]   CHAR (1)     CONSTRAINT [CDF_attribute_cCompSalesAdjust] DEFAULT ('F') NOT NULL,
    [bModifierFactor]    BIT          CONSTRAINT [CDF_attribute_bModifierFactor] DEFAULT (0) NOT NULL,
    [bStoriesMultiplier] BIT          NULL,
    [web_export]         BIT          CONSTRAINT [CDF_attribute_web_export] DEFAULT ((1)) NOT NULL,
    [rc_type]            CHAR (1)     NULL,
    [inactive_flag]      BIT          CONSTRAINT [CDF_attribute_inactive_flag] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_attribute] PRIMARY KEY CLUSTERED ([imprv_attr_id] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_attribute_delete_insert_update_MemTable
on attribute
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
where szTableName = 'attribute'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'attribute', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Inactive flag. When set Code is not availabe in PACS Client', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'attribute', @level2type = N'COLUMN', @level2name = N'inactive_flag';


GO

