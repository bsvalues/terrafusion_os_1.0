CREATE TABLE [dbo].[life_cycle] (
    [life_cycle_cd]   VARCHAR (20) NOT NULL,
    [life_cycle_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_life_cycle] PRIMARY KEY CLUSTERED ([life_cycle_cd] ASC)
);


GO

