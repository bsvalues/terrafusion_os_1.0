


CREATE PROCEDURE APNHM 
	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end





--temps
DECLARE 
        @protested_by_id int
set @protested_by_id = 0 
if object_id('tempdb..#RMultiPrint') is not null 
BEGIN
    SELECT @protested_by_id=#RMultiPrint .requested_by_id from #RMultiPrint 
    WHERE  #RMultiPrint.case_id = @case_id  AND #RMultiPrint.prop_val_yr = @prop_val_yr
    SELECT 
	   prop_id, 
	   case_id,  
	   prop_val_yr,
	   geo_id,
	   owner_name,
	   legal_desc,
	   legal_desc_40,
/*
	   #RMultiPrint.docket_begin as docket_time_begin,
	   docket_date,
*/
		ltrim(right(convert(varchar(20), docket_begin, 100),7)) as docket_time_begin,
		convert(varchar(10),docket_date, 101)  as docket_date,
	   appr_hearing_date,
	   appr_hearing_time_begin
    FROM  #RMultiPrint  
    WHERE #RMultiPrint.requested_by_id = @protested_by_id 

/*
 * Sort is done in Letter/ARBMultiLetterPrintDlg.cpp
 */
--	ORDER BY #RMultiPrint.docket_date, #RMultiPrint.docket_begin, #RMultiPrint.case_id ASC
END
ELSE
BEGIN --need this for editing letter. To show the tags
   select @protested_by_id as prop_id, 
	  @protested_by_id as case_id,  
	  @protested_by_id as prop_val_yr,
	  @protested_by_id as geo_id,
	  @protested_by_id as owner_name,
	  @protested_by_id as legal_desc,
	  @protested_by_id as legal_desc_40,
	  @protested_by_id as docket_time_begin,
	  @protested_by_id as docket_date,
	  @protested_by_id as appr_hearing_date,
	  @protested_by_id as appr_hearing_time_begin  from _arb_protest where 1=2
END

GO

