




Create Procedure PopulatePTDTables
@input_yr int,
@input_cad_id_code varchar(3),
@input_sup_num int
as
set nocount on
truncate table ptd_errors
exec PopulatePropertyOwnerEntityStateCd @input_yr, @input_sup_num
exec PTD_APL_Proc @input_yr, @input_cad_id_code, @input_sup_num
exec PTD_AND_Proc @input_yr, @input_cad_id_code, @input_sup_num
exec PTD_AJR_Proc @input_yr, @input_cad_id_code
exec PTD_ACD_Proc @input_yr, @input_cad_id_code
exec PTD_AUD_Proc @input_yr, @input_cad_id_code

GO

