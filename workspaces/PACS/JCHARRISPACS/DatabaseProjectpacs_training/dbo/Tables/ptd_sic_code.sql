CREATE TABLE [dbo].[ptd_sic_code] (
    [ptd_sic_cd]   VARCHAR (10)  NOT NULL,
    [ptd_sic_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_ptd_sic_code] PRIMARY KEY CLUSTERED ([ptd_sic_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

