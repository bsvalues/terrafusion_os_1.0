CREATE TABLE [dbo].[wash_open_space_rollback] (
    [ag_rollbk_id]       INT              NOT NULL,
    [year]               INT              NOT NULL,
    [senior]             BIT              NOT NULL,
    [year_type]          VARCHAR (1)      NOT NULL,
    [market_val]         NUMERIC (14, 2)  NULL,
    [current_use_val]    NUMERIC (14, 2)  NULL,
    [levy_rate]          NUMERIC (13, 10) NULL,
    [proration_factor]   NUMERIC (10, 6)  NULL,
    [market_taxes_due]   NUMERIC (14, 2)  NULL,
    [curr_use_tax_due]   NUMERIC (14, 2)  NULL,
    [additional_tax]     NUMERIC (14, 2)  NULL,
    [interest_due]       NUMERIC (14, 2)  NULL,
    [tax_interest]       NUMERIC (14, 2)  NULL,
    [tax_override]       BIT              NULL,
    [value_difference]   NUMERIC (14, 2)  NULL,
    [one_perc_per_month] INT              NULL,
    [tax_area_id]        INT              NULL,
    CONSTRAINT [CPK_wash_open_space_rollback] PRIMARY KEY CLUSTERED ([ag_rollbk_id] ASC, [year] ASC, [senior] ASC, [year_type] ASC) WITH (FILLFACTOR = 100)
);


GO

