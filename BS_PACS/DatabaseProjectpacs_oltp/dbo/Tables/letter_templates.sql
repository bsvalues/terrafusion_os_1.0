CREATE TABLE [dbo].[letter_templates] (
    [template_id]     INT            IDENTITY (1, 1) NOT NULL,
    [template_name]   NVARCHAR (MAX) NOT NULL,
    [template_type]   INT            NOT NULL,
    [letter_type]     NVARCHAR (MAX) NULL,
    [form_type]       NVARCHAR (MAX) NULL,
    [creation_date]   DATETIME       NOT NULL,
    [collated_copies] INT            NOT NULL,
    [system_type]     CHAR (1)       NULL,
    CONSTRAINT [CPK_letter_templates] PRIMARY KEY CLUSTERED ([template_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'How many collated copies', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'collated_copies';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Letter type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'letter_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Template Id field', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'template_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'System type allowed to use template A=Assessor C=Collections', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'system_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Form type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'form_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'User assigned name for template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'template_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'This is the creation/modification time of the template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'creation_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Type of template, either "form" or "letter"', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_templates', @level2type = N'COLUMN', @level2name = N'template_type';


GO

