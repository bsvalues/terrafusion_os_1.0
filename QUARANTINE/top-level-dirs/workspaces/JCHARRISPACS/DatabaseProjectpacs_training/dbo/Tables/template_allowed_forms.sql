CREATE TABLE [dbo].[template_allowed_forms] (
    [id]                 INT           NOT NULL,
    [form]               VARCHAR (50)  NOT NULL,
    [form_id]            VARCHAR (128) NOT NULL,
    [type]               VARCHAR (15)  NOT NULL,
    [supplement_info]    INT           NOT NULL,
    [tax_statement_info] INT           NOT NULL,
    CONSTRAINT [PK_template_allowed_forms] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'This is the form class name.  Reflection can be used to create an instance of the report dialog.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_allowed_forms', @level2type = N'COLUMN', @level2name = N'form_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Form Name used to identify the form in templates', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_allowed_forms', @level2type = N'COLUMN', @level2name = N'form';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Type of form.  This will restrict the display of availalble forms', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_allowed_forms', @level2type = N'COLUMN', @level2name = N'type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Unique Id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_allowed_forms', @level2type = N'COLUMN', @level2name = N'id';


GO

