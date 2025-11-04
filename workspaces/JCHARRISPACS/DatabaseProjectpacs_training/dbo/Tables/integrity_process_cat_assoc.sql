CREATE TABLE [dbo].[integrity_process_cat_assoc] (
    [process_cd] VARCHAR (10) NOT NULL,
    [cat_cd]     VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_integrity_process_cat_assoc] PRIMARY KEY CLUSTERED ([process_cd] ASC, [cat_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_integrity_process_cat_assoc_cat_cd] FOREIGN KEY ([cat_cd]) REFERENCES [dbo].[integrity_cat_cd] ([cat_cd]),
    CONSTRAINT [CFK_integrity_process_cat_assoc_process_cd] FOREIGN KEY ([process_cd]) REFERENCES [dbo].[integrity_process_cd] ([process_cd])
);


GO

