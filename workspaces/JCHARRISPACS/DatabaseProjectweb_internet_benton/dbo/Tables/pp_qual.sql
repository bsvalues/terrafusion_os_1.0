CREATE TABLE [dbo].[pp_qual] (
    [pp_qual_cd]   CHAR (5)     NOT NULL,
    [pp_qual_desc] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_qual] PRIMARY KEY CLUSTERED ([pp_qual_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

