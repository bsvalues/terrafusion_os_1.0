CREATE TABLE [dbo].[reet_chg_of_owner_assoc] (
    [reet_id]         INT NOT NULL,
    [chg_of_owner_id] INT NOT NULL,
    CONSTRAINT [CPK_reet_chg_of_owner_assoc] PRIMARY KEY CLUSTERED ([reet_id] ASC, [chg_of_owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_reet_chg_of_owner_assoc_chg_of_owner_id] UNIQUE NONCLUSTERED ([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90)
);


GO

