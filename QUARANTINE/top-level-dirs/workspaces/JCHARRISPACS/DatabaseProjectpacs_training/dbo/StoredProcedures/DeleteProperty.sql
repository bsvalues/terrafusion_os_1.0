


-- Name		YYYY.MM.DD	Description
-- Trent Nix	2004.03.03	Added imprv_exemption_assoc, land_exemption_assoc, and pers_prop_exemption_assoc tables
-- Jeremy Smith	2005.10.21	HS 30272 - Must remove from share_prop_value before shared_prop 

create PROCEDURE DeleteProperty
	@input_prop_id int
AS

SET NOCOUNT ON

delete tif_area_prop_values
where prop_id = @input_prop_id

delete tif_area_prop_assoc
where prop_id = @input_prop_id

delete daily_batch_prop_assoc
where prop_id = @input_prop_id

/* Now that Income has FK's to imprv and land_detail, it must be deleted first! */
/* delete from income_prop_assoc */
delete from income_prop_assoc
where prop_id = @input_prop_id

/* delete from income_imprv_assoc */
delete from income_imprv_assoc
where prop_id = @input_prop_id

/* delete from income_land_detail_assoc */
delete from income_land_detail_assoc
where prop_id = @input_prop_id

/* delete from imprv_detail_cms_addition */
delete from imprv_detail_cms_addition
where prop_id = @input_prop_id

/* delete from imprv_detail_cms_component */
delete from imprv_detail_cms_component
where prop_id = @input_prop_id

/* delete from imprv_detail_cms_occupancy */
delete from imprv_detail_cms_occupancy
where prop_id = @input_prop_id

/* delete from imprv_detail_cms_section */
delete from imprv_detail_cms_section
where prop_id = @input_prop_id

/* delete from imprv_detail_cms_estimate */
delete from imprv_detail_cms_estimate
where prop_id = @input_prop_id

/* delete from imprv_remodel */
delete from imprv_remodel
where prop_id = @input_prop_id

/* delete from imprv_entity_assoc */
delete from imprv_entity_assoc
where prop_id = @input_prop_id

/* delete from imprv_owner_assoc */
DELETE FROM imprv_owner_assoc 
WHERE prop_id = @input_prop_id

/* delete from imprv_exemption_assoc */
delete from imprv_exemption_assoc
where prop_id = @input_prop_id

/* delete from imprv attr */
delete from imprv_attr
where prop_id = @input_prop_id

/* delete from imprv detail adjustment */
delete from imprv_det_adj
where prop_id = @input_prop_id

/* delete from imprv detail */
delete from imprv_detail
where prop_id = @input_prop_id

/* delete from imprv_sketch_note */
delete from imprv_sketch_note
where prop_id = @input_prop_id

/* delete from imprv adj */
delete from imprv_adj
where prop_id = @input_prop_id

/* delete from imprv */
delete from imprv
where prop_id = @input_prop_id

/* delete from land_entity_assoc */
delete from land_entity_assoc
where prop_id = @input_prop_id

/* delete from land_owner_assoc */
DELETE FROM land_owner_assoc 
WHERE prop_id = @input_prop_id

/* delete from land_exemption_assoc */
delete from land_exemption_assoc
where prop_id = @input_prop_id

/* delete from land_adj */
delete from land_adj
where prop_id = @input_prop_id

/* delete from land_detail */
delete from land_detail
where prop_id = @input_prop_id

/* delete pers prop sub segs */
delete from pers_prop_sub_seg
where prop_id= @input_prop_id

/* delete from pers_prop_entity_assoc */
delete from pers_prop_entity_assoc
where prop_id = @input_prop_id

/* delete from pers_prop_owner_assoc */
DELETE FROM pers_prop_owner_assoc 
WHERE prop_id = @input_prop_id

/* delete from pers_prop_exemption_assoc */
delete from pers_prop_exemption_assoc
where prop_id = @input_prop_id

/* delete from detail_segments */
delete from pers_prop_seg
where prop_id = @input_prop_id

/* delete from entity prop assoc */
delete from entity_prop_assoc
where prop_id = @input_prop_id

/* delete from property_freeze */
delete from property_freeze
where prop_id = @input_prop_id

/* delete from property_exemption_income, also deletes property_exemption_income_detail via Cascade */

delete from property_exemption_income
where prop_id = @input_prop_id

delete from property_exemption_dor_detail
where prop_id = @input_prop_id

/* delete from property exemptions */
delete from property_exemption
where prop_id = @input_prop_id

/* delete from owner */
delete from owner
where prop_id = @input_prop_id
/* delete from prop_supp_assoc */
delete from prop_supp_assoc 
where prop_id = @input_prop_id

delete from property_lien_assoc
where prop_id = @input_prop_id

