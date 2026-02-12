CREATE TABLE [dbo].[import_assessment] (
    [import_id]   INT           NOT NULL,
    [year]        NUMERIC (4)   NOT NULL,
    [agency_id]   INT           NOT NULL,
    [mapping]     CHAR (1)      NOT NULL,
    [filename]    VARCHAR (255) NOT NULL,
    [import_type] CHAR (1)      NOT NULL,
    [status]      CHAR (1)      NOT NULL,
    [file_type]   CHAR (1)      CONSTRAINT [CDF_import_assessment_file_type] DEFAULT ('A') NOT NULL,
    CONSTRAINT [CPK_import_assessment] PRIMARY KEY CLUSTERED ([import_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_import_assessment_agency_id] FOREIGN KEY ([agency_id]) REFERENCES [dbo].[special_assessment_agency] ([agency_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Describes the type of import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_assessment', @level2type = N'COLUMN', @level2name = N'file_type';


GO

