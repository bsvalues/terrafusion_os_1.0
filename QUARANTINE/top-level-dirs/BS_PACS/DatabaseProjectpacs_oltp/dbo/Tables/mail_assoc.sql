CREATE TABLE [dbo].[mail_assoc] (
    [ref_id1]      INT           NOT NULL,
    [ref_type]     VARCHAR (2)   NOT NULL,
    [val_yr]       INT           NULL,
    [mail_id]      VARCHAR (50)  NOT NULL,
    [serv_type]    VARCHAR (20)  NULL,
    [cust_id]      VARCHAR (20)  NULL,
    [date_printed] SMALLDATETIME NULL,
    [lMailAssocID] INT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_mail_assoc] PRIMARY KEY CLUSTERED ([lMailAssocID] ASC) WITH (FILLFACTOR = 100)
);


GO

