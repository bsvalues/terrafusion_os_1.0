CREATE TABLE [dbo].[meta_verb] (
    [verb_id] INT            IDENTITY (1, 1) NOT NULL,
    [verb]    NVARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_meta_verb] PRIMARY KEY CLUSTERED ([verb_id] ASC)
);


GO

