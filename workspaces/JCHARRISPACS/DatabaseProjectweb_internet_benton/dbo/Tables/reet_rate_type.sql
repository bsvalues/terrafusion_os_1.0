CREATE TABLE [dbo].[reet_rate_type] (
    [rate_type_cd]   VARCHAR (10) NOT NULL,
    [rate_type_desc] VARCHAR (50) NOT NULL,
    [local_or_state] BIT          NOT NULL,
    CONSTRAINT [CPK_reet_rate_type] PRIMARY KEY CLUSTERED ([rate_type_cd] ASC)
);


GO

