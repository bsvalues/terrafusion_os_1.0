CREATE TABLE [dbo].[import_bpp_error] (
    [run_id]      INT           NOT NULL,
    [eid]         INT           NOT NULL,
    [prop_id]     INT           NULL,
    [line_number] INT           NULL,
    [error_text]  VARCHAR (128) NOT NULL,
    CONSTRAINT [CPK_import_bpp_error] PRIMARY KEY CLUSTERED ([run_id] ASC, [eid] ASC),
    CONSTRAINT [CFK_import_bpp_error_import_bpp] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_bpp] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import BPP Error table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Line Number of Import File where error was found', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error', @level2type = N'COLUMN', @level2name = N'line_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Error Message', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error', @level2type = N'COLUMN', @level2name = N'error_text';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property ID or Owner ID depending on the Import Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Error ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_error', @level2type = N'COLUMN', @level2name = N'eid';


GO

