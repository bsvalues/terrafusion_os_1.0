CREATE TABLE [dbo].[PhotoMaps] (
    [Id]          INT            IDENTITY (1, 1) NOT NULL,
    [PacsImageId] NVARCHAR (MAX) NOT NULL,
    [CCImageId]   NVARCHAR (MAX) NULL,
    CONSTRAINT [PK_dbo.PhotoMaps] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

