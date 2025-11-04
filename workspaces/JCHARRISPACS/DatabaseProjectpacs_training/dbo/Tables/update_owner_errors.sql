CREATE TABLE [dbo].[update_owner_errors] (
    [prop_id]     INT         NOT NULL,
    [prop_val_yr] NUMERIC (4) NOT NULL,
    [num_owners]  INT         NULL,
    CONSTRAINT [CPK_update_owner_errors] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

