CREATE TABLE [dbo].[owner_link_type_code] (
    [linked_cd]  VARCHAR (10) NOT NULL,
    [linked_des] VARCHAR (50) NULL,
    CONSTRAINT [CPK_owner_link_type_code] PRIMARY KEY CLUSTERED ([linked_cd] ASC)
);


GO

