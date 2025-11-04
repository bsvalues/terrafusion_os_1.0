
CREATE PROCEDURE APOPH

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


SELECT RTRIM(phone_type_cd) + ': ' + phone_num as phone
FROM _arb_protest as ap
WITH (NOLOCK)

INNER JOIN prop_supp_assoc as psa
WITH (NOLOCK)
ON ap.prop_id = psa.prop_id
AND ap.prop_val_yr = psa.owner_tax_yr

INNER JOIN owner as o
WITH (NOLOCK)
ON psa.prop_id = o.prop_id
AND psa.owner_tax_yr = o.owner_tax_yr
AND psa.sup_num = o.sup_num

INNER JOIN phone
WITH (NOLOCK)
ON o.owner_id = phone.acct_id

WHERE ap.case_id = @case_id
AND ap.prop_val_yr = @prop_val_yr
AND phone_num IS NOT NULL

GO

