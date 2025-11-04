CREATE TABLE [dbo].[slope_intercept_eif_detail] (
    [sid_hood_cd]   VARCHAR (10)    NOT NULL,
    [sid_type_cd]   VARCHAR (5)     NOT NULL,
    [sid_year]      NUMERIC (4)     NOT NULL,
    [sid_detail_id] INT             NOT NULL,
    [condition_cd]  VARCHAR (5)     NOT NULL,
    [eif]           NUMERIC (14, 4) NOT NULL,
    CONSTRAINT [CPK_slope_intercept_eif_detail] PRIMARY KEY CLUSTERED ([sid_year] ASC, [sid_hood_cd] ASC, [sid_type_cd] ASC, [condition_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

