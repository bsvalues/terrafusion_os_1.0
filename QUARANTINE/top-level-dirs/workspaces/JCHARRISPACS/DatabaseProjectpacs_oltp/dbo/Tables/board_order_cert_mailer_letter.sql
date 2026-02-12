CREATE TABLE [dbo].[board_order_cert_mailer_letter] (
    [prop_val_yr]                 NUMERIC (4)     NOT NULL,
    [case_id]                     INT             NOT NULL,
    [board_order_letter_batch_id] INT             NOT NULL,
    [mailer_type]                 INT             NOT NULL,
    [prop_id]                     INT             NOT NULL,
    [agent_id]                    VARCHAR (30)    NULL,
    [owner_id]                    INT             NOT NULL,
    [legal_desc]                  VARCHAR (255)   NULL,
    [owner_name]                  VARCHAR (255)   NULL,
    [real_est_val_bef]            NUMERIC (19, 2) NULL,
    [pers_prop_val_bef]           NUMERIC (19, 2) NULL,
    [ag_val_bef]                  NUMERIC (19, 2) NULL,
    [real_est_val_aft]            NUMERIC (19, 2) NULL,
    [pers_prop_val_aft]           NUMERIC (19, 2) NULL,
    [ag_val_aft]                  NUMERIC (19, 2) NULL,
    [hear_dt]                     SMALLDATETIME   NULL,
    [acct_id]                     INT             NOT NULL,
    [mail_to_addr]                VARCHAR (100)   NULL,
    [owner_addr]                  VARCHAR (100)   NULL,
    [status_cd]                   VARCHAR (50)    NULL,
    [cert_mail_cd]                VARCHAR (50)    NULL,
    [prot_by_id]                  INT             NOT NULL,
    [group_id]                    INT             NOT NULL,
    [sub_batch_id]                INT             NOT NULL,
    CONSTRAINT [CPK_board_order_cert_mailer_letter] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [case_id] ASC, [prop_id] ASC, [prot_by_id] ASC, [board_order_letter_batch_id] ASC) WITH (FILLFACTOR = 90)
);


GO

