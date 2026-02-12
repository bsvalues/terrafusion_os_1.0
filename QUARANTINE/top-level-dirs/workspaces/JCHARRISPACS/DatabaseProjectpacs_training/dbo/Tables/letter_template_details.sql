CREATE TABLE [dbo].[letter_template_details] (
    [template_id]  INT            NOT NULL,
    [letter_id]    INT            NOT NULL,
    [letter_name]  NVARCHAR (MAX) NULL,
    [form_id]      INT            NULL,
    [copies]       INT            NOT NULL,
    [printer_name] VARCHAR (MAX)  NULL,
    [letter_order] INT            NULL,
    [ID]           INT            IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CFK_letter_template_details] FOREIGN KEY ([template_id]) REFERENCES [dbo].[letter_templates] ([template_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Letter Id, -1 if this is not a letter', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'letter_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Order in the template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'letter_order';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Template Id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'template_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Printer to be output to', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'printer_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Form Id, -1 if this is not a form', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'form_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Number of copies of the letter or form', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'copies';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Letter Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_template_details', @level2type = N'COLUMN', @level2name = N'letter_name';


GO

