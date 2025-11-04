-- =============================================
-- Author:		<Ryan Hill>
-- Create date: <April 19, 2011>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[LayerCopyRemodelExemption] 
	-- Add the parameters for the stored procedure here

@old_year		int,
@old_sup_num	int,
@old_prop_id	int,

@year			int,
@sup_num		int,
@prop_id		int

AS

if not exists(
select * from imprv_remodel 
where prop_id = @prop_id and
sup_num = @sup_num and 
year = @year
)
begin
INSERT INTO imprv_remodel
(
[year],
sup_num,
prop_id,
app_num,
app_date_received,
submitted_by,
imprv_desc,
est_cost,
beginning_value_date,
contractor,
app_status,
permit_issued_by,
permit_num,
permit_date,
assess_yr_begin,
assess_yr_removed,
value_after,
value_prior,
increase_in_val,
exemption_amount,
taxable_val,
construction_finish_date,
construction_begin_date,
[percent],
assess_yr_requalify,
imprv_det_assoc,
imprv_assoc,
comments,
final_value_date,
complete,
expired,
override
)
SELECT 
@year,
@sup_num,
@prop_id,
app_num,
app_date_received,
submitted_by,
imprv_desc,
est_cost,
beginning_value_date,
contractor,
app_status,
permit_issued_by,
permit_num,
permit_date,
assess_yr_begin,
assess_yr_removed,
value_after,
value_prior,
increase_in_val,
exemption_amount,
taxable_val,
construction_finish_date,
construction_begin_date,
[percent],
assess_yr_requalify,
imprv_det_assoc,
imprv_assoc,
comments,
final_value_date,
complete,
expired,
override

FROM imprv_remodel
WHERE 
prop_id = @old_prop_id and
[year] = @old_year and 
sup_num = @old_sup_num

end

GO

