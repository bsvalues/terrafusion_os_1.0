



CREATE PROCEDURE SetHSCapPrevReapprYr

AS

declare @owner_tax_yr numeric(4,0)

declare PROP_YEAR scroll cursor
for select distinct owner_tax_yr
from prop_supp_assoc
order by owner_tax_yr desc

open PROP_YEAR
fetch next from PROP_YEAR into @owner_tax_yr

while (@@FETCH_STATUS = 0)
begin
	update property_val set hscap_prev_reappr_yr = (
							select last_appraisal_yr 
							from property_val as pv, prop_supp_assoc as psa
					                where pv.prop_val_yr 	= @owner_tax_yr -1
							and   pv.prop_id 	= property_val.prop_id
							and   pv.prop_id 	= psa.prop_id
							and   pv.sup_num 	= psa.sup_num
							and   pv.prop_val_yr 	= psa.owner_tax_yr
							)
	where prop_val_yr = @owner_tax_yr
	and   hscap_prev_reappr_yr is null

	fetch next from PROP_YEAR into @owner_tax_yr
end

close PROP_YEAR
deallocate PROP_YEAR

GO

