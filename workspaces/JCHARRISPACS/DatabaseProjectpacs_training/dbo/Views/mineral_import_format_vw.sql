

create view mineral_import_format_vw
as
select
	miff.appr_company_id,
	ac.appr_company_nm,
	miff.prop_type_cd,
	pt.prop_type_desc,
	miff.format_type_cd,
	mift.format_type_description,
	miff.field_name,
	miff.field_description,
	mif.year,
	mif.sequence,
	mif.prefix,
	mif.suffix,
	mif.delimiter
from
	mineral_import_format_field as miff with (nolock)
inner join
	appr_company as ac with (nolock)
on
	ac.appr_company_id = miff.appr_company_id
inner join
	property_type as pt with (nolock)
on
	pt.prop_type_cd = miff.prop_type_cd
inner join
	mineral_import_format_type as mift with (nolock)
on
	mift.format_type_cd = miff.format_type_cd
left outer join
	mineral_import_format as mif with (nolock)
on
	mif.appr_company_id = miff.appr_company_id
and	mif.prop_type_cd = miff.prop_type_cd
and	mif.format_type_cd = miff.format_type_cd
and	mif.field_name = miff.field_name

GO

