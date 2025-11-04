CREATE TABLE [dbo].[support_staff] (
    [id]        INT          NOT NULL,
    [name]      VARCHAR (40) NOT NULL,
    [full_name] VARCHAR (75) NULL,
    CONSTRAINT [pk_support_staff] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

