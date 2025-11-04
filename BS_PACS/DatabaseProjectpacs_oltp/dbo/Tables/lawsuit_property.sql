CREATE TABLE [dbo].[lawsuit_property] (
    [lawsuit_id]                INT          NOT NULL,
    [lawsuit_yr]                NUMERIC (4)  NOT NULL,
    [prop_id]                   INT          NOT NULL,
    [certified_value]           NUMERIC (14) NULL,
    [adjudged_value]            NUMERIC (14) NULL,
    [taxpayer_opinion_of_value] NUMERIC (14) NULL,
    CONSTRAINT [CPK_lawsuit_property] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [lawsuit_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

