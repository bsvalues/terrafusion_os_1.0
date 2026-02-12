CREATE TABLE [dbo].[letter_template_assoc] (
    [template_id]  INT            NOT NULL,
    [letter_id]    INT            NOT NULL,
    [copies]       INT            NOT NULL,
    [printer_name] VARCHAR (1024) NULL,
    CONSTRAINT [CPK_letter_template_assoc] PRIMARY KEY CLUSTERED ([template_id] ASC, [letter_id] ASC) WITH (FILLFACTOR = 100)
);


GO

