

create view mineral_import_prop_format_vw
as
select
	mipf.prop_type_cd,
	pt.prop_type_desc,
	mipf.format_type_cd,
	mift.format_type_description
from
	mineral_import_prop_format as mipf with (nolock)
join
	property_type as pt with (nolock)
on
	pt.prop_type_cd = mipf.prop_type_cd
join
	mineral_import_format_type as mift with (nolock)
on
	mift.format_type_cd = mipf.format_type_cd

GO

