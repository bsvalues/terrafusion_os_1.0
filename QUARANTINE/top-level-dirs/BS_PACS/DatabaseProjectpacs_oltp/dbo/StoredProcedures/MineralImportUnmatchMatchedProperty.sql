



create procedure MineralImportUnmatchMatchedProperty
	@run_id int,
	@user_id int,
	@imported_property_id varchar (25),
	@pacs_property_id int
as


update
	mineral_import_property
set
	prop_id = new_prop_id,
	new = 'T'
from
	mineral_import_property as mip with (nolock)
inner join
	mineral_import as mi with (nolock)
on
	mi.run_id = mip.run_id
where
	mip.run_id = @run_id
and	mip.xref = @imported_property_id
and	mip.prop_id = @pacs_property_id
and	mip.new_prop_id > 0
and	mip.new is null
	

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
	and	mip.xref = mie.xref
	and	mip.prop_id = mip.new_prop_id
	and	mip.new = 'T'
	where
		mie.run_id = @run_id
	and	mie.xref = @imported_property_id
	and	mie.prop_id = @pacs_property_id


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
	and	mip.xref = miex.xref
	and	mip.prop_id = mip.new_prop_id
	and	mip.new = 'T'
	where
		miex.run_id = @run_id
	and	miex.xref = @imported_property_id
	and	miex.prop_id = @pacs_property_id


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
	and	mip.xref = miseex.xref
	and	mip.prop_id = mip.new_prop_id
	and	mip.new = 'T'
	where
		miseex.run_id = @run_id
	and	miseex.xref = @imported_property_id
	and	miseex.prop_id = @pacs_property_id
end

GO

