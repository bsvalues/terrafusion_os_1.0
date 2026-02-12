-- =============================================
-- Author:		Oleksandr Tedikov
-- Create date: 04/23/2008
-- Task #4814: Coding - Add Linked Owner Search to Property Search & Taxpayer Search
-- Description:	Function gets linked owners
-- names and link type codes be given parameters.
--Test: select dbo.fn_GetLinkedOwners(10073, 0, 2006)
-- =============================================
create FUNCTION fn_GetLinkedOwners
(
	@prop_id int,
	@sup_num int,
	@year int
)
RETURNS varchar(max)
AS
BEGIN

	DECLARE @linkedOwnersList varchar(max)
	SET @linkedOwnersList = ''

	SELECT @linkedOwnersList = 
		(case when @linkedOwnersList = '' then '' else @linkedOwnersList + ', ' end) 
		+ A.file_as_name + ' (' + ISNULL(PLO.link_type_cd, '') + ')'
	FROM prop_linked_owner PLO
	INNER JOIN account A ON A.acct_id = PLO.owner_id
	WHERE PLO.prop_id = @prop_id
		AND PLO.sup_num = @sup_num
		AND PLO.prop_val_yr = @year
	ORDER BY a.file_as_name

	RETURN @linkedOwnersList

END

GO

