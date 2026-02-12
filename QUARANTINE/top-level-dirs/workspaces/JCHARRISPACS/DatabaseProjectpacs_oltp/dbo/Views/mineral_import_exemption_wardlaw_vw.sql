
create view mineral_import_exemption_wardlaw_vw
as 

select
	miw.run_id,
	miw.converted_prop_type as prop_type_cd,
	'EX' as exmpt_type_cd,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
(
	(
		isnull(miw.appr_val_01, 0) > 0
	and	isnull(miw.te_01, 0) > 0
	)
or	(
		isnull(miw.appr_val_02, 0) > 0
	and	isnull(miw.te_02, 0) > 0
	)
or	(
		isnull(miw.appr_val_03, 0) > 0
	and	isnull(miw.te_03, 0) > 0
	)
or	(
		isnull(miw.appr_val_04, 0) > 0
	and	isnull(miw.te_04, 0) > 0
	)
or	(
		isnull(miw.appr_val_05, 0) > 0
	and	isnull(miw.te_05, 0) > 0
	)
or	(
		isnull(miw.appr_val_06, 0) > 0
	and	isnull(miw.te_06, 0) > 0
	)
or	(
		isnull(miw.appr_val_07, 0) > 0
	and	isnull(miw.te_07, 0) > 0
	)
or	(
		isnull(miw.appr_val_08, 0) > 0
	and	isnull(miw.te_08, 0) > 0
	)
or	(
		isnull(miw.appr_val_09, 0) > 0
	and	isnull(miw.te_09, 0) > 0
	)
or	(
		isnull(miw.appr_val_10, 0) > 0
	and	isnull(miw.te_10, 0) > 0
	)
or	(
		isnull(miw.appr_val_11, 0) > 0
	and	isnull(miw.te_11, 0) > 0
	)
or	(
		isnull(miw.appr_val_12, 0) > 0
	and	isnull(miw.te_12, 0) > 0
	)
)


union

select
	miw.run_id,
	miw.converted_prop_type as prop_type_cd,
	'EX366' as exmpt_type_cd,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
(
	(
		isnull(miw.appr_val_01, 0) > 0
	and	isnull(miw.hb_01, 0) > 0
	)
or	(
		isnull(miw.appr_val_02, 0) > 0
	and	isnull(miw.hb_02, 0) > 0
	)
or	(
		isnull(miw.appr_val_03, 0) > 0
	and	isnull(miw.hb_03, 0) > 0
	)
or	(
		isnull(miw.appr_val_04, 0) > 0
	and	isnull(miw.hb_04, 0) > 0
	)
or	(
		isnull(miw.appr_val_05, 0) > 0
	and	isnull(miw.hb_05, 0) > 0
	)
or	(
		isnull(miw.appr_val_06, 0) > 0
	and	isnull(miw.hb_06, 0) > 0
	)
or	(
		isnull(miw.appr_val_07, 0) > 0
	and	isnull(miw.hb_07, 0) > 0
	)
or	(
		isnull(miw.appr_val_08, 0) > 0
	and	isnull(miw.hb_08, 0) > 0
	)
or	(
		isnull(miw.appr_val_09, 0) > 0
	and	isnull(miw.hb_09, 0) > 0
	)
or	(
		isnull(miw.appr_val_10, 0) > 0
	and	isnull(miw.hb_10, 0) > 0
	)
or	(
		isnull(miw.appr_val_11, 0) > 0
	and	isnull(miw.hb_11, 0) > 0
	)
or	(
		isnull(miw.appr_val_12, 0) > 0
	and	isnull(miw.hb_12, 0) > 0
	)
)



union


select
	miw.run_id,
	miw.converted_prop_type as prop_type_cd,
	'DV1' as exmpt_type_cd,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
