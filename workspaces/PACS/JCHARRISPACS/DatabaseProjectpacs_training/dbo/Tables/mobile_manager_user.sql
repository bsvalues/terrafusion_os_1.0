CREATE TABLE [dbo].[mobile_manager_user] (
    [identifier] VARCHAR (50) CONSTRAINT [DF_Table_1_mobile_manager_user] DEFAULT ('unknown') NOT NULL,
    [accessList] VARCHAR (50) NULL,
    CONSTRAINT [PK_mobile_manager_user] PRIMARY KEY CLUSTERED ([identifier] ASC)
);


GO

