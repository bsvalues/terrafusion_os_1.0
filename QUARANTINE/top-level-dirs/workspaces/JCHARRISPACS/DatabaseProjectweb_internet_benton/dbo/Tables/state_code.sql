CREATE TABLE [dbo].[state_code] (
    [state_cd]             CHAR (5)     NOT NULL,
    [state_cd_desc]        VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [ptd_state_cd]         VARCHAR (5)  NULL,
    [ptd_state_code]       VARCHAR (5)  NULL,
    [commercial_acct_flag] CHAR (1)     NOT NULL,
    [allow_website_images] BIT          NOT NULL,
    [sl_ratio_type_cd]     CHAR (5)     NULL,
    CONSTRAINT [CPK_state_code] PRIMARY KEY CLUSTERED ([state_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

