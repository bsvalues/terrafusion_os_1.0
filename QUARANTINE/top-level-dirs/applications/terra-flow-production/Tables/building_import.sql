CREATE TABLE [permit].[building_import] (
    [buildingimportid]    BIGINT         IDENTITY (1, 1) NOT NULL,
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
    [LoadDate]            DATETIME       CONSTRAINT [DF__building___LoadD__5EBF139D] DEFAULT (getdate()) NULL,
    [UpdatedDate]         DATETIME       CONSTRAINT [DF__building___Updat__5FB337D6] DEFAULT (getdate()) NULL,
    [taxlot_found]        BIT            NULL,
    [prop_id]             INT            NULL,
    [bldg_permit_id]      INT            NULL,
    [prop_type]           VARCHAR (10)   NULL,
    [LastAttemptedImport] DATETIME       NULL,
    CONSTRAINT [PK_building_import] PRIMARY KEY CLUSTERED ([buildingimportid] ASC)
);


GO

