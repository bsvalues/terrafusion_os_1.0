CREATE TABLE [dbo].[TrackingPartitionSetName] (
    [PartitionId]       INT          IDENTITY (1, 1) NOT NULL,
    [Name]              VARCHAR (32) NOT NULL,
    [CreatedDateTime]   DATETIME     DEFAULT (getutcdate()) NOT NULL,
    [EndDateTime]       DATETIME     NULL,
    [PartitionInterval] CHAR (1)     NOT NULL
);


GO