(
	(
		isnull(miw.appr_val_01, 0) > 0
	and	isnull(miw.dp_01, 0) > 0
	)
or	(
		isnull(miw.appr_val_02, 0) > 0
	and	isnull(miw.dp_02, 0) > 0
	)
or	(
		isnull(miw.appr_val_03, 0) > 0
	and	isnull(miw.dp_03, 0) > 0
	)
or	(
		isnull(miw.appr_val_04, 0) > 0
	and	isnull(miw.dp_04, 0) > 0
	)
or	(
		isnull(miw.appr_val_05, 0) > 0
	and	isnull(miw.dp_05, 0) > 0
	)
or	(
		isnull(miw.appr_val_06, 0) > 0
	and	isnull(miw.dp_06, 0) > 0
	)
or	(
		isnull(miw.appr_val_07, 0) > 0
	and	isnull(miw.dp_07, 0) > 0
	)
or	(
		isnull(miw.appr_val_08, 0) > 0
	and	isnull(miw.dp_08, 0) > 0
	)
or	(
		isnull(miw.appr_val_09, 0) > 0
	and	isnull(miw.dp_09, 0) > 0
	)
or	(
		isnull(miw.appr_val_10, 0) > 0
	and	isnull(miw.dp_10, 0) > 0
	)
or	(
		isnull(miw.appr_val_11, 0) > 0
	and	isnull(miw.dp_11, 0) > 0
	)
or	(
		isnull(miw.appr_val_12, 0) > 0
	and	isnull(miw.dp_12, 0) > 0
	)
)


union


select
	miw.run_id,
	miw.converted_prop_type as prop_type_cd,
	'PC' as exmpt_type_cd,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
(
	(
		isnull(miw.appr_val_01, 0) > 0
	and	isnull(miw.pc_01, 0) > 0
	)
or	(
		isnull(miw.appr_val_02, 0) > 0
	and	isnull(miw.pc_02, 0) > 0
	)
or	(
		isnull(miw.appr_val_03, 0) > 0
	and	isnull(miw.pc_03, 0) > 0
	)
or	(
		isnull(miw.appr_val_04, 0) > 0
	and	isnull(miw.pc_04, 0) > 0
	)
or	(
		isnull(miw.appr_val_05, 0) > 0
	and	isnull(miw.pc_05, 0) > 0
	)
or	(
		isnull(miw.appr_val_06, 0) > 0
	and	isnull(miw.pc_06, 0) > 0
	)
or	(
		isnull(miw.appr_val_07, 0) > 0
	and	isnull(miw.pc_07, 0) > 0
	)
or	(
		isnull(miw.appr_val_08, 0) > 0
	and	isnull(miw.pc_08, 0) > 0
	)
or	(
		isnull(miw.appr_val_09, 0) > 0
	and	isnull(miw.pc_09, 0) > 0
	)
or	(
		isnull(miw.appr_val_10, 0) > 0
	and	isnull(miw.pc_10, 0) > 0
	)
or	(
		isnull(miw.appr_val_11, 0) > 0
	and	isnull(miw.pc_11, 0) > 0
	)
or	(
		isnull(miw.appr_val_12, 0) > 0
	and	isnull(miw.pc_12, 0) > 0
	)
)


union


select
	miw.run_id,
	miw.converted_prop_type as prop_type_cd,
	'FR' as exmpt_type_cd,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
(
	(
		isnull(miw.appr_val_01, 0) > 0
	and	isnull(miw.fr_01, 0) > 0
	)
or	(
		isnull(miw.appr_val_02, 0) > 0
	and	isnull(miw.fr_02, 0) > 0
	)
or	(
		isnull(miw.appr_val_03, 0) > 0
	and	isnull(miw.fr_03, 0) > 0
	)
or	(
		isnull(miw.appr_val_04, 0) > 0
	and	isnull(miw.fr_04, 0) > 0
	)
or	(
		isnull(miw.appr_val_05, 0) > 0
	and	isnull(miw.fr_05, 0) > 0
	)
or	(
		isnull(miw.appr_val_06, 0) > 0
	and	isnull(miw.fr_06, 0) > 0
	)
or	(
		isnull(miw.appr_val_07, 0) > 0
	and	isnull(miw.fr_07, 0) > 0
	)
or	(
		isnull(miw.appr_val_08, 0) > 0
	and	isnull(miw.fr_08, 0) > 0
	)
or	(
		isnull(miw.appr_val_09, 0) > 0
	and	isnull(miw.fr_09, 0) > 0
	)
or	(
		isnull(miw.appr_val_10, 0) > 0
	and	isnull(miw.fr_10, 0) > 0
	)
or	(
		isnull(miw.appr_val_11, 0) > 0
	and	isnull(miw.fr_11, 0) > 0
	)
or	(
		isnull(miw.appr_val_12, 0) > 0
	and	isnull(miw.fr_12, 0) > 0
	)
)

GO

