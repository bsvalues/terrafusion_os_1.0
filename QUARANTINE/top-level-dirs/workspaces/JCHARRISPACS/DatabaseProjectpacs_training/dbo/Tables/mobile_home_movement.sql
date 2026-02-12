CREATE TABLE [dbo].[mobile_home_movement] (
    [mobile_home_movement_cd]   VARCHAR (10) NOT NULL,
    [mobile_home_movement_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_ mobile_home_movement] PRIMARY KEY CLUSTERED ([mobile_home_movement_cd] ASC)
);


GO

