

create view penpad_building_permit
as

select pbpa.prop_id, bp.* From building_permit bp, prop_building_permit_assoc pbpa
where bp.bldg_permit_id = pbpa.bldg_permit_id

GO

