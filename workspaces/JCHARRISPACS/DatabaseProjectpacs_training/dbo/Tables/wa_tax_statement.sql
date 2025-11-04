CREATE TABLE [dbo].[wa_tax_statement] (
    [group_id]                                         INT              NOT NULL,
    [year]                                             NUMERIC (4)      NOT NULL,
    [run_id]                                           INT              NOT NULL,
    [statement_id]                                     INT              NOT NULL,
    [copy_type]                                        BIGINT           NOT NULL,
    [prop_id]                                          INT              NOT NULL,
    [owner_id]                                         INT              NOT NULL,
    [sup_num]                                          INT              NOT NULL,
    [property_type_desc]                               VARCHAR (50)     NULL,
    [tax_area_code]                                    VARCHAR (23)     NULL,
    [legal_desc]                                       VARCHAR (255)    NULL,
    [situs_display]                                    VARCHAR (141)    NULL,
    [owner_name]                                       VARCHAR (70)     NULL,
    [care_of_name]                                     VARCHAR (70)     NULL,
    [owner_addr_line1]                                 VARCHAR (60)     NULL,
    [owner_addr_line2]                                 VARCHAR (60)     NULL,
    [owner_addr_line3]                                 VARCHAR (60)     NULL,
    [owner_addr_city]                                  VARCHAR (50)     NULL,
    [owner_addr_state]                                 VARCHAR (50)     NULL,
    [owner_addr_zip]                                   VARCHAR (10)     NULL,
    [owner_addr_country]                               VARCHAR (50)     NULL,
    [owner_addr_is_deliverable]                        BIT              NOT NULL,
    [owner_addr_is_international]                      BIT              NOT NULL,
    [mailto_id]                                        INT              NULL,
    [mailto_name]                                      VARCHAR (70)     NULL,
    [mailto_addr_line1]                                VARCHAR (60)     NULL,
    [mailto_addr_line2]                                VARCHAR (60)     NULL,
    [mailto_addr_line3]                                VARCHAR (60)     NULL,
    [mailto_addr_city]                                 VARCHAR (50)     NULL,
    [mailto_addr_state]                                VARCHAR (50)     NULL,
    [mailto_addr_zip]                                  VARCHAR (10)     NULL,
    [mailto_addr_country]                              VARCHAR (50)     NULL,
    [mailto_addr_is_deliverable]                       BIT              NOT NULL,
    [mailto_addr_is_international]                     BIT              NOT NULL,
    [message_cd]                                       VARCHAR (10)     NULL,
    [prior_year_taxes_paid]                            NUMERIC (14, 2)  NULL,
    [prior_year_pi_paid]                               NUMERIC (14, 2)  NULL,
    [prior_year_value]                                 NUMERIC (14, 2)  NULL,
    [prior_year_tax_rate]                              NUMERIC (13, 10) NULL,
    [current_year_value]                               NUMERIC (14, 2)  NULL,
    [current_year_tax_rate]                            NUMERIC (13, 10) NULL,
    [total_taxes_assessments_fees]                     NUMERIC (14, 2)  NULL,
    [agent_id]                                         INT              NULL,
    [mortgage_co_id]                                   INT              NULL,
    [mortgage_company]                                 VARCHAR (70)     NULL,
    [due_date]                                         DATETIME         NULL,
    [full_tax_amount]                                  NUMERIC (14, 2)  NULL,
    [full_interest_amount]                             NUMERIC (14, 2)  NULL,
    [full_penalty_amount]                              NUMERIC (14, 2)  NULL,
    [full_total_due]                                   NUMERIC (14, 2)  NULL,
    [half_tax_amount]                                  NUMERIC (14, 2)  NULL,
    [half_interest_amount]                             NUMERIC (14, 2)  NULL,
    [half_penalty_amount]                              NUMERIC (14, 2)  NULL,
    [half_total_due]                                   NUMERIC (14, 2)  NULL,
    [delinquent_tax_amount]                            NUMERIC (14, 2)  NULL,
    [delinquent_interest_amount]                       NUMERIC (14, 2)  NULL,
    [delinquent_penalty_amount]                        NUMERIC (14, 2)  NULL,
    [delinquent_total_due]                             NUMERIC (14, 2)  NULL,
    [total_due]                                        NUMERIC (14, 2)  NULL,
    [generated_by]                                     VARCHAR (50)     NULL,
    [taxserver_id]                                     INT              NULL,
    [scanline]                                         VARCHAR (72)     NULL,
    [comparison_voted_sum_prev_levy_rate]              NUMERIC (13, 10) NULL,
    [comparison_voted_sum_prev_taxes]                  NUMERIC (14, 2)  NULL,
    [comparison_voted_sum_curr_levy_rate]              NUMERIC (13, 10) NULL,
    [comparison_voted_sum_curr_taxes]                  NUMERIC (14, 2)  NULL,
    [comparison_voted_overall_pct_change_levy_rate]    NUMERIC (14, 2)  NULL,
    [comparison_voted_overall_pct_change_taxes]        NUMERIC (14, 2)  NULL,
    [comparison_nonvoted_sum_prev_levy_rate]           NUMERIC (13, 10) NULL,
    [comparison_nonvoted_sum_prev_taxes]               NUMERIC (14, 2)  NULL,
    [comparison_nonvoted_sum_curr_levy_rate]           NUMERIC (13, 10) NULL,
    [comparison_nonvoted_sum_curr_taxes]               NUMERIC (14, 2)  NULL,
    [comparison_nonvoted_overall_pct_change_levy_rate] NUMERIC (14, 2)  NULL,
    [comparison_nonvoted_overall_pct_change_taxes]     NUMERIC (14, 2)  NULL,
    [show_half_pay_line]                               BIT              NULL,
    [supp_reason]                                      VARCHAR (500)    NULL,
    [geo_id]                                           VARCHAR (50)     NULL,
    [has_snrdsbl_curr]                                 BIT              NULL,
    [has_snrdsbl_prev]                                 BIT              NULL,
    [full_tax_due_date]                                DATETIME         NULL,
    [suppress_prior_year_values]                       BIT              CONSTRAINT [CDF_wa_tax_statement_suppress_prior_year_values] DEFAULT ((0)) NOT NULL,
    [assmt_tax_amount]                                 NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [fee_tax_amount]                                   NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [current_year_imprv_taxable]                       NUMERIC (14)     DEFAULT ((0)) NULL,
    [current_year_land_taxable]                        NUMERIC (14)     DEFAULT ((0)) NULL,
    [current_year_exmpt_type_cd]                       VARCHAR (10)     NULL,
    [current_year_exmpt_amt]                           NUMERIC (14)     DEFAULT ((0)) NULL,
    [autopay_enrolled_status]                          BIT              DEFAULT ((0)) NULL,
    [prior_year_imprv_taxable]                         NUMERIC (14)     DEFAULT ((0)) NULL,
    [prior_year_land_taxable]                          NUMERIC (14)     DEFAULT ((0)) NULL,
    [prior_year_exmpt_amt]                             NUMERIC (14)     DEFAULT ((0)) NULL,
    [prior_year_0_tax_amount]                          NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_0_interest]                            NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_0_penalty]                             NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_1_tax_amount]                          NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_1_interest]                            NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_1_penalty]                             NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_delq_tax_amount]                       NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_delq_interest]                         NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [prior_year_delq_penalty]                          NUMERIC (14, 2)  DEFAULT ((0)) NULL,
    [gross_tax_amount]                                 NUMERIC (14, 2)  NULL,
    [scanline2]                                        VARCHAR (72)     NULL,
    [exempt_tax_amount]                                NUMERIC (14, 2)  NULL,
    [is_additional_statement]                          BIT              CONSTRAINT [CDF_wa_tax_statement_is_additional_statement] DEFAULT ((0)) NOT NULL,
    [owner_carrier_route]                              VARCHAR (5)      NULL,
    [mailto_carrier_route]                             VARCHAR (5)      NULL,
    [barcode]                                          VARCHAR (30)     NULL,
    [statement_message]                                VARCHAR (256)    CONSTRAINT [CDF_wa_tax_statement_statement_message] DEFAULT ('') NULL,
    CONSTRAINT [CPK_wa_tax_statement] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [copy_type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_tax_statement_group_id_year_run_id] FOREIGN KEY ([group_id], [year], [run_id]) REFERENCES [dbo].[wa_tax_statement_run] ([group_id], [year], [run_id]),
    CONSTRAINT [CFK_wa_tax_statement_message_cd] FOREIGN KEY ([message_cd]) REFERENCES [dbo].[tax_statement_config] ([tax_statement_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[wa_tax_statement]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The improvement or personal taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_imprv_taxable';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The amount of additional tax that would have been owed if the property did not have exemptions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'exempt_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The property exemption', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'current_year_exmpt_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior, prior years base tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_1_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior years base tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_0_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'tax statement route', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'mailto_carrier_route';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior years penalty tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_0_penalty';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tax Statement Message', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'statement_message';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The land taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_exmpt_amt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'tax statement route', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'owner_carrier_route';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The delinquent years penalty tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_delq_penalty';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The fee tax total', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'fee_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior, prior years penalty tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_1_penalty';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The second (full) half due date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'full_tax_due_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The assessment tax total', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'assmt_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior, prior years interest tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_1_interest';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'When 1, watermark will be printed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'autopay_enrolled_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Text for OCR Scanline for second-half coupon', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'scanline2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The land taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'current_year_land_taxable';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The delinquent years interest tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_delq_interest';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The property exemption amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'current_year_exmpt_amt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The taxes without exemptions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'gross_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The improvement or personal taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'current_year_imprv_taxable';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The delinquent years base tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_delq_tax_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate message used when Prior Year Values are suppressed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'suppress_prior_year_values';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The prior years interest tax due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_0_interest';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Barcode', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'barcode';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The land taxable value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'prior_year_land_taxable';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True for additional statements that were created to separate payment groups, usually because of rollbacks', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement', @level2type = N'COLUMN', @level2name = N'is_additional_statement';


GO

