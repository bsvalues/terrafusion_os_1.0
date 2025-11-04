CREATE TABLE [dbo].[reet_webportal_import] (
    [webportal_id]           VARCHAR (10)    NOT NULL,
    [agency_id]              DECIMAL (4)     NOT NULL,
    [partial_sale]           BIT             NOT NULL,
    [exemption_claimed]      BIT             NOT NULL,
    [imp_forestland_flag]    BIT             NOT NULL,
    [imp_current_use_flag]   BIT             NOT NULL,
    [imp_historic_flag]      BIT             NOT NULL,
    [imp_continuance_flag]   BIT             NOT NULL,
    [imp_open_space_flag]    BIT             NOT NULL,
    [pers_prop_description]  VARCHAR (140)   NOT NULL,
    [wac_number_type_cd]     VARCHAR (32)    NULL,
    [wac_reason]             VARCHAR (100)   NULL,
    [instrument_type_cd]     CHAR (10)       NULL,
    [sale_date]              DATETIME        NOT NULL,
    [sale_price]             NUMERIC (11, 2) NOT NULL,
    [pers_prop_val]          NUMERIC (11, 2) NULL,
    [exemption_amount]       NUMERIC (11, 2) NULL,
    [taxable_selling_price]  NUMERIC (11, 2) NOT NULL,
    [imp_city]               VARCHAR (150)   NOT NULL,
    [legal_desc]             VARCHAR (MAX)   NOT NULL,
    [transaction_date]       DATETIME        NOT NULL,
    [excise_number]          INT             NULL,
    [url_image]              VARCHAR (255)   NOT NULL,
    [excise_amount]          NUMERIC (11, 2) NULL,
    [excise_PandI]           NUMERIC (11, 2) NULL,
    [excise_fees]            NUMERIC (11, 2) NULL,
    [receipt_number]         INT             NULL,
    [property_tax]           NUMERIC (11, 2) NULL,
    [property_PandI]         NUMERIC (11, 2) NULL,
    [batch_balance_date]     DATETIME        NULL,
    [paid_by]                VARCHAR (70)    NULL,
    [pacs_user]              VARCHAR (50)    NULL,
    [error]                  VARCHAR (255)   NULL,
    [REET_id]                INT             NULL,
    [status]                 VARCHAR (25)    NULL,
    [status_change_date]     DATETIME        NULL,
    [total_amount]           NUMERIC (11, 2) NULL,
    [pacs_user_id]           INT             NULL,
    [assigned_user_name]     VARCHAR (30)    NULL,
    [imp_timber_ag_flag]     BIT             CONSTRAINT [CDF_reet_webportal_import_imp_timber_ag_flag] DEFAULT ((0)) NOT NULL,
    [imp_multiple_locations] BIT             CONSTRAINT [CDF_reet_webportal_import_imp_multiple_locations] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_reet_webportal_import] PRIMARY KEY CLUSTERED ([webportal_id] ASC) WITH (FILLFACTOR = 90)
);


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import] TO [simplifile]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import] TO [simplifile]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import] TO PUBLIC
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import] TO [simplifile]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import] TO PUBLIC
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import] TO PUBLIC
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import] TO [simplifile]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import] TO PUBLIC
    AS [dbo];


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS user id who import this record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_webportal_import', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'assigned/matchging PACS user name of this import record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_webportal_import', @level2type = N'COLUMN', @level2name = N'assigned_user_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Predominant Use Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_webportal_import', @level2type = N'COLUMN', @level2name = N'imp_timber_ag_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Multi Loc Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_webportal_import', @level2type = N'COLUMN', @level2name = N'imp_multiple_locations';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Totals excise and property taxes, interest and penalties, and fees.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_webportal_import', @level2type = N'COLUMN', @level2name = N'total_amount';


GO

