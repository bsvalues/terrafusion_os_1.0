CREATE TABLE [dbo].[lawsuit_years] (
    [lawsuit_id]      INT          NOT NULL,
    [lawsuit_yr]      NUMERIC (4)  NOT NULL,
    [certified_value] NUMERIC (14) NULL,
    [adjudged_value]  NUMERIC (14) NULL,
    CONSTRAINT [CPK_lawsuit_years] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [lawsuit_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