------ property_val foreign keys ----------
	delete from destroyed_property 
	where prop_id = @input_prop_id

	delete from property_income_characteristic_amount
	where prop_id = @input_prop_id

	delete from property_income_characteristic_tenant
	where prop_id = @input_prop_id

	delete from property_income_characteristic_unit_mix
	where prop_id = @input_prop_id

	delete from property_income_characteristic 
	where prop_id = @input_prop_id

	delete from property_legal_description
	where prop_id = @input_prop_id

	delete from property_payout_agreement
	where prop_id = @input_prop_id
	
	delete from property_current_use_review
	where prop_id = @input_prop_id

	------ property_reet_assoc foreign keys ----------
		delete from property_reet_exemption
		where prop_id = @input_prop_id

		delete from property_reet_mobile_home_imprv
		where prop_id = @input_prop_id

		delete from reet_mobile_home_imprv
		where prop_id = @input_prop_id

	delete from property_reet_assoc
	where prop_id = @input_prop_id
	--------------------------------------------------

	delete from property_special_assessment
	where prop_id = @input_prop_id

	delete from property_tax_area
	where prop_id = @input_prop_id

	delete from rendition 
	where prop_id = @input_prop_id

	delete from wash_property_val
	where prop_id = @input_prop_id

delete from property_val
where prop_id = @input_prop_id

update property_val set udi_parent_prop_id = null
where udi_parent_prop_id = @input_prop_id
------------------------------------------

/* delete from mineral acct */
delete from mineral_acct where prop_id = @input_prop_id

delete from seller_assoc 
where prop_id= @input_prop_id

delete from chg_of_owner_prop_assoc
where prop_id= @input_prop_id

delete from fee_tax_cert_assoc
where prop_id= @input_prop_id

delete from fee_prop_entity_assoc
where prop_id= @input_prop_id

delete from mortgage_assoc
where prop_id= @input_prop_id

delete from owner_jan1
where prop_id= @input_prop_id

delete from pers_prop_rendition
where prop_id= @input_prop_id

delete from pers_prop
where prop_id= @input_prop_id

delete from prop_building_permit_assoc
where prop_id= @input_prop_id

delete from prop_event_assoc
where prop_id= @input_prop_id

delete from prop_group_assoc
where prop_id= @input_prop_id

delete from property_entity_exemption
where prop_id= @input_prop_id

delete from prop_owner_entity_val
where prop_id= @input_prop_id

delete from prop_recalc_errors
where prop_id= @input_prop_id

delete from prop_tax_cert_info
where prop_id= @input_prop_id

delete from prop_tax_due
where prop_id= @input_prop_id

delete from property_assoc
where parent_prop_id= @input_prop_id
or    child_prop_id= @input_prop_id

/* HS 30272 - Jeremy Smith - must remove from share_prop_value before shared_prop */
delete from shared_prop_value
where pacs_prop_id= @input_prop_id

delete from shared_prop
where pacs_prop_id= @input_prop_id

/* rendered seg */
delete from rendered_seg
where prop_id= @input_prop_id

/* delete from situs */
delete from situs
where prop_id= @input_prop_id

/* delete from lease_prop_assoc */
delete from lease_prop_assoc
where prop_id = @input_prop_id

/* delete from agent_assoc */
delete from agent_assoc
where prop_id = @input_prop_id

delete from property_assessment_attribute_val
where prop_id = @input_prop_id

delete from annexation_property_assoc
where prop_id = @input_prop_id

delete from annexation_property_history
where prop_id = @input_prop_id

delete from arb_assoc
where prop_id = @input_prop_id

delete from escrow
where prop_id = @input_prop_id

delete from escrow_trans
where prop_id = @input_prop_id

delete from merge_assoc
where prop_id = @input_prop_id

delete from merge_from
where parent_id = @input_prop_id or child_id = @input_prop_id

delete from overpayment_credit
where prop_id = @input_prop_id

delete from seller_reet_assoc
where prop_id = @input_prop_id

delete from split_assoc
where prop_id = @input_prop_id

delete from split_into
where parent_id = @input_prop_id or child_id = @input_prop_id

delete from split_merge_prop_assoc
where prop_id = @input_prop_id

delete from sup_group_property_info
where prop_id = @input_prop_id

delete from user_owner
where prop_id = @input_prop_id

delete from user_property
where prop_id = @input_prop_id

delete from user_property_val
where prop_id = @input_prop_id

delete from property_current_use_removal
where prop_id = @input_prop_id

delete from current_use_property
where prop_id = @input_prop_id

-- Added for SDS 2029
DELETE FROM property_sketch
WHERE prop_id = @input_prop_id

/* delete from property */
delete from [property]
where prop_id = @input_prop_id

GO

