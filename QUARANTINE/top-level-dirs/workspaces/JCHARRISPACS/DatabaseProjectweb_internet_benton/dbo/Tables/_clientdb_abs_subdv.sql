CREATE TABLE [dbo].[_clientdb_abs_subdv] (
    [abs_subdv_ind]  CHAR (1)     NULL,
    [abs_subdv_cd]   VARCHAR (10) NOT NULL,
    [abs_subdv_desc] VARCHAR (60) NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_abs_subdv]
    ON [dbo].[_clientdb_abs_subdv]([abs_subdv_ind] ASC, [abs_subdv_cd] ASC);


GO

