CREATE TABLE [dbo].[sale_type] (
    [sl_type_cd]         CHAR (5)     NOT NULL,
    [sl_type_desc]       VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [sl_ptd_arms_length] CHAR (1)     NULL,
    CONSTRAINT [CPK_sale_type] PRIMARY KEY CLUSTERED ([sl_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

