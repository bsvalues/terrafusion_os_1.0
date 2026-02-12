CREATE TABLE [dbo].[fin_ap_import_status] (
    [import_status_cd]       VARCHAR (20) NOT NULL,
    [status_description]     VARCHAR (50) NULL,
    [disbursement_status_cd] VARCHAR (20) NULL,
    CONSTRAINT [CPK_fin_ap_import_status] PRIMARY KEY CLUSTERED ([import_status_cd] ASC),
    CONSTRAINT [CFK_fin_ap_import_status_disbursement_status_cd] FOREIGN KEY ([disbursement_status_cd]) REFERENCES [dbo].[disbursement_status] ([status_cd])
);


GO

