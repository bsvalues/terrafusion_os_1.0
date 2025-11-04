CREATE TABLE [dbo].[mort_phone_fix] (
    [acct_id]       INT          NOT NULL,
    [phone_id]      INT          NOT NULL,
    [phone_type_cd] CHAR (5)     NOT NULL,
    [phone_num]     VARCHAR (20) NULL,
    [is_primary]    BIT          NULL,
    [new_id]        INT          NOT NULL
);


GO

