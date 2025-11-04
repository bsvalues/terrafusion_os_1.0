CREATE TABLE [dbo].[penpad_db_objects] (
    [szObjectName]    VARCHAR (255) NOT NULL,
    [szObjectType]    CHAR (2)      NOT NULL,
    [bCheckOut]       BIT           NOT NULL,
    [bCheckIn]        BIT           NOT NULL,
    [szPIDColumnName] VARCHAR (255) NULL,
    [lOrder]          INT           NULL,
    CONSTRAINT [CPK_penpad_db_objects] PRIMARY KEY CLUSTERED ([szObjectName] ASC, [szObjectType] ASC) WITH (FILLFACTOR = 90)
);


GO

