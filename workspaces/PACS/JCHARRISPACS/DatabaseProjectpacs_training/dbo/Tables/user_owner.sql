CREATE TABLE [dbo].[user_owner] (
    [owner_id]     INT          NOT NULL,
    [owner_tax_yr] NUMERIC (4)  NOT NULL,
    [prop_id]      INT          NOT NULL,
    [sup_num]      INT          NOT NULL,
    [in_care_of]   VARCHAR (50) NULL,
    [spouse_name]  VARCHAR (20) NULL,
    CONSTRAINT [CPK_user_owner] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_user_owner_owner_id] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_user_owner_owner_tax_yr_sup_num_prop_id] FOREIGN KEY ([owner_tax_yr], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

