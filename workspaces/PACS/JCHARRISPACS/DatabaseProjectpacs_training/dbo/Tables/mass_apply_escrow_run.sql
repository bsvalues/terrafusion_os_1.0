CREATE TABLE [dbo].[mass_apply_escrow_run] (
    [run_id]                INT             NOT NULL,
    [year]                  NUMERIC (4)     NOT NULL,
    [escrow_types]          VARCHAR (MAX)   NOT NULL,
    [split_merge_indicator] BIT             NOT NULL,
    [date_posted]           DATETIME        NOT NULL,
    [posted_by_id]          INT             NOT NULL,
    [batch_id]              INT             NOT NULL,
    [escrow_posted]         NUMERIC (14, 2) NOT NULL,
    [escrow_applied]        NUMERIC (14, 2) NOT NULL,
    [escrow_overpaid]       NUMERIC (14, 2) NOT NULL,
    [escrow_variance]       NUMERIC (14, 2) NOT NULL,
    [error_count]           INT             CONSTRAINT [CDF_mass_apply_escrow_run_error_count] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_mass_apply_escrow_run] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Error Count for the Run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_apply_escrow_run', @level2type = N'COLUMN', @level2name = N'error_count';


GO

