CREATE TABLE [dbo].[integrity_cat_cd] (
    [cat_cd]       VARCHAR (10) NOT NULL,
    [cat_desc]     VARCHAR (50) NOT NULL,
    [cat_view]     VARCHAR (50) NOT NULL,
    [system_check] BIT          CONSTRAINT [CDF_integrity_cat_cd_system_check] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_integrity_cat_cd] PRIMARY KEY CLUSTERED ([cat_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

