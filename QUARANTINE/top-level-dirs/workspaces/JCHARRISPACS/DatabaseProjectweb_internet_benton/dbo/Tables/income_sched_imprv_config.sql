CREATE TABLE [dbo].[income_sched_imprv_config] (
    [year]                   NUMERIC (4) NOT NULL,
    [match_by_economic_area] BIT         NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO

