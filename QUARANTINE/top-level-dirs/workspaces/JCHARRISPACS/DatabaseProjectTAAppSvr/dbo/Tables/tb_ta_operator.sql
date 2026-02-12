CREATE TABLE [dbo].[tb_ta_operator] (
    [lOperatorID]     INT          IDENTITY (1, 1) NOT NULL,
    [szOperatorName]  VARCHAR (63) NOT NULL,
    [szOperatorEmail] VARCHAR (63) NOT NULL,
    CONSTRAINT [CPK_tb_ta_operator] PRIMARY KEY CLUSTERED ([lOperatorID] ASC) WITH (FILLFACTOR = 100)
);


GO

