CREATE TABLE [dbo].[escrow_type] (
    [escrow_type_cd]   VARCHAR (20) NOT NULL,
    [escrow_type_desc] VARCHAR (30) NULL,
    [year]             NUMERIC (4)  NOT NULL,
    [start_date]       DATETIME     NULL,
    [print_cert]       BIT          NOT NULL,
    [land_calculate]   BIT          NOT NULL,
    [land_percent]     INT          NOT NULL,
    [land_lock]        BIT          NOT NULL,
    [imprv_calculate]  BIT          NOT NULL,
    [imprv_percent]    INT          NOT NULL,
    [imprv_lock]       BIT          NOT NULL,
    [sa_calculate]     BIT          NOT NULL,
    [sa_percent]       INT          NOT NULL,
    [sa_lock]          BIT          NOT NULL,
    [default_pay_full] BIT          NOT NULL,
    [is_flexible]      BIT          NOT NULL,
    CONSTRAINT [CPK_escrow_type] PRIMARY KEY CLUSTERED ([year] ASC, [escrow_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

