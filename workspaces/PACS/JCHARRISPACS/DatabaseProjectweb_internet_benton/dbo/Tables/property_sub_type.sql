CREATE TABLE [dbo].[property_sub_type] (
    [property_sub_cd]        VARCHAR (5)  NOT NULL,
    [property_sub_desc]      VARCHAR (20) NOT NULL,
    [residential]            BIT          NULL,
    [commercial]             BIT          NULL,
    [state_assessed_utility] BIT          NULL,
    [local_assessed_utility] BIT          NULL,
    [farm]                   BIT          NULL,
    [leased]                 BIT          NULL,
    [industrial]             BIT          NULL,
    [prop_type]              CHAR (5)     NULL,
    [boat]                   BIT          NULL,
    [state_bid_timber]       BIT          NULL,
    [imp_leased_land]        BIT          NOT NULL,
    [facility_type]          CHAR (1)     NULL,
    CONSTRAINT [CPK_property_sub_type] PRIMARY KEY CLUSTERED ([property_sub_cd] ASC)
);


GO

