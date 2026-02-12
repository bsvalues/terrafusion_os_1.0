CREATE TABLE [dbo].[imprv_type] (
    [imprv_type_cd]        CHAR (5)     NOT NULL,
    [imprv_type_desc]      VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [mobile_home]          CHAR (1)     NULL,
    [bAllowDetailUseBase]  BIT          NOT NULL,
    [bMultiplyStoriesSQFT] BIT          NULL,
    [bMultiSalePrimary]    BIT          NOT NULL,
    [is_permanent_crop]    BIT          NOT NULL,
    [ms_type]              CHAR (1)     NOT NULL,
    [rc_type]              CHAR (1)     NULL,
    CONSTRAINT [CPK_imprv_type] PRIMARY KEY CLUSTERED ([imprv_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

