CREATE TABLE [dbo].[mass_apply_escrow_run_properties] (
    [run_id]              INT             NOT NULL,
    [prop_id]             INT             NOT NULL,
    [escrow_type]         VARCHAR (20)    NOT NULL,
    [escrow_amount]       NUMERIC (14, 2) NOT NULL,
    [taxes_due]           NUMERIC (14, 2) NOT NULL,
    [apply_to_properties] VARCHAR (MAX)   NOT NULL,
    [modify_to_zero]      BIT             NOT NULL,
    [error_desc]          VARCHAR (500)   NULL,
    CONSTRAINT [CPK_mass_apply_escrow_run_properties] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Error Description for the Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_apply_escrow_run_properties', @level2type = N'COLUMN', @level2name = N'error_desc';


GO

