CREATE TABLE [dbo].[sale_conf_level] (
    [sl_conf_lvl_cd]     CHAR (5)     NOT NULL,
    [sl_conf_lvl_desc]   VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [sl_conf_lvl_ptd_cd] CHAR (3)     NULL,
    CONSTRAINT [CPK_sale_conf_level] PRIMARY KEY CLUSTERED ([sl_conf_lvl_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

