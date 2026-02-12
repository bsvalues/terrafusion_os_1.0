CREATE TABLE [dbo].[integrity_check_definition] (
    [check_cd]     VARCHAR (15)  NOT NULL,
    [cat_cd]       VARCHAR (10)  NOT NULL,
    [check_view]   VARCHAR (50)  NOT NULL,
    [check_desc]   VARCHAR (100) NOT NULL,
    [check_rating] VARCHAR (10)  NOT NULL,
    [use_check]    BIT           CONSTRAINT [CDF_integrity_check_definition_use_check] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_integrity_check_definition] PRIMARY KEY CLUSTERED ([check_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_integrity_check_definition_cat_cd] FOREIGN KEY ([cat_cd]) REFERENCES [dbo].[integrity_cat_cd] ([cat_cd])
);


GO

