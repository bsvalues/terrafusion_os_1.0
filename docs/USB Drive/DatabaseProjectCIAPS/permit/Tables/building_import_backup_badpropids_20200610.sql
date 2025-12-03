CREATE TABLE [permit].[building_import_backup_badpropids_20200610] (
    [buildingimportid]    BIGINT         NOT NULL,
    [issuedate]           DATETIME       NULL,
    [permitno]            VARCHAR (100)  NULL,
    [customer_firstname]  VARCHAR (4000) NULL,
    [customer_lastname]   VARCHAR (4000) NULL,
    [contractor_lastname] VARCHAR (4000) NULL,
    [serviceaddress]      VARCHAR (4000) NULL,
    [lotownername]        VARCHAR (4000) NULL,
    [lotowneraddress]     VARCHAR (4000) NULL,
    [taxlot]              VARCHAR (100)  NULL,
    [permittype]          VARCHAR (4000) NULL,
    [DESCRIPTION]         VARCHAR (MAX)  NULL,
    [projectcost]         MONEY          NULL,
    [permitstatus]        VARCHAR (4000) NULL,
    [balance]             MONEY          NULL,
    [appno]               INT            NULL,
    [customerno]          INT            NULL,
    [lotno]               INT            NULL,
    [fileid]              INT            NOT NULL,
    [LoadDate]            DATETIME       NULL,
    [UpdatedDate]         DATETIME       NULL,
    [taxlot_found]        BIT            NULL,
    [prop_id]             INT            NULL,
    [bldg_permit_id]      INT            NULL,
    [prop_type]           VARCHAR (10)   NULL,
    [LastAttemptedImport] DATETIME       NULL
);


GO

