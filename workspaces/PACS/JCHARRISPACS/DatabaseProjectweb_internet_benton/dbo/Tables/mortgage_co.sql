CREATE TABLE [dbo].[mortgage_co] (
    [mortgage_co_id] INT          NOT NULL,
    [mortgage_cd]    VARCHAR (10) NULL,
    [taxserver]      VARCHAR (30) NULL,
    [taxserver_id]   INT          NULL,
    [lender_num]     VARCHAR (30) NULL,
    CONSTRAINT [CPK_mortgage_co] PRIMARY KEY CLUSTERED ([mortgage_co_id] ASC) WITH (FILLFACTOR = 90)
);


GO

