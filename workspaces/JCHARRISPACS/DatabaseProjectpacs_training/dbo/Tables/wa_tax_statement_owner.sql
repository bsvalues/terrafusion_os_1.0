CREATE TABLE [dbo].[wa_tax_statement_owner] (
    [group_id]                   INT             NOT NULL,
    [year]                       NUMERIC (4)     NOT NULL,
    [run_id]                     INT             NOT NULL,
    [owner_id]                   INT             NOT NULL,
    [owner_name]                 VARCHAR (70)    NULL,
    [total_taxable_value]        NUMERIC (18)    NULL,
    [voter_approved_tax_amount]  NUMERIC (18, 2) NULL,
    [half_due_date]              DATETIME        NULL,
    [half_tax_amount]            NUMERIC (18, 2) NULL,
    [half_penalty_amount]        NUMERIC (18, 2) NULL,
    [half_interest_amount]       NUMERIC (18, 2) NULL,
    [half_total_due]             NUMERIC (18, 2) NULL,
    [full_due_date]              DATETIME        NULL,
    [full_tax_amount]            NUMERIC (18, 2) NULL,
    [full_penalty_amount]        NUMERIC (18, 2) NULL,
    [full_interest_amount]       NUMERIC (18, 2) NULL,
    [full_total_due]             NUMERIC (18, 2) NULL,
    [prior_year_0_tax_amount]    NUMERIC (18, 2) NULL,
    [prior_year_0_interest]      NUMERIC (18, 2) NULL,
    [prior_year_0_penalty]       NUMERIC (18, 2) NULL,
    [prior_year_1_tax_amount]    NUMERIC (18, 2) NULL,
    [prior_year_1_interest]      NUMERIC (18, 2) NULL,
    [prior_year_1_penalty]       NUMERIC (18, 2) NULL,
    [prior_year_delq_tax_amount] NUMERIC (18, 2) NULL,
    [prior_year_delq_interest]   NUMERIC (18, 2) NULL,
    [prior_year_delq_penalty]    NUMERIC (18, 2) NULL,
    [delinquent_tax_amount]      NUMERIC (18, 2) NULL,
    [delinquent_interest]        NUMERIC (18, 2) NULL,
    [delinquent_penalty]         NUMERIC (18, 2) NULL,
    [delinquent_total_due]       NUMERIC (18, 2) NULL,
    [total_due]                  NUMERIC (18, 2) NULL,
    [gross_tax]                  NUMERIC (18, 2) NULL,
    [addr_line1]                 VARCHAR (60)    NULL,
    [addr_line2]                 VARCHAR (60)    NULL,
    [addr_line3]                 VARCHAR (60)    NULL,
    [addr_city]                  VARCHAR (50)    NULL,
    [addr_state]                 VARCHAR (50)    NULL,
    [addr_country]               VARCHAR (50)    NULL,
    [addr_zip]                   VARCHAR (10)    NULL,
    [addr_is_international]      BIT             NULL,
    [addr_is_deliverable]        BIT             NULL,
    [scanline]                   VARCHAR (78)    NULL,
    [property_count]             INT             NULL,
    [show_half_pay_line]         BIT             NULL,
    [generated_by]               VARCHAR (50)    NULL,
    [scanline2]                  VARCHAR (78)    NULL,
    [carrier_route]              VARCHAR (5)     NULL,
    CONSTRAINT [CPK_wa_tax_statement_owner] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_owner_group_id_year_run_id] FOREIGN KEY ([group_id], [year], [run_id]) REFERENCES [dbo].[wa_tax_statement_run] ([group_id], [year], [run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'tax statement route', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_owner', @level2type = N'COLUMN', @level2name = N'carrier_route';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Text for OCR Scanline for second-half coupon for taxpayer statements', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_owner', @level2type = N'COLUMN', @level2name = N'scanline2';


GO

