CREATE TABLE [dbo].[property_audit_trail] (
    [pacs_user_id]         INT             NULL,
    [prop_id]              INT             NULL,
    [audit_date]           DATETIME        NULL,
    [type]                 VARCHAR (50)    NULL,
    [action]               VARCHAR (100)   NULL,
    [action_user_id]       INT             NULL,
    [trans_id]             INT             NULL,
    [base_tax_trans_amt]   NUMERIC (14, 2) NULL,
    [trans_amt]            NUMERIC (14, 2) NULL,
    [prop_val_yr]          NUMERIC (4)     NULL,
    [lKey]                 INT             IDENTITY (1, 1) NOT NULL,
    [report_print_balance] NUMERIC (14, 2) NULL,
    [bill_type_cd]         VARCHAR (10)    NULL,
    [modify_reason]        VARCHAR (50)    CONSTRAINT [CDF_property_audit_trail_modify_reason] DEFAULT ('') NULL,
    [batch_id]             INT             NULL,
    CONSTRAINT [CPK_property_audit_trail] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bill/Fee modify reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_audit_trail', @level2type = N'COLUMN', @level2name = N'modify_reason';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bill Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_audit_trail', @level2type = N'COLUMN', @level2name = N'bill_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'holds transaction batch id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_audit_trail', @level2type = N'COLUMN', @level2name = N'batch_id';


GO

