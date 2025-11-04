CREATE TABLE [dbo].[import_bpp] (
    [run_id]        INT           NOT NULL,
    [year]          NUMERIC (4)   NOT NULL,
    [import_type]   VARCHAR (10)  NOT NULL,
    [status]        VARCHAR (20)  NOT NULL,
    [import_date]   DATETIME      NOT NULL,
    [import_by_id]  INT           NOT NULL,
    [process_date]  DATETIME      NULL,
    [process_by_id] INT           NULL,
    [num_records]   INT           DEFAULT ((0)) NOT NULL,
    [num_errors]    INT           DEFAULT ((0)) NOT NULL,
    [file_path]     VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_import_bpp] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = '# of Errors in Import File', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'num_errors';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date/Time Process was run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'process_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import Run Status (Imported, Imported With Errors, Processed, Failed)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Full File Path of file to be Imported', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'file_path';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS User ID of user who ran the Process function', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'process_by_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date/Time Import was run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'import_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Assessment Year when Run was Created', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = '# of Records in Import File', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'num_records';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS User ID of user who ran the Import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'import_by_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Type of Import (Rendition, Account Update, Situs Update)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp', @level2type = N'COLUMN', @level2name = N'import_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import BPP Rendition Import Run table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp';


GO

