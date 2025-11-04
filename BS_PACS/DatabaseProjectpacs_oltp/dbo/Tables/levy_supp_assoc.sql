CREATE TABLE [dbo].[levy_supp_assoc] (
    [type]    CHAR (1)    NOT NULL,
    [prop_id] INT         NOT NULL,
    [sup_num] INT         NOT NULL,
    [sup_yr]  NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_levy_supp_assoc] PRIMARY KEY CLUSTERED ([sup_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

