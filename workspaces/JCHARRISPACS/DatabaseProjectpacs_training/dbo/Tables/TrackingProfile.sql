CREATE TABLE [dbo].[TrackingProfile] (
    [TrackingProfileId]  INT          IDENTITY (1, 1) NOT NULL,
    [Version]            VARCHAR (32) NOT NULL,
    [WorkflowTypeId]     INT          NOT NULL,
    [TrackingProfileXml] NTEXT        NULL,
    [InsertDateTime]     DATETIME     DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [CFK_TrackingProfile_WorkflowTypeId] FOREIGN KEY ([WorkflowTypeId]) REFERENCES [dbo].[Type] ([TypeId])
);


GO

CREATE UNIQUE CLUSTERED INDEX [idx_WorkflowTypeId_Version]
    ON [dbo].[TrackingProfile]([WorkflowTypeId] ASC, [Version] ASC) WITH (IGNORE_DUP_KEY = ON);


GO

