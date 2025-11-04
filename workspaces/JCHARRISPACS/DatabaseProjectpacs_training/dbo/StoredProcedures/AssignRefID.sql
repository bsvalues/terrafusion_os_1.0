












CREATE procedure AssignRefID
as

declare @prop_id	int
declare @prev_prop_id 	int
declare @imprv_id	int
declare @imprv_det_id	int
declare @imprv_seq    	int
declare @imprv_det_seq	int

select @prev_prop_id  = 0;
select @imprv_seq     = 1;
select @imprv_det_seq = 1;

DECLARE IMPRV SCROLL CURSOR
FOR select prop_id,
	   imprv_id 
    from imprv
    where prop_val_yr = 1999
    and   sup_num     = 0
    and   sale_id     = 0
    order by prop_id, imprv_id

OPEN IMPRV
FETCH NEXT FROM IMPRV into @prop_id, @imprv_id
			
/* loop through all the improvements */
while (@@FETCH_STATUS = 0)
begin
	if (@prop_id <> @prev_prop_id)
	begin
		select @prev_prop_id  = @prop_id
		select @imprv_seq     = 1
		select @imprv_det_seq = 1
	end
	else
	begin
		select @imprv_seq = @imprv_seq + 1
	end
	
	update imprv set ref_id1 = @imprv_seq
	where prop_id = @prop_id
	and   imprv_id = @imprv_id
	and prop_val_yr = 1999
    	and   sup_num     = 0
    	and   sale_id     = 0

	DECLARE IMPRV_DETAIL SCROLL CURSOR
	FOR select imprv_detail.imprv_det_id
	    from imprv_detail
	    where imprv_id = @imprv_id
	    and   prop_id = @prop_id
	    and prop_val_yr = 1999
    	    and   sup_num     = 0
    	    and   sale_id     = 0
	    order by imprv_det_id
	
	OPEN IMPRV_DETAIL
	FETCH NEXT FROM IMPRV_DETAIL into @imprv_det_id
				
	while (@@FETCH_STATUS = 0)
	begin
		update imprv_detail set ref_id1 = @imprv_det_seq
		where imprv_det_id = @imprv_det_id
		and   imprv_id	   = @imprv_id
		and   prop_id	   = @prop_id
		and   prop_val_yr = 1999
    		and   sup_num     = 0
    		and   sale_id     = 0

		select @imprv_det_seq = @imprv_det_seq + 1
	
		FETCH NEXT FROM IMPRV_DETAIL into @imprv_det_id
	end

	CLOSE IMPRV_DETAIL
	DEALLOCATE IMPRV_DETAIL

	FETCH NEXT FROM IMPRV into @prop_id, @imprv_id
end

CLOSE IMPRV
DEALLOCATE IMPRV

GO

