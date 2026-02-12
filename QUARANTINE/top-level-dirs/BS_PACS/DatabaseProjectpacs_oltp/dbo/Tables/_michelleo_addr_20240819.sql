CREATE TABLE [dbo].[_michelleo_addr_20240819] (
    [acct_id]            INT          NOT NULL,
    [addr_type_cd]       CHAR (5)     NOT NULL,
    [primary_addr]       CHAR (1)     NULL,
    [addr_line1]         VARCHAR (60) NULL,
    [addr_line2]         VARCHAR (60) NULL,
    [addr_line3]         VARCHAR (60) NULL,
    [addr_city]          VARCHAR (50) NULL,
    [addr_state]         VARCHAR (50) NULL,
    [country_cd]         CHAR (5)     NULL,
    [ml_returned_dt]     DATETIME     NULL,
    [ml_type_cd]         CHAR (5)     NULL,
    [ml_deliverable]     CHAR (1)     NULL,
    [ml_return_type_cd]  CHAR (5)     NULL,
    [ml_returned_reason] VARCHAR (50) NULL,
    [cass_dt]            DATETIME     NULL,
    [delivery_point]     VARCHAR (2)  NULL,
    [carrier_route]      VARCHAR (5)  NULL,
    [check_digit]        VARCHAR (2)  NULL,
    [update_flag]        CHAR (1)     NULL,
    [chg_reason_cd]      CHAR (5)     NULL,
    [last_change_dt]     DATETIME     NULL,
    [zip]                VARCHAR (5)  NULL,
    [cass]               VARCHAR (4)  NULL,
    [route]              VARCHAR (2)  NULL,
    [addr_zip]           VARCHAR (10) NULL,
    [zip_4_2]            VARCHAR (14) NULL,
    [is_international]   BIT          NOT NULL
);


GO

