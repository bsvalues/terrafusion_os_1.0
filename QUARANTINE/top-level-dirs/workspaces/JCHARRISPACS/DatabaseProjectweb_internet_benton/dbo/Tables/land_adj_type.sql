CREATE TABLE [dbo].[land_adj_type] (
    [land_adj_type_year]  NUMERIC (4)    NOT NULL,
    [land_adj_type_cd]    CHAR (5)       NOT NULL,
    [land_adj_type_desc]  VARCHAR (50)   NULL,
    [land_adj_type_usage] VARCHAR (5)    NULL,
    [land_adj_type_amt]   NUMERIC (10)   NULL,
    [land_adj_type_pct]   NUMERIC (5, 2) NULL,
    [rc_type]             CHAR (1)       NULL,
    [inactive]            BIT            NOT NULL,
    CONSTRAINT [CPK_land_adj_type] PRIMARY KEY CLUSTERED ([land_adj_type_year] ASC, [land_adj_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

