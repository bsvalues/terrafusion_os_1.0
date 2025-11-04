CREATE TABLE [dbo].[code_list] (
    [list_id]    INT          IDENTITY (1, 1) NOT NULL,
    [name]       VARCHAR (64) NOT NULL,
    [code_table] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_code_list] PRIMARY KEY CLUSTERED ([list_id] ASC) WITH (FILLFACTOR = 100)
);


GO

