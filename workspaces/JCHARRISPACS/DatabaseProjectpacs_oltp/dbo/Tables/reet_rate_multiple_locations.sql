CREATE TABLE [dbo].[reet_rate_multiple_locations] (
    [reet_id]     INT             NOT NULL,
    [county_name] VARCHAR (50)    NOT NULL,
    [state_REET]  NUMERIC (11, 2) NULL,
    [local_REET]  NUMERIC (11, 2) NULL,
    PRIMARY KEY CLUSTERED ([reet_id] ASC, [county_name] ASC)
);


GO

