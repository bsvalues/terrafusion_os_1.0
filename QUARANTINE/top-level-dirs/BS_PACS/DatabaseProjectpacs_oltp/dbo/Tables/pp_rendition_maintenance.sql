CREATE TABLE [dbo].[pp_rendition_maintenance] (
    [Segment]     VARCHAR (50) NOT NULL,
    [Type]        CHAR (10)    NOT NULL,
    [Quality]     CHAR (5)     NOT NULL,
    [Density]     CHAR (5)     NOT NULL,
    [Class]       CHAR (5)     NOT NULL,
    [State]       CHAR (5)     NOT NULL,
    [Dep_type_cd] CHAR (5)     NOT NULL,
    [Dep_cd]      CHAR (10)    NOT NULL,
    CONSTRAINT [CPK_pp_rendition_maintenance] PRIMARY KEY CLUSTERED ([Segment] ASC, [Type] ASC, [Quality] ASC, [Density] ASC, [Class] ASC, [State] ASC, [Dep_type_cd] ASC, [Dep_cd] ASC)
);


GO

