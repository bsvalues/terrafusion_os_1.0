CREATE TABLE [dbo].[lease_class_code] (
    [class_cd]   VARCHAR (10) NOT NULL,
    [class_desc] VARCHAR (30) NULL,
    CONSTRAINT [CPK_lease_class_code] PRIMARY KEY CLUSTERED ([class_cd] ASC)
);


GO

