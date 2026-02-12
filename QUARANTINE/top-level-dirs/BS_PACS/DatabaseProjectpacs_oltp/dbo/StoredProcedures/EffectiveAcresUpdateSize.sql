
CREATE  procedure EffectiveAcresUpdateSize

@lYear		numeric(4),
@lGroupID	int

as

declare @lLegalAcreage 	numeric(14,4)
declare @lPropID	int

-- get the total legal acreage in the group
select @lLegalAcreage = sum(isnull(pv.legal_acreage, 0))

from effective_acres_assoc eaa with(nolock)

join prop_supp_assoc psa
on psa.prop_id = eaa.prop_id
and psa.owner_tax_yr = eaa.prop_val_yr

join property_val pv
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num

where eaa.group_id = @lGroupID
and eaa.prop_val_yr = @lYear


-- Update the effective acreage in properties that are editable --
-- in a non-certified year or an open supplement group.
update pv
set eff_size_acres = @lLegalAcreage

from effective_acres_assoc eaa with(nolock)

join prop_supp_assoc psa with(nolock)
on psa.prop_id = eaa.prop_id
and psa.owner_tax_yr = eaa.prop_val_yr

join property_val pv with(nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num

join pacs_year py with(nolock)
on pv.prop_val_yr = py.tax_yr

outer apply (
	select top 1 * from supplement with(nolock)
	where supplement.sup_tax_yr = pv.prop_val_yr
	and supplement.sup_num = pv.sup_num
	order by sup_group_id desc
) s

left join sup_group sg with(nolock)
on sg.sup_group_id = s.sup_group_id

where eaa.group_id = @lGroupID
and eaa.prop_val_yr = @lYear

and (py.certification_dt is null or isnull(sg.status_cd, '') in ('P','C', 'L', 'TO'))


-- Always update the effective acreage in the group
update effective_acres_group 
set acreage = @lLegalAcreage
where group_id = @lGroupID
and prop_val_yr = @lYear

GO

