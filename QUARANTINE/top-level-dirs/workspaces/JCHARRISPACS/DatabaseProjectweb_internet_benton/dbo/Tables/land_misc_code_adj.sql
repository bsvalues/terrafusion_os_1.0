CREATE TABLE [dbo].[land_misc_code_adj] (
    [sched_id]    INT             NOT NULL,
    [year]        NUMERIC (4)     NOT NULL,
    [value]       NUMERIC (14, 2) NOT NULL,
    [adj_pct]     NUMERIC (5, 2)  NOT NULL,
    [adj_value]   NUMERIC (14)    NOT NULL,
    [apply_to_hs] BIT             NOT NULL,
    [is_percent]  BIT             NOT NULL,
    CONSTRAINT [CPK_land_misc_code_adj] PRIMARY KEY CLUSTERED ([sched_id] ASC, [year] ASC)
);


GO

