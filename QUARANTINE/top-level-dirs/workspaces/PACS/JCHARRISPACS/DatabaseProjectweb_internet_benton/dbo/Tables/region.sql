CREATE TABLE [dbo].[region] (
    [rgn_cd]        VARCHAR (5)    NOT NULL,
    [rgn_name]      VARCHAR (50)   NULL,
    [rgn_pct]       VARCHAR (50)   NULL,
    [sys_flag]      CHAR (1)       NULL,
    [rgn_imprv_pct] NUMERIC (5, 2) NULL,
    [rgn_land_pct]  NUMERIC (5, 2) NULL,
    CONSTRAINT [CPK_region] PRIMARY KEY CLUSTERED ([rgn_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

