CREATE TABLE [dbo].[mass_update_half_pay_run_items] (
    [run_id]         INT             NOT NULL,
    [trans_group_id] INT             NOT NULL,
    [orig_h1]        NUMERIC (14, 2) NULL,
    [orig_h2]        NUMERIC (14, 2) NULL,
    [orig_h1_date]   DATETIME        NULL,
    [orig_h2_date]   DATETIME        NULL,
    CONSTRAINT [CPK_mass_update_half_pay_run_items] PRIMARY KEY CLUSTERED ([run_id] ASC, [trans_group_id] ASC),
    CONSTRAINT [CFK_mass_update_half_pay_run_items_mass_update_half_pay_run] FOREIGN KEY ([run_id]) REFERENCES [dbo].[mass_update_half_pay_run] ([run_id]),
    CONSTRAINT [CFK_mass_update_half_pay_run_items_trans_group] FOREIGN KEY ([trans_group_id]) REFERENCES [dbo].[trans_group] ([trans_group_id])
);


GO

