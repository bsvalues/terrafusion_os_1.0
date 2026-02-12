CREATE TABLE [dbo].[next_cert_mail_id] (
    [next_cert_mail_id] INT          NOT NULL,
    [first_mail_id]     INT          NOT NULL,
    [last_mail_id]      INT          NOT NULL,
    [cert_mail_cd]      VARCHAR (50) NOT NULL,
    [serv_type]         VARCHAR (5)  NOT NULL,
    [cust_id]           VARCHAR (16) NOT NULL,
    CONSTRAINT [CPK_next_cert_mail_id] PRIMARY KEY CLUSTERED ([next_cert_mail_id] ASC)
);


GO

