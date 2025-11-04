CREATE TABLE [dbo].[letter_type] (
    [letter_type_cd]      VARCHAR (15)  NOT NULL,
    [letter_type_desc]    VARCHAR (255) NOT NULL,
    [letter_system_types] VARCHAR (5)   NULL,
    CONSTRAINT [CPK_letter_type] PRIMARY KEY CLUSTERED ([letter_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

