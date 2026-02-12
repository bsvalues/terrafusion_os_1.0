CREATE TABLE [dbo].[cash_drawer] (
    [drawer_id]               INT             NOT NULL,
    [description]             VARCHAR (30)    NOT NULL,
    [user_id]                 INT             NOT NULL,
    [created_by_user_id]      INT             NOT NULL,
    [created_dt]              DATETIME        NOT NULL,
    [comment]                 VARCHAR (160)   NULL,
    [assigned_cash_amount]    NUMERIC (14, 2) NOT NULL,
    [open_cash_amount]        NUMERIC (14, 2) NOT NULL,
    [check_total]             NUMERIC (14, 2) NOT NULL,
    [money_order_total]       NUMERIC (14, 2) NOT NULL,
    [eft_total]               NUMERIC (14, 2) NOT NULL,
    [credit_card_total]       NUMERIC (14, 2) NOT NULL,
    [internal]                NUMERIC (14, 2) NOT NULL,
    [close_dt]                DATETIME        NULL,
    [open_pennies]            INT             NOT NULL,
    [open_nickels]            INT             NOT NULL,
    [open_dimes]              INT             NOT NULL,
    [open_quarters]           INT             NOT NULL,
    [open_half_dollar_coins]  INT             NOT NULL,
    [open_dollar_coins]       INT             NOT NULL,
    [open_ones]               INT             NOT NULL,
    [open_twos]               INT             NOT NULL,
    [open_fives]              INT             NOT NULL,
    [open_tens]               INT             NOT NULL,
    [open_twenties]           INT             NOT NULL,
    [open_fifties]            INT             NOT NULL,
    [open_hundreds]           INT             NOT NULL,
    [close_pennies]           INT             NOT NULL,
    [close_nickels]           INT             NOT NULL,
    [close_dimes]             INT             NOT NULL,
    [close_quarters]          INT             NOT NULL,
    [close_half_dollar_coins] INT             NOT NULL,
    [close_dollar_coins]      INT             NOT NULL,
    [close_ones]              INT             NOT NULL,
    [close_twos]              INT             NOT NULL,
    [close_fives]             INT             NOT NULL,
    [close_tens]              INT             NOT NULL,
    [close_twenties]          INT             NOT NULL,
    [close_fifties]           INT             NOT NULL,
    [close_hundreds]          INT             NOT NULL,
    [close_cash_pickup]       NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [deposit_date]            DATETIME        NULL,
    [exported]                BIT             NULL,
    [balance_dt]              DATETIME        NULL,
    [close_total]             AS              (CONVERT([numeric](16,2),((((((((((((((((([check_total]+[money_order_total])+[eft_total])+[credit_card_total])+[internal])+[close_pennies]*(0.01))+[close_nickels]*(0.05))+[close_dimes]*(0.10))+[close_quarters]*(0.25))+[close_half_dollar_coins]*(0.50))+[close_dollar_coins])+[close_ones])+[close_twos]*(2))+[close_fives]*(5))+[close_tens]*(10))+[close_twenties]*(20))+[close_fifties]*(50))+[close_hundreds]*(100))-[open_cash_amount],0)),
    [nonUSchecks_total]       NUMERIC (14, 2) CONSTRAINT [CDF_cash_drawer_nonUSchecks_total] DEFAULT ((0)) NOT NULL,
    [cmi_bank_code]           VARCHAR (10)    NULL,
    CONSTRAINT [CPK_cash_drawer] PRIMARY KEY CLUSTERED ([drawer_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [FK_Bank_Code] FOREIGN KEY ([cmi_bank_code]) REFERENCES [dbo].[cmi_bank] ([code])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Non US Check Funds Total', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'cash_drawer', @level2type = N'COLUMN', @level2name = N'nonUSchecks_total';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'foreign key referencing cmi_bank.code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'cash_drawer', @level2type = N'COLUMN', @level2name = N'cmi_bank_code';


GO

