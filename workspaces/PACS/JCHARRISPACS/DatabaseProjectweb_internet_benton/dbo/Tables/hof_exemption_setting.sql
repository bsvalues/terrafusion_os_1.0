CREATE TABLE [dbo].[hof_exemption_setting] (
    [year]             NUMERIC (4)  NOT NULL,
    [exemption_amount] NUMERIC (14) NOT NULL,
    CONSTRAINT [CPK_hof_exemption_setting] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 100)
);


GO

