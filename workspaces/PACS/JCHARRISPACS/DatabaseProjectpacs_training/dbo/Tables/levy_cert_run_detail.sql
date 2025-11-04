CREATE TABLE [dbo].[levy_cert_run_detail] (
    [levy_cert_run_id]       INT              NOT NULL,
    [year]                   NUMERIC (4)      NOT NULL,
    [tax_district_id]        INT              NOT NULL,
    [levy_cd]                VARCHAR (10)     NOT NULL,
    [levy_rate]              NUMERIC (13, 10) NULL,
    [tax_base]               NUMERIC (14, 2)  NULL,
    [outstanding_item_cnt]   INT              NULL,
    [final_levy_rate]        NUMERIC (13, 10) NULL,
    [budget_amount]          NUMERIC (14, 2)  NULL,
    [final_senior_levy_rate] NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_levy_cert_run_detail] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [CFK_levy_cert_run_detail_levy_cert_run_id_year] FOREIGN KEY ([levy_cert_run_id], [year]) REFERENCES [dbo].[levy_cert_run] ([levy_cert_run_id], [year]),
    CONSTRAINT [CFK_levy_cert_run_detail_tax_district_id] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[tax_district] ([tax_district_id]),
    CONSTRAINT [CFK_levy_cert_run_detail_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Final levy rate calculated for senior properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_run_detail', @level2type = N'COLUMN', @level2name = N'final_senior_levy_rate';


GO

