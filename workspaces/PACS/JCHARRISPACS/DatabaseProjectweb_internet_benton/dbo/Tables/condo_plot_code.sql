CREATE TABLE [dbo].[condo_plot_code] (
    [plot_cd]   VARCHAR (10) NOT NULL,
    [plot_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_condo_plot_code] PRIMARY KEY CLUSTERED ([plot_cd] ASC)
);


GO

