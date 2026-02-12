CREATE TABLE [dbo].[wash_dfl_rollback] (
    [ag_rollbk_id]     INT              NOT NULL,
    [senior]           BIT              NOT NULL,
    [year_type]        VARCHAR (1)      NOT NULL,
    [market_val]       NUMERIC (14, 2)  NULL,
    [forest_val]       NUMERIC (14, 2)  NULL,
    [last_levy_rate]   NUMERIC (13, 10) NULL,
    [proration_factor] NUMERIC (10, 6)  NULL,
    [market_taxes]     NUMERIC (14, 2)  NULL,
    [market_override]  BIT              NULL,
    [num_years]        INT              NULL,
    [tax_area_id]      INT              NULL,
    [last_cert_year]   INT              NULL,
    CONSTRAINT [CPK_wash_dfl_rollback] PRIMARY KEY CLUSTERED ([ag_rollbk_id] ASC, [senior] ASC, [year_type] ASC) WITH (FILLFACTOR = 100)
);


GO

