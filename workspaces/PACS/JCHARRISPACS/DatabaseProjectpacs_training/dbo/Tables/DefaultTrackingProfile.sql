CREATE TABLE [dbo].[DefaultTrackingProfile] (
    [Version]            VARCHAR (32) NOT NULL,
    [TrackingProfileXml] NTEXT        NOT NULL,
    [InsertDateTime]     DATETIME     DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [CPK_DefaultTrackingProfile] PRIMARY KEY CLUSTERED ([Version] ASC)
);


GO

