CREATE TABLE [dbo].[voided_excise_reet] (
    [excise_number]             INT             NOT NULL,
    [reet_id]                   INT             NOT NULL,
    [payment_id]                INT             NOT NULL,
    [partial_sale]              BIT             NOT NULL,
    [imp_city]                  VARCHAR (150)   NULL,
    [imp_forestland_flag]       BIT             NULL,
    [imp_open_space_flag]       BIT             NULL,
    [imp_historic_flag]         BIT             NULL,
    [imp_continuance_flag]      BIT             NULL,
    [pers_prop_description]     VARCHAR (255)   NULL,
    [exemption_claimed]         BIT             NOT NULL,
    [wac_number_type_cd]        VARCHAR (32)    NULL,
    [wac_reason]                VARCHAR (255)   NULL,
    [instrument_type_cd]        CHAR (10)       NULL,
    [sale_date]                 DATETIME        NULL,
    [sale_price]                NUMERIC (11, 2) NULL,
    [pers_prop_included]        BIT             NOT NULL,
    [pers_prop_val]             NUMERIC (11, 2) NULL,
    [exemption_amount]          NUMERIC (11, 2) NULL,
    [completion_date]           DATETIME        NULL,
    [export_date]               DATETIME        NULL,
    [voided_date]               DATETIME        NULL,
    [state_excise_tax]          NUMERIC (14, 2) NULL,
    [local_excise_tax]          NUMERIC (14, 2) NULL,
    [state_delinquent_interest] NUMERIC (14, 2) NULL,
    [local_delinquent_interest] NUMERIC (14, 2) NULL,
    [delinquent_penalty]        NUMERIC (14, 2) NULL,
    [county_tech_fee]           NUMERIC (14, 2) NULL,
    [state_tech_fee]            NUMERIC (14, 2) NULL,
    [affidavit_processing_fee]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_voided_excise_reet] PRIMARY KEY CLUSTERED ([excise_number] ASC),
    CONSTRAINT [CFK_voided_excise_reet_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

