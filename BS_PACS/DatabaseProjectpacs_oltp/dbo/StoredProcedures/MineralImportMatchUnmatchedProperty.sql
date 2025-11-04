



create procedure MineralImportMatchUnmatchedProperty
	@run_id int,
	@user_id int,
	@imported_property_id varchar (25),
	@pacs_property_id int
as


update
	mineral_import_property
set
	prop_id = p.prop_id,
	new = null
from
	mineral_import_property as mip with (nolock)
inner join
	mineral_import as mi with (nolock)
on
	mi.run_id = mip.run_id
inner join
	property as p with (nolock)
on
	p.prop_id = @pacs_property_id
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
and	psa.owner_tax_yr = mi.year
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
where
	mip.run_id = @run_id
and	mip.xref = @imported_property_id
and	mip.new_prop_id = mip.prop_id
and	mip.new = 'T'
and	not exists
(
	select
		*
	from
		mineral_import_property with (nolock)
	where
		run_id = @run_id
	and	prop_id = @pacs_property_id
)
	

if (@@rowcount > 0)
begin
	insert into
		mineral_import_status
	(
		run_id,
		status_code,
		status_user_id,
		status_date
	)
	values
	(
		@run_id,
		'MATCH UNMATCHED',
		@user_id,
		GetDate()
	)


	update
		mineral_import_entity
	set
		prop_id = mip.prop_id
	from
		mineral_import_entity as mie with (nolock)
	inner join
		mineral_import_property as mip with (nolock)
	on
		mip.run_id = mie.run_id
	and	mip.new_prop_id = mie.prop_id
	and	mip.xref = mie.xref
	and	mip.prop_id = @pacs_property_id
	where
		mie.run_id = @run_id
	and	mie.xref = @imported_property_id


	update
		mineral_import_exemption
	set
		prop_id = mip.prop_id
	from
		mineral_import_exemption as miex with (nolock)
	inner join
		mineral_import_property as mip with (nolock)
	on
		mip.run_id = miex.run_id
	and	mip.new_prop_id = miex.prop_id
	and	mip.xref = miex.xref
	and	mip.prop_id = @pacs_property_id
	where
		miex.run_id = @run_id
	and	miex.xref = @imported_property_id


	update
		mineral_import_special_entity_exemption
	set
		prop_id = mip.prop_id
	from
		mineral_import_special_entity_exemption as miseex with (nolock)
	inner join
		mineral_import_property as mip with (nolock)
	on
		mip.run_id = miseex.run_id
	and	mip.new_prop_id = miseex.prop_id
	and	mip.xref = miseex.xref
	and	mip.prop_id = @pacs_property_id
	where
		miseex.run_id = @run_id
	and	miseex.xref = @imported_property_id
end

GO

