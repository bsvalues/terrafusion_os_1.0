CREATE TABLE [dbo].[penalty_interest_property_type] (
    [penalty_interest_property_type_cd]   VARCHAR (10) NOT NULL,
    [penalty_interest_property_type_desc] VARCHAR (50) NULL,
    [personal]                            BIT          NOT NULL,
    [priority]                            INT          NOT NULL,
    CONSTRAINT [CPK_penalty_interest_property_type] PRIMARY KEY CLUSTERED ([penalty_interest_property_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

