CREATE TABLE [dbo].[_arb_protest_panel_member] (
    [prop_id]     INT          NOT NULL,
    [prop_val_yr] INT          NOT NULL,
    [case_id]     INT          NOT NULL,
    [member_cd]   VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK__arb_protest_panel_member] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC, [member_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_protest_panel_member_member_cd] FOREIGN KEY ([member_cd]) REFERENCES [dbo].[_arb_protest_panel_member_cd] ([member_cd])
);


GO

