CREATE TABLE [dbo].[pp_class] (
    [pp_class_cd]   CHAR (5)     NOT NULL,
    [pp_class_desc] VARCHAR (50) NULL,
    [sys_flag]      CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_class] PRIMARY KEY CLUSTERED ([pp_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

