
create view mineral_import_special_exemption_wardlaw_vw
as 

select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_01 as entity_code,
	miw.hb_01 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_01, 0) > 0
and	isnull(miw.hb_01, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_02 as entity_code,
	miw.hb_02 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_02, 0) > 0
and	isnull(miw.hb_02, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_03 as entity_code,
	miw.hb_03 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_03, 0) > 0
and	isnull(miw.hb_03, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_04 as entity_code,
	miw.hb_04 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_04, 0) > 0
and	isnull(miw.hb_04, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_05 as entity_code,
	miw.hb_05 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_05, 0) > 0
and	isnull(miw.hb_05, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_06 as entity_code,
	miw.hb_06 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_06, 0) > 0
and	isnull(miw.hb_06, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_07 as entity_code,
	miw.hb_07 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_07, 0) > 0
and	isnull(miw.hb_07, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_08 as entity_code,
	miw.hb_08 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_08, 0) > 0
and	isnull(miw.hb_08, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_09 as entity_code,
	miw.hb_09 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_09, 0) > 0
and	isnull(miw.hb_09, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_10 as entity_code,
	miw.hb_10 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_10, 0) > 0
and	isnull(miw.hb_10, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_11 as entity_code,
	miw.hb_11 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_11, 0) > 0
and	isnull(miw.hb_11, 0) > 0


union


select
	miw.run_id,
	'EX366' as exmpt_type_cd,
	miw.entity_12 as entity_code,
	miw.hb_12 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_12, 0) > 0
and	isnull(miw.hb_12, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_01 as entity_code,
	miw.pc_01 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_01, 0) > 0
and	isnull(miw.pc_01, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_02 as entity_code,
	miw.pc_02 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_02, 0) > 0
and	isnull(miw.pc_02, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_03 as entity_code,
	miw.pc_03 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_03, 0) > 0
and	isnull(miw.pc_03, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_04 as entity_code,
	miw.pc_04 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_04, 0) > 0
and	isnull(miw.pc_04, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_05 as entity_code,
	miw.pc_05 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_05, 0) > 0
and	isnull(miw.pc_05, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_06 as entity_code,
	miw.pc_06 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_06, 0) > 0
and	isnull(miw.pc_06, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_07 as entity_code,
	miw.pc_07 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_07, 0) > 0
and	isnull(miw.pc_07, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_08 as entity_code,
	miw.pc_08 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_08, 0) > 0
and	isnull(miw.pc_08, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_09 as entity_code,
	miw.pc_09 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_09, 0) > 0
and	isnull(miw.pc_09, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_10 as entity_code,
	miw.pc_10 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_10, 0) > 0
and	isnull(miw.pc_10, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_11 as entity_code,
	miw.pc_11 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_11, 0) > 0
and	isnull(miw.pc_11, 0) > 0


union


select
	miw.run_id,
	'PC' as exmpt_type_cd,
	miw.entity_12 as entity_code,
	miw.pc_12 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_12, 0) > 0
and	isnull(miw.pc_12, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_01 as entity_code,
	miw.fr_01 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_01, 0) > 0
and	isnull(miw.fr_01, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_02 as entity_code,
	miw.fr_02 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_02, 0) > 0
and	isnull(miw.fr_02, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_03 as entity_code,
	miw.fr_03 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_03, 0) > 0
and	isnull(miw.fr_03, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_04 as entity_code,
	miw.fr_04 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_04, 0) > 0
and	isnull(miw.fr_04, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_05 as entity_code,
	miw.fr_05 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_05, 0) > 0
and	isnull(miw.fr_05, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_06 as entity_code,
	miw.fr_06 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_06, 0) > 0
and	isnull(miw.fr_06, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_07 as entity_code,
	miw.fr_07 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_07, 0) > 0
and	isnull(miw.fr_07, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_08 as entity_code,
	miw.fr_08 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_08, 0) > 0
and	isnull(miw.fr_08, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_09 as entity_code,
	miw.fr_09 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_09, 0) > 0
and	isnull(miw.fr_09, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_10 as entity_code,
	miw.fr_10 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_10, 0) > 0
and	isnull(miw.fr_10, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_11 as entity_code,
	miw.fr_11 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_11, 0) > 0
and	isnull(miw.fr_11, 0) > 0


union


select
	miw.run_id,
	'FR' as exmpt_type_cd,
	miw.entity_12 as entity_code,
	miw.fr_12 as amt,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	isnull(miw.appr_val_12, 0) > 0
and	isnull(miw.fr_12, 0) > 0

GO

