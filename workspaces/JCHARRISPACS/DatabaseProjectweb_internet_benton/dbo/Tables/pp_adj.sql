CREATE TABLE [dbo].[pp_adj] (
    [pp_adj_cd]    CHAR (5)       NOT NULL,
    [pp_adj_desc]  VARCHAR (50)   NULL,
    [pp_adj_usage] VARCHAR (5)    NULL,
    [pp_adj_amt]   NUMERIC (10)   NULL,
    [pp_adj_pct]   NUMERIC (5, 2) NULL,
    [sys_flag]     CHAR (1)       NULL,
    CONSTRAINT [CPK_pp_adj] PRIMARY KEY CLUSTERED ([pp_adj_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

