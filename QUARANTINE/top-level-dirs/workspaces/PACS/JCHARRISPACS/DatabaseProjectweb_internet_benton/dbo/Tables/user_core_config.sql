CREATE TABLE [dbo].[user_core_config] (
    [user_id]       INT           NOT NULL,
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_user_core_config] PRIMARY KEY CLUSTERED ([user_id] ASC, [szGroup] ASC, [szConfigName] ASC)
);


GO

