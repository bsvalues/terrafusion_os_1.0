CREATE TABLE [dbo].[_jamesw_escrow_20240517] (
    [escrow_id]       INT             NOT NULL,
    [escrow_type_cd]  VARCHAR (20)    NOT NULL,
    [prop_id]         INT             NULL,
    [owner_id]        INT             NULL,
    [year]            NUMERIC (4)     NULL,
    [date_created]    DATETIME        NULL,
    [pacs_user_id]    INT             NULL,
    [amount_due]      NUMERIC (14, 2) NOT NULL,
    [amount_paid]     NUMERIC (14, 2) NOT NULL,
    [comment]         VARCHAR (80)    NULL,
    [batch_id]        INT             NULL,
    [source_ref_id]   INT             NULL,
    [source_ref_type] CHAR (10)       NULL,
    [display_year]    NUMERIC (5)     NULL,
    [cnv_xref]        VARCHAR (50)    NULL,
    [pay_status]      CHAR (1)        NOT NULL,
    [due_date]        DATETIME        NULL,
    [segregated]      BIT             NOT NULL,
    [new_worksheet]   BIT             NOT NULL,
    [locking_applied] BIT             NOT NULL,
    [amount_applied]  NUMERIC (14, 2) NOT NULL
);


GO

