CREATE TABLE [dbo].[levy_cert_stat_limit_detail] (
    [levy_cert_run_id]        INT              NOT NULL,
    [year]                    NUMERIC (4)      NOT NULL,
    [tax_district_id]         INT              NOT NULL,
    [levy_cd]                 VARCHAR (10)     NOT NULL,
    [linked_levy_rate]        NUMERIC (13, 10) NULL,
    [statutory_limit]         NUMERIC (13, 10) NULL,
    [notify_on_proration]     BIT              DEFAULT ((0)) NOT NULL,
    [proration_occurred]      BIT              DEFAULT ((0)) NOT NULL,
    [calculated_limit]        NUMERIC (13, 10) NULL,
    [linked_calculated_limit] NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_levy_cert_stat_limit_detail] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [CFK_levy_cert_stat_limit_detail_levy_cert_run_id_year_tax_district_id] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id]) REFERENCES [dbo].[levy_cert_stat_limit] ([levy_cert_run_id], [year], [tax_district_id]),
    CONSTRAINT [CFK_levy_cert_stat_limit_detail_levy_cert_run_id_year_tax_district_id_levy_cd] FOREIGN KEY ([levy_cert_run_id], [year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy_cert_run_detail] ([levy_cert_run_id], [year], [tax_district_id], [levy_cd])
);


GO

