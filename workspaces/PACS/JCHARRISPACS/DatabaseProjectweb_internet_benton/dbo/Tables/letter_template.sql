CREATE TABLE [dbo].[letter_template] (
    [id]                INT          IDENTITY (1, 1) NOT NULL,
    [template_name]     VARCHAR (50) NOT NULL,
    [template_datetime] DATETIME     NOT NULL,
    [template_type]     VARCHAR (10) NOT NULL,
    [computername]      VARCHAR (50) NULL,
    CONSTRAINT [CPK_letter_template] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

