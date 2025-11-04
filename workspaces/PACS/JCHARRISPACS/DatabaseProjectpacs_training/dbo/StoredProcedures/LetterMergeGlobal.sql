
CREATE PROCEDURE LetterMergeGlobal
	@id1 int,
	@id2 int,
	@year numeric(4,0) = null,
	@sup_num int = null

AS

declare @currentDate datetime
declare @dateName varchar(20)
set @currentDate = GETDATE()
set @dateName = DATENAME(MM, @currentDate)

SELECT CONVERT(VARCHAR(20), @currentDate, 100) as 'default_date',
	CONVERT(VARCHAR(8), @currentDate, 1) AS 'mmddyy',
	CONVERT(VARCHAR(8), @currentDate, 1) + RIGHT(CONVERT(VARCHAR(50), @currentDate, 100), 8) AS 'mmddyyhhmm',
	CONVERT(VARCHAR(10), @currentDate, 101) AS 'mmddyyyy',
	CONVERT(VARCHAR(10), @currentDate, 101) + RIGHT(CONVERT(VARCHAR(50), @currentDate, 100), 8) AS 'mmddyyyyhhmm',
	@dateName + RIGHT(CONVERT(VARCHAR(12), @currentDate, 107), 9) AS 'monthddyyyy',
	@dateName + RIGHT(CONVERT(VARCHAR(50), @currentDate, 100), 15)  AS 'monthddyyyyhhmm'

GO

