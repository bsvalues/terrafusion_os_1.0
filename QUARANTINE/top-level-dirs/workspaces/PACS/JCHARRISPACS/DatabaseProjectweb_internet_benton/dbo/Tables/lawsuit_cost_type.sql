CREATE TABLE [dbo].[lawsuit_cost_type] (
    [cost_cd]   CHAR (5)  NOT NULL,
    [cost_desc] CHAR (20) NULL,
    CONSTRAINT [CPK_lawsuit_cost_type] PRIMARY KEY CLUSTERED ([cost_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

