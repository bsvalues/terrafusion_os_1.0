CREATE TABLE [dbo].[litigation_letter_printing] (
    [run_id]         INT NOT NULL,
    [sort_id]        INT IDENTITY (1, 1) NOT NULL,
    [litigation_id]  INT NOT NULL,
    [prop_id]        INT NOT NULL,
    [lien_holder_id] INT DEFAULT ((-1)) NOT NULL,
    CONSTRAINT [CPK_litigation_letter_printing] PRIMARY KEY CLUSTERED ([run_id] ASC, [sort_id] ASC)
);


GO

