CREATE TABLE [dbo].[levy_cert_stat_limit] (
    [levy_cert_run_id] INT              NOT NULL,
    [year]             NUMERIC (4)      NOT NULL,
    [tax_district_id]  INT              NOT NULL,
    [statutory_limit]  NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_levy_cert_stat_limit] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC)
);


GO

