CREATE TABLE [dbo].[levy_cert_stat_limit_reduction_assoc] (
    [levy_cert_run_id]          INT          NOT NULL,
    [year]                      NUMERIC (4)  NOT NULL,
    [tax_district_id]           INT          NOT NULL,
    [levy_cd]                   VARCHAR (10) NOT NULL,
    [reduction_levy_cd]         VARCHAR (10) NOT NULL,
    [reduction_tax_district_id] INT          NOT NULL,
    CONSTRAINT [CPK_levy_cert_stat_limit_reduction_assoc] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [reduction_levy_cd] ASC, [reduction_tax_district_id] ASC),
    CONSTRAINT [CFK_levy_cert_stat_limit_reduction_assoc_levy_cert_run_id_year_tax_district_id] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id]) REFERENCES [dbo].[levy_cert_stat_limit] ([levy_cert_run_id], [year], [tax_district_id]),
    CONSTRAINT [CFK_levy_cert_stat_limit_reduction_assoc_levy_cert_run_id_year_tax_district_id_levy_cd] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy_cert_run_detail] ([levy_cert_run_id], [year], [tax_district_id], [levy_cd])
);


GO

