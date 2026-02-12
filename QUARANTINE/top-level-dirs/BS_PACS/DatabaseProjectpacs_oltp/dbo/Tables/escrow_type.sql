CREATE TABLE [dbo].[escrow_type] (
    [escrow_type_cd]   VARCHAR (20) NOT NULL,
    [escrow_type_desc] VARCHAR (30) NULL,
    [year]             NUMERIC (4)  NOT NULL,
    [start_date]       DATETIME     CONSTRAINT [CDF_escrow_type_start_date] DEFAULT (NULL) NULL,
    [print_cert]       BIT          CONSTRAINT [CDF_escrow_type_print_cert] DEFAULT ((0)) NOT NULL,
    [land_calculate]   BIT          CONSTRAINT [CDF_escrow_type_land_calculate] DEFAULT ((0)) NOT NULL,
    [land_percent]     INT          CONSTRAINT [CDF_escrow_type_land_percent] DEFAULT ((100)) NOT NULL,
    [land_lock]        BIT          CONSTRAINT [CDF_escrow_type_land_lock] DEFAULT ((0)) NOT NULL,
    [imprv_calculate]  BIT          CONSTRAINT [CDF_escrow_type_imprv_calculate] DEFAULT ((0)) NOT NULL,
    [imprv_percent]    INT          CONSTRAINT [CDF_escrow_type_imprv_percent] DEFAULT ((100)) NOT NULL,
    [imprv_lock]       BIT          CONSTRAINT [CDF_escrow_type_imprv_lock] DEFAULT ((0)) NOT NULL,
    [sa_calculate]     BIT          CONSTRAINT [CDF_escrow_type_sa_calculate] DEFAULT ((0)) NOT NULL,
    [sa_percent]       INT          CONSTRAINT [CDF_escrow_type_sa_percent] DEFAULT ((100)) NOT NULL,
    [sa_lock]          BIT          CONSTRAINT [CDF_escrow_type_sa_lock] DEFAULT ((0)) NOT NULL,
    [default_pay_full] BIT          CONSTRAINT [CDF_escrow_type_default_pay_full] DEFAULT ((1)) NOT NULL,
    [is_flexible]      BIT          CONSTRAINT [CDF_escrow_type_is_flexible] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_escrow_type] PRIMARY KEY CLUSTERED ([year] ASC, [escrow_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_escrow_type_delete_insert_update_MemTable
on escrow_type
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
where szTableName = 'escrow_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Percentage of improvements to include', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'imprv_percent';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Percentage of land to include', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'land_percent';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Should escrows of this type allow flexible payments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'is_flexible';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Percent of special assessments to include', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'sa_percent';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Print Plat Certification', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'print_cert';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Lock improvement values when creating an escrow of this type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'imprv_lock';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Lock land value when creating an escrow of this type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'land_lock';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Lock special assessment values when creating an escrow of this type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'sa_lock';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include land value in escrow due calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'land_calculate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Escrows of this type should default to full pay / half pay', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'default_pay_full';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include special assessment values in escrow due calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'sa_calculate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include improvement values in escrow due calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'imprv_calculate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Start date (optional)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_type', @level2type = N'COLUMN', @level2name = N'start_date';


GO

