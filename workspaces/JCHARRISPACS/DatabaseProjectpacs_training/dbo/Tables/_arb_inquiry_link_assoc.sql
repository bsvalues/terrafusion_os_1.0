CREATE TABLE [dbo].[_arb_inquiry_link_assoc] (
    [link_id]     INT         NOT NULL,
    [prop_val_yr] NUMERIC (4) NOT NULL,
    [case_id]     INT         NOT NULL,
    [prop_id]     INT         NOT NULL,
    CONSTRAINT [CPK_arb_inquiry_link_assoc] PRIMARY KEY CLUSTERED ([link_id] ASC, [prop_val_yr] ASC, [case_id] ASC, [prop_id] ASC)
);


GO

