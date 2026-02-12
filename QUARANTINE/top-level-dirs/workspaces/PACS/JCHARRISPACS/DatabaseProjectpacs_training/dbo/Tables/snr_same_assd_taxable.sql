CREATE TABLE [dbo].[snr_same_assd_taxable] (
    [prop_id]       INT          NOT NULL,
    [snrSource]     DECIMAL (10) NULL,
    [PPSource]      DECIMAL (10) NULL,
    [MKIMP]         DECIMAL (10) NULL,
    [MKLND]         DECIMAL (10) NULL,
    [MKTTL]         DECIMAL (10) NULL,
    [NEWCO]         DECIMAL (10) NULL,
    [CUIMP]         DECIMAL (10) NULL,
    [CULND]         DECIMAL (10) NULL,
    [TVS]           DECIMAL (10) NULL,
    [HSLand]        INT          NULL,
    [HSImp]         INT          NULL,
    [pacsSNRFrozen] NUMERIC (15) NULL,
    [pacsMarket]    NUMERIC (14) NULL,
    [pacsTaxable]   NUMERIC (15) NULL,
    [prop_val_yr]   NUMERIC (4)  NOT NULL
);


GO

