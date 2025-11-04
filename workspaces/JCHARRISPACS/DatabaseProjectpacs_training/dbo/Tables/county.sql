CREATE TABLE [dbo].[county] (
    [county_cd]   VARCHAR (3)  NOT NULL,
    [state_cd]    CHAR (2)     NOT NULL,
    [county_name] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_county] PRIMARY KEY CLUSTERED ([county_cd] ASC, [state_cd] ASC)
);


GO

