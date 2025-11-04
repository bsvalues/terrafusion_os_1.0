CREATE TABLE [dbo].[additional_sale_code] (
    [sale_cd]      VARCHAR (10) NOT NULL,
    [sale_desc]    VARCHAR (30) NOT NULL,
    [imp_recopied] BIT          NOT NULL,
    CONSTRAINT [CPK_additional_sale_code] PRIMARY KEY CLUSTERED ([sale_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

