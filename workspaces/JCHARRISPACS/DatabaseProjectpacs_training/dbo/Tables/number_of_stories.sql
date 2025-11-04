CREATE TABLE [dbo].[number_of_stories] (
    [number_of_stories] NUMERIC (5, 2) NOT NULL,
    [Description]       VARCHAR (8000) NOT NULL,
    CONSTRAINT [CPK_number_of_stories] PRIMARY KEY CLUSTERED ([number_of_stories] ASC)
);


GO

