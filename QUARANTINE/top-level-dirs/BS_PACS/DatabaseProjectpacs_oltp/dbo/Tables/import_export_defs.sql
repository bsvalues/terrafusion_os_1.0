CREATE TABLE [dbo].[import_export_defs] (
    [definition_name]   VARCHAR (50)   NOT NULL,
    [record_type]       VARCHAR (2)    NOT NULL,
    [field_name]        VARCHAR (127)  NOT NULL,
    [start_pos]         INT            NOT NULL,
    [length]            INT            NOT NULL,
    [export_format]     VARCHAR (30)   NOT NULL,
    [friendly_desc]     VARCHAR (4095) NULL,
    [xml_element]       VARCHAR (50)   NULL,
    [xml_element_level] INT            NULL,
    CONSTRAINT [CPK_import_export_defs] PRIMARY KEY CLUSTERED ([definition_name] ASC, [record_type] ASC, [field_name] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import/Export XML Element Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_export_defs', @level2type = N'COLUMN', @level2name = N'xml_element';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import/Export XML Element Level', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_export_defs', @level2type = N'COLUMN', @level2name = N'xml_element_level';


GO

