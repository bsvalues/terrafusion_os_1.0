CREATE TABLE [dbo].[__importpi_1_pip_type_cd] (
    [penalty_interest_property_type_cd]   VARCHAR (10) NOT NULL,
    [penalty_interest_property_type_desc] VARCHAR (50) NULL,
    [personal]                            BIT          NULL,
    [priority]                            INT          NULL,
    PRIMARY KEY CLUSTERED ([penalty_interest_property_type_cd] ASC)
);


GO

