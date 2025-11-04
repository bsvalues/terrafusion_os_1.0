CREATE TABLE [dbo].[arb_inquiry_additional_status] (
    [status_cd]       VARCHAR (10) NOT NULL,
    [status_desc]     VARCHAR (50) NOT NULL,
    [generate_letter] BIT          NOT NULL,
    [letter_type]     INT          NULL,
    [close_case]      BIT          NOT NULL,
    [sys_flag]        BIT          NOT NULL,
    CONSTRAINT [CPK_arb_inquiry_additional_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

