CREATE TABLE [dbo].[ms_log] (
    [id]        INT            IDENTITY (1, 1) NOT NULL,
    [date]      DATETIME       NOT NULL,
    [thread]    VARCHAR (255)  NOT NULL,
    [level]     VARCHAR (50)   NOT NULL,
    [logger]    VARCHAR (255)  NOT NULL,
    [message]   VARCHAR (4000) NOT NULL,
    [exception] VARCHAR (2000) NULL,
    CONSTRAINT [CPK_ms_log] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

