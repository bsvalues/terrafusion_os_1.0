
CREATE PROCEDURE APRSN

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end


	SELECT reason_desc
	FROM _arb_protest_reason as apr
	WITH (NOLOCK)
	INNER JOIN _arb_protest_reason_cd as aprc
	WITH (NOLOCK)
	ON apr.reason_cd = aprc.reason_cd

	WHERE case_id = @case_id
	AND prop_val_yr = @prop_val_yr

	ORDER BY apr.reason_cd

GO

