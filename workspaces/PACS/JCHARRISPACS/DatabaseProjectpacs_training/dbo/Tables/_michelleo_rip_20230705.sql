CREATE TABLE [dbo].[_michelleo_rip_20230705] (
    [reet_id]           INT             NOT NULL,
    [prop_id]           INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [sup_num]           INT             NOT NULL,
    [land_use_cd]       VARCHAR (10)    NOT NULL,
    [location_cd]       VARCHAR (10)    NULL,
    [parcel_segregated] BIT             NOT NULL,
    [legal_desc]        VARCHAR (500)   NOT NULL,
    [taxable_val]       NUMERIC (14)    NOT NULL,
    [prop_type_cd]      CHAR (10)       NOT NULL,
    [situs_display]     VARCHAR (173)   NULL,
    [dor_use_cd]        VARCHAR (10)    NULL,
    [sale_price]        NUMERIC (11, 2) NULL,
    [sale_percent]      NUMERIC (5, 2)  NULL,
    [state_REET]        NUMERIC (12, 2) NULL,
    [local_REET]        NUMERIC (12, 2) NULL
);


GO

