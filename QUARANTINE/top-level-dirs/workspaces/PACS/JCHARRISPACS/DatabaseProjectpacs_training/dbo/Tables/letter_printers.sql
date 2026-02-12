CREATE TABLE [dbo].[letter_printers] (
    [machine_name] VARCHAR (50)   NOT NULL,
    [letter_id]    INT            NOT NULL,
    [printer_name] VARCHAR (1024) NOT NULL,
    CONSTRAINT [CPK_letter_printers] PRIMARY KEY CLUSTERED ([machine_name] ASC, [letter_id] ASC) WITH (FILLFACTOR = 100)
);


GO

