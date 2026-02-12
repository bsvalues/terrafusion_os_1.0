CREATE TABLE [dbo].[imprv_type] (
    [imprv_type_cd]        CHAR (5)     NOT NULL,
    [imprv_type_desc]      VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [mobile_home]          CHAR (1)     NULL,
    [bAllowDetailUseBase]  BIT          CONSTRAINT [CDF_imprv_type_bAllowDetailUseBase] DEFAULT (0) NOT NULL,
    [bMultiplyStoriesSQFT] BIT          NULL,
    [bMultiSalePrimary]    BIT          CONSTRAINT [CDF_imprv_type_bMultiSalePrimary] DEFAULT (0) NOT NULL,
    [is_permanent_crop]    BIT          CONSTRAINT [CDF_imprv_type_is_permanent_crop] DEFAULT ((0)) NOT NULL,
    [ms_type]              CHAR (1)     CONSTRAINT [CDF_imprv_type_ms_type] DEFAULT ('N') NOT NULL,
    [rc_type]              CHAR (1)     NULL,
    CONSTRAINT [CPK_imprv_type] PRIMARY KEY CLUSTERED ([imprv_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_imprv_type_delete_insert_update_MemTable
on imprv_type
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
where szTableName = 'imprv_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_type', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Marshall/Swift Calculation Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_type', @level2type = N'COLUMN', @level2name = N'ms_type';


GO

