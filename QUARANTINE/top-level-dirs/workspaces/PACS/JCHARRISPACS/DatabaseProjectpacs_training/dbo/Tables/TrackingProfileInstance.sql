CREATE TABLE [dbo].[TrackingProfileInstance] (
    [InstanceId]         UNIQUEIDENTIFIER NOT NULL,
    [TrackingProfileXml] NTEXT            NULL,
    [UpdatedDateTime]    DATETIME         DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [CPK_TrackingProfileInstance] PRIMARY KEY NONCLUSTERED ([InstanceId] ASC)
);


GO

