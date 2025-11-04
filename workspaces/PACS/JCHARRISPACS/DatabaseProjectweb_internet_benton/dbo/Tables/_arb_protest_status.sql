CREATE TABLE [dbo].[_arb_protest_status] (
    [status_cd]             VARCHAR (10) NOT NULL,
    [status_desc]           VARCHAR (50) NULL,
    [generate_letter]       CHAR (1)     NULL,
    [letter_type]           INT          NULL,
    [close_case]            CHAR (1)     NULL,
    [sys_flag]              CHAR (1)     NULL,
    [arbitration_letter_id] INT          NULL,
    [inquiry_only]          BIT          NULL,
    CONSTRAINT [CPK__arb_protest_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

