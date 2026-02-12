CREATE TABLE [dbo].[letter_sp_list] (
    [sp_name]   VARCHAR (50) NOT NULL,
    [name]      VARCHAR (50) NOT NULL,
    [type]      INT          NOT NULL,
    [acct_type] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_letter_sp_list] PRIMARY KEY CLUSTERED ([sp_name] ASC, [acct_type] ASC) WITH (FILLFACTOR = 100)
);


GO

