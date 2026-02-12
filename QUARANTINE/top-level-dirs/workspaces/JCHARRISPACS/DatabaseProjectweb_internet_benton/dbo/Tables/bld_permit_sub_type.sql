CREATE TABLE [dbo].[bld_permit_sub_type] (
    [PermitSubtypeCode] VARCHAR (5)  NOT NULL,
    [Description]       VARCHAR (50) NULL,
    CONSTRAINT [CPK_bld_permit_sub_type] PRIMARY KEY CLUSTERED ([PermitSubtypeCode] ASC) WITH (FILLFACTOR = 100)
);


GO

