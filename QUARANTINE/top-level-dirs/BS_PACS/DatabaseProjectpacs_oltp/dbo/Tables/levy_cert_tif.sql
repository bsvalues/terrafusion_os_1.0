CREATE TABLE [dbo].[levy_cert_tif] (
    [levy_cert_run_id]                  INT          NOT NULL,
    [year]                              NUMERIC (4)  NOT NULL,
    [tax_district_id]                   INT          NOT NULL,
    [levy_cd]                           VARCHAR (10) NOT NULL,
    [tif_area_id]                       INT          NOT NULL,
    [tif_non_senior_increment]          NUMERIC (14) NULL,
    [tif_senior_increment]              NUMERIC (14) NULL,
    [tif_non_senior_increment_override] BIT          CONSTRAINT [CDF_levy_cert_tif_tif_increment_override] DEFAULT ((0)) NOT NULL,
    [tif_senior_increment_override]     BIT          CONSTRAINT [CDF_levy_cert_tif_tif_senior_increment_override] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_levy_cert_tif] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [tif_area_id] ASC)
);


GO

