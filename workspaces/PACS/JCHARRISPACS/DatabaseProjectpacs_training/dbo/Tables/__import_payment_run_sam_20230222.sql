CREATE TABLE [dbo].[__import_payment_run_sam_20230222] (
    [payment_run_id]    INT          NOT NULL,
    [payment_id]        INT          NOT NULL,
    [pacs_user_id]      INT          NOT NULL,
    [status]            CHAR (5)     NOT NULL,
    [updated_date]      DATETIME     NULL,
    [paid_date]         DATETIME     NULL,
    [payment_run_type]  CHAR (5)     NOT NULL,
    [payment_post_date] DATETIME     NULL,
    [single_payment]    BIT          NOT NULL,
    [description]       VARCHAR (50) NULL
);


GO

