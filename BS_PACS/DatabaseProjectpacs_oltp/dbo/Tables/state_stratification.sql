CREATE TABLE [dbo].[state_stratification] (
    [state_cd] VARCHAR (5) NOT NULL,
    [range]    INT         NOT NULL,
    CONSTRAINT [CPK_state_stratification] PRIMARY KEY CLUSTERED ([state_cd] ASC, [range] ASC) WITH (FILLFACTOR = 90)
);


GO

