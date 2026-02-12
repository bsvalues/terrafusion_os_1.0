CREATE TABLE [dbo].[taxableBalance] (
    [prop_id]       INT           NOT NULL,
    [snrSource]     DECIMAL (10)  NULL,
    [PPSource]      DECIMAL (10)  NULL,
    [MKIMP]         DECIMAL (10)  NULL,
    [MKLND]         DECIMAL (10)  NULL,
    [MKTTL]         DECIMAL (10)  NULL,
    [NEWCO]         DECIMAL (10)  NULL,
    [CUIMP]         DECIMAL (10)  NULL,
    [CULND]         DECIMAL (10)  NULL,
    [TVS]           DECIMAL (10)  NULL,
    [TVR]           DECIMAL (10)  NULL,
    [ag_loss]       NUMERIC (15)  NULL,
    [tax_area]      VARCHAR (23)  NULL,
    [pacsTaxable]   NUMERIC (15)  NULL,
    [diff]          NUMERIC (16)  NULL,
    [HSLand]        INT           NULL,
    [HSImp]         INT           NULL,
    [use_cd]        VARCHAR (10)  NULL,
    [exemptions]    VARCHAR (100) NULL,
    [prop_type]     CHAR (5)      NULL,
    [pacsSNRFrozen] NUMERIC (15)  NULL,
    [pacsMarket]    NUMERIC (14)  NULL,
    [prop_val_yr]   NUMERIC (4)   NOT NULL
);


GO

