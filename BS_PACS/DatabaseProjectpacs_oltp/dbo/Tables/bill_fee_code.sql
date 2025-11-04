CREATE TABLE [dbo].[bill_fee_code] (
    [bill_fee_cd]               VARCHAR (10)   NOT NULL,
    [bill_fee_desc]             VARCHAR (50)   NOT NULL,
    [deferral_cd]               CHAR (1)       NULL,
    [alert_user]                CHAR (1)       NULL,
    [use_penalty]               CHAR (1)       NULL,
    [penalty_rate]              NUMERIC (9, 6) NULL,
    [use_interest]              CHAR (1)       NULL,
    [interest_rate]             NUMERIC (9, 6) NULL,
    [use_attorney_fee]          CHAR (1)       NULL,
    [attorney_fee_rate]         NUMERIC (4)    NULL,
    [use_range]                 CHAR (1)       NULL,
    [begin_range]               NUMERIC (4)    NULL,
    [end_range]                 NUMERIC (4)    NULL,
    [sys_flag]                  CHAR (1)       NULL,
    [judgement_cd]              CHAR (1)       NULL,
    [partial_payment_indicator] CHAR (1)       NOT NULL,
    [force_full_pay]            BIT            CONSTRAINT [CDF_bill_fee_code_force_full_pay] DEFAULT ((0)) NOT NULL,
    [display_on_warning_panel]  BIT            NULL,
    [bankruptcy]                BIT            CONSTRAINT [CDF_bill_fee_code_bankruptcy] DEFAULT ((0)) NOT NULL,
    [deferral]                  BIT            CONSTRAINT [CDF_bill_fee_code_deferral] DEFAULT ((0)) NOT NULL,
    [mh_movement]               BIT            CONSTRAINT [CDF_bill_fee_code_mh_movement] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_bill_fee_code] PRIMARY KEY CLUSTERED ([bill_fee_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK__bill_fee_code__partial_payment_indicator] CHECK ([partial_payment_indicator]='T' OR [partial_payment_indicator]='F')
);


GO


create trigger [dbo].[tr_bill_fee_code_delete_insert_update_MemTable]
on [dbo].[bill_fee_code]
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
where szTableName = 'bill_fee_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'identifies that the code is for a deferral', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_fee_code', @level2type = N'COLUMN', @level2name = N'deferral';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates whether bill/fee code will be displayed on property''s warning panel when code is present on a bill/fee for the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_fee_code', @level2type = N'COLUMN', @level2name = N'display_on_warning_panel';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Identifies a MH Movement code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_fee_code', @level2type = N'COLUMN', @level2name = N'mh_movement';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'identifies that the code is for a bankruptcy', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_fee_code', @level2type = N'COLUMN', @level2name = N'bankruptcy';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column forces any bill or fee with this code to stay in Full pay in mass statement processes', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_fee_code', @level2type = N'COLUMN', @level2name = N'force_full_pay';


GO

