CREATE TABLE [dbo].[mass_update_half_pay_run_ids] (
    [run_id]  INT      NOT NULL,
    [id_type] CHAR (1) NOT NULL,
    [id]      INT      NOT NULL,
    CONSTRAINT [CPK_mass_update_half_pay_run_ids] PRIMARY KEY CLUSTERED ([run_id] ASC, [id_type] ASC, [id] ASC),
    CONSTRAINT [CFK_mass_update_half_pay_run_ids_mass_update_half_pay_run] FOREIGN KEY ([run_id]) REFERENCES [dbo].[mass_update_half_pay_run] ([run_id])
);


GO

