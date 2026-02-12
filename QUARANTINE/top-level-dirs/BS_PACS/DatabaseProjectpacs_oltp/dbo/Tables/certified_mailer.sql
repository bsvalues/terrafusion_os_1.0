CREATE TABLE [dbo].[certified_mailer] (
    [prop_val_yr]               NUMERIC (4)     NOT NULL,
    [case_id]                   INT             NOT NULL,
    [certified_mailer_batch_id] INT             NOT NULL,
    [mailer_type]               INT             NOT NULL,
    [prop_id]                   INT             NOT NULL,
    [agent_id]                  VARCHAR (30)    NULL,
    [owner_id]                  INT             NOT NULL,
    [legal_desc]                VARCHAR (255)   NULL,
    [owner_name]                VARCHAR (255)   NULL,
    [real_est_val_bef]          NUMERIC (19, 2) NULL,
    [pers_prop_val_bef]         NUMERIC (19, 2) NULL,
    [ag_val_bef]                NUMERIC (19, 2) NULL,
    [real_est_val_aft]          NUMERIC (19, 2) NULL,
    [pers_prop_val_aft]         NUMERIC (19, 2) NULL,
    [ag_val_aft]                NUMERIC (19, 2) NULL,
    [hear_dt]                   SMALLDATETIME   NULL,
    [acct_id]                   INT             NOT NULL,
    [mail_to_addr]              VARCHAR (100)   NULL,
    [owner_addr]                VARCHAR (100)   NULL,
    [status_cd]                 VARCHAR (50)    NULL,
    [cert_mail_cd]              VARCHAR (50)    NULL,
    [prot_by_id]                INT             NOT NULL,
    [qualify]                   BIT             NULL,
    [generate_cm]               BIT             NULL,
    [prop_type_cd]              CHAR (5)        NULL,
    [udi_parent]                BIT             NULL,
    [sup_num]                   INT             NULL,
    CONSTRAINT [CPK_certified_mailer] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [case_id] ASC, [owner_id] ASC, [prot_by_id] ASC) WITH (FILLFACTOR = 90)
);


GO

