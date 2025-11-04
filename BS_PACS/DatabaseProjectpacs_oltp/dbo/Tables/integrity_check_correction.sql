CREATE TABLE [dbo].[integrity_check_correction] (
    [check_cd]      VARCHAR (15) NOT NULL,
    [fix_procedure] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_integrity_check_correction] PRIMARY KEY CLUSTERED ([check_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_integrity_check_correction_check_cd] FOREIGN KEY ([check_cd]) REFERENCES [dbo].[integrity_check_definition] ([check_cd])
);


GO

