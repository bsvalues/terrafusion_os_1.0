CREATE TABLE [dbo].[pp_waiver_status] (
    [code]        VARCHAR (5)  NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [code_type]   INT          NOT NULL,
    [sys_flag]    VARCHAR (1)  NULL,
    CONSTRAINT [CPK_pp_waiver_status] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO

