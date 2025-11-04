CREATE TABLE [dbo].[next_arbitration_id] (
    [prop_val_yr]         NUMERIC (4) NOT NULL,
    [next_arbitration_id] INT         NOT NULL,
    CONSTRAINT [CPK_next_arbitration_id] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

