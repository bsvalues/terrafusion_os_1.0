CREATE TABLE [dbo].[meta_code_table] (
    [table_name]        VARCHAR (50)  NOT NULL,
    [maintenance_name]  VARCHAR (255) NOT NULL,
    [code_column_name]  VARCHAR (127) NOT NULL,
    [desc_column_name]  VARCHAR (127) NOT NULL,
    [category]          VARCHAR (63)  NOT NULL,
    [maint_form]        VARCHAR (255) NULL,
    [is_desc_editable]  BIT           NOT NULL,
    [primary_keys]      VARCHAR (255) NULL,
    [is_available]      VARCHAR (255) NULL,
    [desc_not_required] BIT           CONSTRAINT [CDF_meta_code_table_desc_not_required] DEFAULT ((0)) NOT NULL,
    [system_region]     CHAR (2)      NULL,
    [code_is_id]        BIT           CONSTRAINT [CDF_meta_code_table_code_is_id] DEFAULT ((0)) NOT NULL,
    [preprocess_class]  VARCHAR (200) NULL,
    CONSTRAINT [CPK_meta_code_table] PRIMARY KEY CLUSTERED ([table_name] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies a class that will implement ICodeFilePreprocess to control when and how a Code File dialog is displayed.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_code_table', @level2type = N'COLUMN', @level2name = N'preprocess_class';


GO

