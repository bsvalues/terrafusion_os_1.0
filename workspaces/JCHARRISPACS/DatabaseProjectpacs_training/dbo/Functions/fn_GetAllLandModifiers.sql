


CREATE FUNCTION [dbo].[fn_GetAllLandModifiers] ( @input_prop_id int, @input_year numeric(4,0), @input_sup_num int )
RETURNS varchar(1000)
AS
BEGIN
                declare @output_codes   varchar(1000)
                declare @single_code   varchar(100)
                set @output_codes = ''

                DECLARE CODES CURSOR
                FOR select distinct ltrim(rtrim(isnull(lj.land_seg_adj_type, ' '))) + ' = ' + 
                CASE 
                                WHEN isnull(lat.land_adj_type_usage, ' ') = 'P' 
                                THEN cast(isnull(lat.land_adj_type_pct, ' ') as varchar(20))
                                WHEN isnull(lj.land_seg_adj_pc, 0) = 0
                THEN cast(lj.land_value as varchar(20))
                ELSE cast(lj.land_seg_adj_pc as varchar(20))
                END as land_adjs
                    from land_adj as lj with(nolock)
                                join property_val as pv with(nolock) on
                                                pv.prop_id = lj.prop_id
                                                and pv.prop_val_yr = lj.prop_val_yr
                                                and pv.sup_num = lj.sup_num
                                join land_adj_type lat with (nolock)
                                                on lat.land_adj_type_cd = lj.land_seg_adj_type
                                                and lat.land_adj_type_year = lj.prop_val_yr
                    where lj.prop_val_yr = @input_year
                                and        lj.sup_num = @input_sup_num
                                and        lj.prop_id = @input_prop_id
                                and lj.sale_id = 0
                OPEN CODES
                FETCH NEXT FROM CODES into @single_code
                
                while (@@FETCH_STATUS = 0)
                begin
                   if (@output_codes = '')
                   begin 
                      select @output_codes = rtrim(@single_code)
                   end
                   else 
                   begin
                      select @output_codes = @output_codes + ', ' + rtrim(@single_code)
                   end
  
                 FETCH NEXT FROM CODES into @single_code

                end
                CLOSE CODES
                DEALLOCATE CODES
                RETURN (@output_codes)
END

GO

