CREATE TABLE [dbo].[mobile_manager_session] (
    [session_id]    INT           IDENTITY (1, 1) NOT NULL,
    [session_key]   VARCHAR (255) DEFAULT (NULL) NOT NULL,
    [last_update]   DATETIME      DEFAULT (NULL) NULL,
    [userName]      VARCHAR (45)  DEFAULT (NULL) NOT NULL,
    [ip]            VARCHAR (45)  DEFAULT (NULL) NULL,
    [user_agent]    VARCHAR (255) DEFAULT (NULL) NOT NULL,
    [create_dt]     DATETIME      NOT NULL,
    [logged_out]    INT           NULL,
    [logged_out_dt] DATETIME      DEFAULT (NULL) NULL,
    PRIMARY KEY CLUSTERED ([session_id] ASC)
);


GO

