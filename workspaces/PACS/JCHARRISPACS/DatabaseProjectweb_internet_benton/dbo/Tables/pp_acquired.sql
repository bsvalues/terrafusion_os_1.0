CREATE TABLE [dbo].[pp_acquired] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NULL,
    [sys_flag]    CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_acquired] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 90)
);


GO

