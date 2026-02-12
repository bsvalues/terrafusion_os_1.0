CREATE TABLE [dbo].[imprv_adj_type] (
    [imprv_adj_type_year]   NUMERIC (4)    NOT NULL,
    [imprv_adj_type_cd]     CHAR (5)       NOT NULL,
    [imprv_adj_type_desc]   VARCHAR (50)   NULL,
    [imprv_adj_type_usage]  VARCHAR (5)    NULL,
    [imprv_adj_type_amt]    NUMERIC (10)   NULL,
    [imprv_adj_type_pct]    NUMERIC (5, 2) NULL,
    [imprv_adj_type_patype] INT            NULL,
    [rc_type]               CHAR (1)       NULL,
    [inactive]              BIT            NOT NULL,
    CONSTRAINT [CPK_imprv_adj_type] PRIMARY KEY CLUSTERED ([imprv_adj_type_year] ASC, [imprv_adj_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

