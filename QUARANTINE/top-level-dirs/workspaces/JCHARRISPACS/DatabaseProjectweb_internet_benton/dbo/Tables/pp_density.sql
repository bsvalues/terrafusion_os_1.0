CREATE TABLE [dbo].[pp_density] (
    [pp_density_cd]   CHAR (5)     NOT NULL,
    [pp_density_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_density] PRIMARY KEY CLUSTERED ([pp_density_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

