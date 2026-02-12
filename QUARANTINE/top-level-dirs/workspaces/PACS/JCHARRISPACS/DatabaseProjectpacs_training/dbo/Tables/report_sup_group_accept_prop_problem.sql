CREATE TABLE [dbo].[report_sup_group_accept_prop_problem] (
    [lPacsUserID]         INT         NOT NULL,
    [lYear]               NUMERIC (4) NOT NULL,
    [lSupNum]             INT         NOT NULL,
    [lPropID]             INT         NOT NULL,
    [bNotRecalculated]    BIT         NOT NULL,
    [bHasPTDRecalcErrors] BIT         NOT NULL,
    CONSTRAINT [CPK_report_sup_group_accept_prop_problem] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC, [lYear] ASC, [lSupNum] ASC, [lPropID] ASC) WITH (FILLFACTOR = 100)
);


GO

