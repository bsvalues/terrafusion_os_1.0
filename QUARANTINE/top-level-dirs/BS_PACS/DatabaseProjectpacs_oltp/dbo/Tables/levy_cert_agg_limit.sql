CREATE TABLE [dbo].[levy_cert_agg_limit] (
    [levy_cert_run_id]          INT              NOT NULL,
    [year]                      NUMERIC (4)      NOT NULL,
    [tax_district_id]           INT              NOT NULL,
    [levy_cd]                   VARCHAR (10)     NOT NULL,
    [status]                    BIT              DEFAULT ((0)) NOT NULL,
    [original_levy_rate]        NUMERIC (13, 10) NULL,
    [levy_reduction]            NUMERIC (13, 10) NULL,
    [final_levy_rate]           NUMERIC (13, 10) NULL,
    [original_senior_levy_rate] NUMERIC (13, 10) NULL,
    [senior_levy_reduction]     NUMERIC (13, 10) NULL,
    [final_senior_levy_rate]    NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_levy_cert_agg_limit] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [CFK_levy_cert_agg_limit_levy_cert_run_id_year_tax_district_id_levy_cd] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy_cert_run_detail] ([levy_cert_run_id], [year], [tax_district_id], [levy_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Amount that the senior limit was reduced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_agg_limit', @level2type = N'COLUMN', @level2name = N'senior_levy_reduction';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Reduced senior levy rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_agg_limit', @level2type = N'COLUMN', @level2name = N'final_senior_levy_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Original senior levy rate, before aggregate limit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_agg_limit', @level2type = N'COLUMN', @level2name = N'original_senior_levy_rate';


GO

