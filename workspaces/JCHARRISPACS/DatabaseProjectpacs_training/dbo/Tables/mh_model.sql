CREATE TABLE [dbo].[mh_model] (
    [mh_model_cd]   CHAR (20)    NOT NULL,
    [mh_model_desc] VARCHAR (50) NULL,
    [sys_flag]      CHAR (1)     NULL,
    CONSTRAINT [CPK_mh_model] PRIMARY KEY CLUSTERED ([mh_model_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

