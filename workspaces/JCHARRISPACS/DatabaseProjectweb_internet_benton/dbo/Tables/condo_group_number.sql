CREATE TABLE [dbo].[condo_group_number] (
    [condo_group_cd]   VARCHAR (10) NOT NULL,
    [condo_group_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_group_number] PRIMARY KEY CLUSTERED ([condo_group_cd] ASC)
);


GO

