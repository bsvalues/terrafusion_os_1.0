CREATE TABLE [dbo].[levy_cert_hl_limit] (
    [levy_cert_run_id]                             INT              NOT NULL,
    [year]                                         NUMERIC (4)      NOT NULL,
    [tax_district_id]                              INT              NOT NULL,
    [levy_cd]                                      VARCHAR (10)     NOT NULL,
    [status]                                       BIT              DEFAULT ((0)) NOT NULL,
    [limit_factor]                                 NUMERIC (13, 10) NULL,
    [calc_method]                                  CHAR (10)        NULL,
    [calc_method_years]                            INT              NULL,
    [calc_method_levy_year]                        NUMERIC (4)      NULL,
    [prior_year_levy_rate]                         NUMERIC (13, 10) NULL,
    [lid_lift_levy]                                NUMERIC (14, 2)  NULL,
    [compare_budget]                               BIT              DEFAULT ((0)) NOT NULL,
    [shift_to_levy_cd]                             VARCHAR (10)     NULL,
    [highest_lawful_levy]                          NUMERIC (14, 2)  NULL,
    [banking_capacity]                             NUMERIC (14, 2)  NULL,
    [use_refunded_amount]                          BIT              DEFAULT ((0)) NOT NULL,
    [refunded_amount]                              NUMERIC (14, 2)  NULL,
    [use_recovered_amount]                         BIT              DEFAULT ((0)) NOT NULL,
    [recovered_amount]                             NUMERIC (14, 2)  NULL,
    [use_prior_yr_corrections]                     BIT              DEFAULT ((0)) NOT NULL,
    [corrections_year]                             NUMERIC (4)      NULL,
    [corrections_amount]                           NUMERIC (14, 2)  NULL,
    [calculated_levy]                              NUMERIC (14, 2)  NULL,
    [highest_lawful_levy_rate]                     NUMERIC (13, 10) NULL,
    [calc_method_levy_amount]                      NUMERIC (14, 2)  NULL,
    [lid_lift]                                     BIT              CONSTRAINT [CDF_levy_cert_hl_limit_lid_lift] DEFAULT ((0)) NOT NULL,
    [shift_to_tax_district_id]                     INT              NULL,
    [prior_year_levy_rate_override]                BIT              NULL,
    [prior_year_levy]                              NUMERIC (16, 2)  NULL,
    [prior_year_levy_override]                     BIT              CONSTRAINT [CDF_levy_cert_hl_limit_prior_year_levy_override] DEFAULT ((0)) NOT NULL,
    [levy_calc_limit_factor]                       NUMERIC (13, 10) NULL,
    [shift_diversion_flag]                         BIT              CONSTRAINT [CDF_levy_cert_hl_limit_shift_diversion_flag] DEFAULT ((0)) NOT NULL,
    [shift_diversion_amount]                       NUMERIC (14, 2)  CONSTRAINT [CDF_levy_cert_hl_limit_shift_diversion_amount] DEFAULT ((0)) NOT NULL,
    [shift_diversion_reason]                       VARCHAR (30)     NULL,
    [prior_levy_calc_limit_factor]                 NUMERIC (13, 9)  NULL,
    [prior_levy_calc_limit_factor_override]        BIT              NULL,
    [limit_amount_requested]                       NUMERIC (14, 2)  NULL,
    [senior_calculated_levy]                       NUMERIC (14, 2)  NULL,
    [senior_highest_lawful_levy_rate]              NUMERIC (13, 10) NULL,
    [prior_year_tif_levy_amount]                   NUMERIC (14, 2)  NULL,
    [tif_levy_amount]                              NUMERIC (14, 2)  NULL,
    [nolift_calc_method_levy_year]                 NUMERIC (4)      NULL,
    [nolift_calc_method_levy_amount]               NUMERIC (14, 2)  NULL,
    [senior_tif_levy_amount]                       NUMERIC (14, 2)  NULL,
    [non_senior_tif_levy_amount]                   NUMERIC (14, 2)  NULL,
    [nolift_tif_levy_amount]                       NUMERIC (14, 2)  NULL,
    [senior_prior_year_tif_levy_amount]            NUMERIC (14, 2)  NULL,
    [non_senior_prior_year_tif_levy_amount]        NUMERIC (14, 2)  NULL,
    [nolift_prior_year_tif_levy_amount]            NUMERIC (14, 2)  NULL,
    [senior_levy_calc_limit_factor]                NUMERIC (13, 10) NULL,
    [senior_prior_levy_calc_limit_factor]          NUMERIC (13, 9)  NULL,
    [senior_prior_levy_calc_limit_factor_override] BIT              CONSTRAINT [CDF_levy_cert_hl_limit_senior_prior_levy_calc_limit_factor_override] DEFAULT ((0)) NOT NULL,
    [senior_prior_year_levy_rate]                  NUMERIC (13, 10) NULL,
    [senior_prior_year_levy_rate_override]         BIT              CONSTRAINT [CDF_levy_cert_hl_limit_senior_prior_year_levy_rate_override] DEFAULT ((0)) NOT NULL,
    [senior_prior_year_levy]                       NUMERIC (16, 2)  NULL,
    [senior_prior_year_levy_override]              BIT              CONSTRAINT [CDF_levy_cert_hl_limit_senior_prior_year_levy_override] DEFAULT ((0)) NOT NULL,
    [senior_highest_lawful_levy]                   NUMERIC (14, 2)  NULL,
    [senior_limit_factor]                          NUMERIC (13, 10) NULL,
    [limit_factor_override]                        BIT              CONSTRAINT [CDF_levy_cert_hl_limit_limit_factor_override] DEFAULT ((0)) NOT NULL,
    [senior_limit_factor_override]                 BIT              CONSTRAINT [CDF_levy_cert_hl_limit_senior_limit_factor_override] DEFAULT ((0)) NOT NULL,
    [nolift_prior_year_levy_rate]                  NUMERIC (13, 10) NULL,
    [nolift_prior_year_levy]                       NUMERIC (16, 2)  NULL,
    [nolift_highest_lawful_levy]                   NUMERIC (14, 2)  NULL,
    [nolift_calculated_levy]                       NUMERIC (14, 2)  NULL,
    [nolift_highest_lawful_levy_rate]              NUMERIC (13, 10) NULL,
    [tif_increment]                                NUMERIC (14)     NULL,
    [tif_senior_increment]                         NUMERIC (14)     NULL,
    [tif_increment_override]                       BIT              CONSTRAINT [CDF_levy_cert_hl_limit_tif_increment_override] DEFAULT ((0)) NOT NULL,
    [tif_senior_increment_override]                BIT              CONSTRAINT [CDF_levy_cert_hl_limit_tif_senior_increment_override] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_levy_cert_hl_limit] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [CFK_levy_cert_hl_limit_levy_cert_run_id_year_tax_district_id_levy_cd] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy_cert_run_detail] ([levy_cert_run_id], [year], [tax_district_id], [levy_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Highest lawful levy rate for properties with a senior exemption', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'senior_highest_lawful_levy_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prior limit factor', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'prior_levy_calc_limit_factor';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Highest lawful levy for properties with a senior exemption', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'senior_calculated_levy';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Shift/Diversion Reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'shift_diversion_reason';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Limit Amount Requested', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'limit_amount_requested';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'LTIF levy amount in the current year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'tif_levy_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Shift/Diversion Amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'shift_diversion_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prior limit factor override', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'prior_levy_calc_limit_factor_override';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'LTIF levy amount in the prior year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'prior_year_tif_levy_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Shift/Diversion Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_hl_limit', @level2type = N'COLUMN', @level2name = N'shift_diversion_flag';


GO

