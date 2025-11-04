CREATE TABLE [dbo].[fee_type] (
    [fee_type_cd]            VARCHAR (10)    NOT NULL,
    [fee_type_desc]          VARCHAR (60)    NULL,
    [fee_type_amt]           NUMERIC (14, 2) NULL,
    [allow_partial_payments] BIT             NULL,
    [include_on_tax_cert]    BIT             NULL,
    [reet_fee_type]          BIT             NULL,
    [allow_half_pay]         BIT             CONSTRAINT [CDF_fee_type_allow_half_pay] DEFAULT ((0)) NOT NULL,
    [technology_fee]         BIT             CONSTRAINT [CDF_fee_type_technology_fee] DEFAULT ((0)) NOT NULL,
    [state_level]            BIT             CONSTRAINT [CDF_fee_type_state_level] DEFAULT ((0)) NOT NULL,
    [local_level_1]          BIT             CONSTRAINT [CDF_fee_type_local_level_1] DEFAULT ((0)) NOT NULL,
    [local_level_2]          BIT             CONSTRAINT [CDF_fee_type_local_level_2] DEFAULT ((0)) NOT NULL,
    [inactive]               BIT             CONSTRAINT [CDF_fee_type_inactive] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_fee_type] PRIMARY KEY CLUSTERED ([fee_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_fee_type_delete_insert_update_MemTable
on fee_type
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
where szTableName = 'fee_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates Type is a Technology Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'technology_fee';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates the style of Technology Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'state_level';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag for setting fee types inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'inactive';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if fees of this type can be made in half payments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'allow_half_pay';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates the style of Technology Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'local_level_2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates the style of Technology Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_type', @level2type = N'COLUMN', @level2name = N'local_level_1';


GO

