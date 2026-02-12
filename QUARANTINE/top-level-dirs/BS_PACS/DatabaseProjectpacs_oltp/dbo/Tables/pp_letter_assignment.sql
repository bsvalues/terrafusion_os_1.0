CREATE TABLE [dbo].[pp_letter_assignment] (
    [letter_type] INT          NOT NULL,
    [comment]     VARCHAR (50) NOT NULL,
    [letter_id]   INT          NULL,
    CONSTRAINT [CPK_pp_letter_assignment] PRIMARY KEY CLUSTERED ([letter_type] ASC) WITH (FILLFACTOR = 100)
);


GO

