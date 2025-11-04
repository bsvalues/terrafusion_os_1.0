CREATE TABLE [dbo].[voided_excise_reet_property] (
    [excise_number]     INT           NOT NULL,
    [reet_id]           INT           NOT NULL,
    [prop_id]           INT           NOT NULL,
    [year]              NUMERIC (4)   NOT NULL,
    [sup_num]           INT           NOT NULL,
    [taxable_val]       NUMERIC (14)  NOT NULL,
    [prop_type_cd]      CHAR (10)     NOT NULL,
    [legal_desc]        VARCHAR (500) NOT NULL,
    [land_use_cd]       VARCHAR (10)  NOT NULL,
    [parcel_segregated] BIT           NOT NULL,
    [location_cd]       VARCHAR (4)   NULL,
    [situs_display]     VARCHAR (141) NOT NULL,
    [dor_use_cd]        VARCHAR (10)  NULL,
    CONSTRAINT [CPK_voided_excise_reet_property] PRIMARY KEY CLUSTERED ([excise_number] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_voided_excise_reet_property_excise_number] FOREIGN KEY ([excise_number]) REFERENCES [dbo].[voided_excise_reet] ([excise_number])
);


GO

