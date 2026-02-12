CREATE TABLE [dbo].[UpgradeInfo] (
    [Item]   NVARCHAR (260) NOT NULL,
    [Status] NVARCHAR (512) NULL,
    CONSTRAINT [PK_UpgradeInfo] PRIMARY KEY CLUSTERED ([Item] ASC)
);


GO

