CREATE TABLE [dbo].[UDI_owner_transfer_history] (
    [seller_owner_id]      INT         NOT NULL,
    [seller_child_prop_id] INT         NOT NULL,
    [buyer_owner_id]       INT         NOT NULL,
    [buyer_child_prop_id]  INT         NOT NULL,
    [parent_prop_id]       INT         NOT NULL,
    [parent_sup_num]       INT         NOT NULL,
    [parent_prop_val_yr]   NUMERIC (4) NOT NULL,
    [transfer_dt]          DATETIME    NULL,
    CONSTRAINT [CPK_UDI_owner_transfer_history] PRIMARY KEY CLUSTERED ([seller_owner_id] ASC, [seller_child_prop_id] ASC, [buyer_owner_id] ASC, [buyer_child_prop_id] ASC, [parent_prop_id] ASC, [parent_sup_num] ASC, [parent_prop_val_yr] ASC)
);


GO

