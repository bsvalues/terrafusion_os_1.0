CREATE TABLE [dbo].[pp_extension] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [code_type]   INT          NOT NULL,
    [sys_flag]    VARCHAR (1)  NULL,
    CONSTRAINT [CPK_pp_extension] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO

