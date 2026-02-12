CREATE TABLE [dbo].[pp_condition] (
    [pp_condition_cd]   VARCHAR (10) NOT NULL,
    [pp_condition_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_condition] PRIMARY KEY CLUSTERED ([pp_condition_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

