


CREATE procedure SalesSetCOD
@input_user_id 	     int,
@input_sort1_summary char(1),
@input_sort2_summary char(1),
@input_sort3_summary char(1),
@input_sort4_summary char(1)

as

declare @sort_count	int
declare @prev_sort1	varchar(100)
declare @prev_sort2 	varchar(100)
declare @prev_sort3	varchar(100)
declare @prev_sort4	varchar(100)

declare @sort_avg_dev	numeric(14,4)
declare @sort_median	numeric(14,4)
declare @sort_avg	numeric(14,4)
declare @sort_midpoint  int
declare @sort_pos	int
declare @sort_cod	numeric(14,4)

declare @sort1		varchar(100)
declare @sort2		varchar(100)
declare @sort3		varchar(100)
declare @sort4		varchar(100)

declare @sales_ratio	numeric(14,4)

/* process sort1 first */
if (@input_sort1_summary = 'T')
begin
	
    select @prev_sort1 = ''
    select @sort_count = 0

    DECLARE SORT1_SALES SCROLL CURSOR
    FOR select sort1, sales_ratio
    from   sales_ratio_report
    where  pacs_user_id = @input_user_id
    order by sort1, sales_ratio 

     OPEN SORT1_SALES 
     FETCH NEXT FROM SORT1_SALES into @sort1, @sales_ratio

     while (@@FETCH_STATUS = 0)
     begin

	if (@prev_sort1 <> @sort1) 
	begin
		if (@sort_count > 0)
		begin
			select @sort_avg_dev = @sort_avg_dev/@sort_count
		end

		select @sort_cod = @sort_avg_dev

		if (@sort_median > 0)
		begin
			select @sort_cod = (@sort_cod/@sort_median) * 100
		end
			

		update sales_ratio_report set sort1_temp_avg_dev = @sort_avg_dev,
					      sort1_temp_median  = @sort_median,
					      sort1_temp_avg     = @sort_avg ,
					      sort1_temp_cod     = @sort_cod
		where pacs_user_id = @input_user_id
		and   sort1 = @prev_sort1
	
		select @prev_sort1 = @sort1
		
		select @sort_count = null
		select @sort_avg   = null

		select @sort_count = count(chg_of_owner_id)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort1 = @sort1

		select @sort_avg = avg(sales_ratio)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort1 = @sort1

		if (@sort_count is null)
		begin
			select @sort_count = 0
		end

		if (@sort_avg is null)
		begin
			select @sort_avg = 0
		end

		if ((@sort_count % 2) = 0)
		begin
			select @sort_midpoint = @sort_count/2
		end
		else   
		begin 
			select @sort_midpoint = @sort_count/2 + 1
		end

		select @sort_avg_dev = 0
		select @sort_median  = 0
		select @sort_pos     = 1

	end


	select @sort_avg_dev = @sort_avg_dev + abs(@sales_ratio - @sort_avg)
		
	/* calculate the median */
	if (@sort_pos = @sort_midpoint) and ((@sort_count % 2) <> 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint+1) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sort_median + @sales_ratio
		select @sort_median = @sort_median/2
	end
				
	select @sort_pos = @sort_pos + 1

	FETCH NEXT FROM SORT1_SALES into @sort1, @sales_ratio
     end
 
     close SORT1_SALES
     deallocate SORT1_SALES

     if (@sort_count > 0)
     begin
	select @sort_avg_dev = @sort_avg_dev/@sort_count
     end

     select @sort_cod = @sort_avg_dev

     if (@sort_median > 0)
     begin
	select @sort_cod = (@sort_cod/@sort_median) * 100
     end

     update sales_ratio_report set sort1_temp_avg_dev = @sort_avg_dev,
			      sort1_temp_median  = @sort_median,
			      sort1_temp_avg     = @sort_avg ,
			      sort1_temp_cod     = @sort_cod
     where pacs_user_id = @input_user_id
     and   sort1 = @prev_sort1

end

/* process sort2  */
if (@input_sort2_summary = 'T')
begin
	
    select @prev_sort1 = ''
    select @prev_sort2 = ''
    select @sort_count = 0

    DECLARE sort2_SALES SCROLL CURSOR
    FOR select sort2,  sort1, sales_ratio
    from   sales_ratio_report
    where  pacs_user_id = @input_user_id
    order by sort1, sort2, sales_ratio 

     OPEN sort2_SALES 
     FETCH NEXT FROM sort2_SALES into @sort2,  @sort1, @sales_ratio

     while (@@FETCH_STATUS = 0)
     begin

	if (@prev_sort2 <> @sort2) or (@sort1 <> @prev_sort1)
	begin
		if (@sort_count > 0)
		begin
			select @sort_avg_dev = @sort_avg_dev/@sort_count
		end

		select @sort_cod = @sort_avg_dev

		if (@sort_median > 0)
		begin
			select @sort_cod = (@sort_cod/@sort_median) * 100
		end
			

		update sales_ratio_report set sort2_temp_avg_dev = @sort_avg_dev,
					      sort2_temp_median  = @sort_median,
					      sort2_temp_avg     = @sort_avg ,
					      sort2_temp_cod     = @sort_cod
		where pacs_user_id = @input_user_id
		and   sort2 = @prev_sort2
		and   sort1 = @prev_sort1
	
		select @prev_sort2 = @sort2
		select @prev_sort1 = @sort1
	
		select @sort_count = null
		select @sort_avg   = null

		select @sort_count = count(chg_of_owner_id)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort2 = @sort2
		and   sort1 = @sort1

		select @sort_avg = avg(sales_ratio)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort2 = @sort2
		and   sort1 = @sort1

		if (@sort_count is null)
		begin
			select @sort_count = 0
		end

		if (@sort_avg is null)
		begin
			select @sort_avg = 0
		end

		if ((@sort_count % 2) = 0)
		begin
			select @sort_midpoint = @sort_count/2
		end
		else   
		begin 
			select @sort_midpoint = @sort_count/2 + 1
		end

		select @sort_avg_dev = 0
		select @sort_median  = 0
		select @sort_pos     = 1

	end


	select @sort_avg_dev = @sort_avg_dev + abs(@sales_ratio - @sort_avg)
		
	/* calculate the median */
	if (@sort_pos = @sort_midpoint) and ((@sort_count % 2) <> 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint+1) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sort_median + @sales_ratio
		select @sort_median = @sort_median/2
	end
				
	select @sort_pos = @sort_pos + 1

	FETCH NEXT FROM sort2_SALES into @sort2, @sort1, @sales_ratio
     end
 
     close sort2_SALES
     deallocate sort2_SALES

     if (@sort_count > 0)
     begin
	select @sort_avg_dev = @sort_avg_dev/@sort_count
     end

     select @sort_cod = @sort_avg_dev

     if (@sort_median > 0)
     begin
	select @sort_cod = (@sort_cod/@sort_median) * 100
     end

     update sales_ratio_report set sort2_temp_avg_dev = @sort_avg_dev,
			      sort2_temp_median  = @sort_median,
			      sort2_temp_avg     = @sort_avg ,
			      sort2_temp_cod     = @sort_cod
    where pacs_user_id = @input_user_id
    and   sort2 = @prev_sort2
    and   sort1 =  @prev_sort1

end





/* process sort3  */
if (@input_sort3_summary = 'T')
begin
	
    select @prev_sort1 = ''
    select @prev_sort2 = ''
    select @prev_sort3 = ''

    select @sort_count = 0

    DECLARE sort3_SALES SCROLL CURSOR
    FOR select sort3, sort2, sort1, sales_ratio
    from   sales_ratio_report
    where  pacs_user_id = @input_user_id
    order by sort1, sort2, sort3,  sales_ratio 

     OPEN sort3_SALES 
     FETCH NEXT FROM sort3_SALES into @sort3, @sort2, @sort1, @sales_ratio

     while (@@FETCH_STATUS = 0)
     begin

	if ((@prev_sort3 <> @sort3) or (@prev_sort2 <> @sort2) or (@prev_sort1 <> @sort1))
	begin
		if (@sort_count > 0)
		begin
			select @sort_avg_dev = @sort_avg_dev/@sort_count
		end

		select @sort_cod = @sort_avg_dev

		if (@sort_median > 0)
		begin
			select @sort_cod = (@sort_cod/@sort_median) * 100
		end
			

		update sales_ratio_report set sort3_temp_avg_dev = @sort_avg_dev,
					      sort3_temp_median  = @sort_median,
					      sort3_temp_avg     = @sort_avg ,
					      sort3_temp_cod     = @sort_cod
		where pacs_user_id = @input_user_id
		and   sort3 = @prev_sort3
		and   sort2 = @prev_sort2
		and   sort3 = @prev_sort1
	
		select @prev_sort3 = @sort3
		select @prev_sort2 = @sort2
		select @prev_sort1 = @sort1
		
		select @sort_count = null
		select @sort_avg   = null

		select @sort_count = count(chg_of_owner_id)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort3 = @sort3
		and   sort2 = @sort2
		and   sort1 = @sort1

		select @sort_avg = avg(sales_ratio)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort3 = @sort3
		and   sort2 = @sort2
		and   sort1 = @sort1

		if (@sort_count is null)
		begin
			select @sort_count = 0
		end

		if (@sort_avg is null)
		begin
			select @sort_avg = 0
		end

		if ((@sort_count % 2) = 0)
		begin
			select @sort_midpoint = @sort_count/2
		end
		else   
		begin 
			select @sort_midpoint = @sort_count/2 + 1
		end

		select @sort_avg_dev = 0
		select @sort_median  = 0
		select @sort_pos     = 1

	end


	select @sort_avg_dev = @sort_avg_dev + abs(@sales_ratio - @sort_avg)
		
	/* calculate the median */
	if (@sort_pos = @sort_midpoint) and ((@sort_count % 2) <> 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint+1) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sort_median + @sales_ratio
		select @sort_median = @sort_median/2
	end
				
	select @sort_pos = @sort_pos + 1

	FETCH NEXT FROM sort3_SALES into @sort3, @sort2, @sort1, @sales_ratio
     end
 
     close sort3_SALES
     deallocate sort3_SALES

     if (@sort_count > 0)
     begin
	select @sort_avg_dev = @sort_avg_dev/@sort_count
     end

     select @sort_cod = @sort_avg_dev

     if (@sort_median > 0)
     begin
	select @sort_cod = (@sort_cod/@sort_median) * 100
     end

     update sales_ratio_report set sort3_temp_avg_dev = @sort_avg_dev,
			           sort3_temp_median  = @sort_median,
			           sort3_temp_avg     = @sort_avg ,
			           sort3_temp_cod     = @sort_cod
     where pacs_user_id = @input_user_id
     and   sort3 = @prev_sort3
     and   sort2 = @prev_sort2
     and   sort1 = @prev_sort1
end


	




/* process sort4  */
if (@input_sort4_summary = 'T')
begin
	
    select @prev_sort1 = ''
    select @prev_sort2 = ''
    select @prev_sort3 = ''
    select @prev_sort4 = ''

    select @sort_count = 0

    DECLARE sort4_SALES SCROLL CURSOR
    FOR select sort4, sort3, sort2, sort1, sales_ratio
    from   sales_ratio_report
    where  pacs_user_id = @input_user_id
    order by sort1, sort2, sort3, sort4, sales_ratio 

     OPEN sort4_SALES 
     FETCH NEXT FROM sort4_SALES into @sort4, @sort3, @sort2, @sort1, @sales_ratio

     while (@@FETCH_STATUS = 0)
     begin

	if ((@prev_sort4 <> @sort4) or (@prev_sort3 <> @sort3) or (@prev_sort2 <> @sort2) or (@prev_sort1 <> @sort1))
	begin
		if (@sort_count > 0)
		begin
			select @sort_avg_dev = @sort_avg_dev/@sort_count
		end

		select @sort_cod = @sort_avg_dev

		if (@sort_median > 0)
		begin
			select @sort_cod = (@sort_cod/@sort_median) * 100
		end
			

		update sales_ratio_report set sort4_temp_avg_dev = @sort_avg_dev,
					      sort4_temp_median  = @sort_median,
					      sort4_temp_avg     = @sort_avg ,
					      sort4_temp_cod     = @sort_cod
		where pacs_user_id = @input_user_id
		and   sort4 = @prev_sort4
		and   sort3 = @prev_sort3
		and   sort2 = @prev_sort2
		and   sort1 = @prev_sort1
	
		select @prev_sort4 = @sort4
		select @prev_sort3 = @sort3
		select @prev_sort2 = @sort2
		select @prev_sort1 = @sort1
		
		select @sort_count = null
		select @sort_avg   = null

		select @sort_count = count(chg_of_owner_id)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort4 = @sort4
		and   sort3 = @sort3
		and   sort2 = @sort2
		and   sort1 = @sort1

		select @sort_avg = avg(sales_ratio)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		and   sort4 = @sort4
		and   sort3 = @sort3
		and   sort2 = @sort2
		and   sort1 = @sort1

		if (@sort_count is null)
		begin
			select @sort_count = 0
		end

		if (@sort_avg is null)
		begin
			select @sort_avg = 0
		end

		if ((@sort_count % 2) = 0)
		begin
			select @sort_midpoint = @sort_count/2
		end
		else   
		begin 
			select @sort_midpoint = @sort_count/2 + 1
		end

		select @sort_avg_dev = 0
		select @sort_median  = 0
		select @sort_pos     = 1

	end


	select @sort_avg_dev = @sort_avg_dev + abs(@sales_ratio - @sort_avg)
		
	/* calculate the median */
	if (@sort_pos = @sort_midpoint) and ((@sort_count % 2) <> 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint+1) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sort_median + @sales_ratio
		select @sort_median = @sort_median/2
	end
				
	select @sort_pos = @sort_pos + 1

	FETCH NEXT FROM sort4_SALES into @sort4,  @sales_ratio
     end
 
     close sort4_SALES
     deallocate sort4_SALES

     if (@sort_count > 0)
     begin
	select @sort_avg_dev = @sort_avg_dev/@sort_count
     end

     select @sort_cod = @sort_avg_dev

     if (@sort_median > 0)
     begin
	select @sort_cod = (@sort_cod/@sort_median) * 100
     end

     update sales_ratio_report set sort4_temp_avg_dev = @sort_avg_dev,
			           sort4_temp_median  = @sort_median,
			           sort4_temp_avg     = @sort_avg ,
			           sort4_temp_cod     = @sort_cod
     where pacs_user_id = @input_user_id
     and   sort4 = @prev_sort4
     and   sort3 = @prev_sort3
     and   sort2 = @prev_sort2
     and   sort1 = @prev_sort1
end


	
	



/* process totals  */

	
    select @sort_count = 0
    select @sort_pos   = 0

    DECLARE SALES SCROLL CURSOR
    FOR select sales_ratio
    from   sales_ratio_report
    where  pacs_user_id = @input_user_id
    order by sales_ratio 

     OPEN SALES 
     FETCH NEXT FROM SALES into @sales_ratio

     while (@@FETCH_STATUS = 0)
     begin

	if (@sort_pos = 0)
	begin
		select @sort_count = null
		select @sort_avg   = null

		select @sort_count = count(chg_of_owner_id)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		
		select @sort_avg = avg(sales_ratio)
		from sales_ratio_report
		where pacs_user_id = @input_user_id
		
		if (@sort_count is null)
		begin
			select @sort_count = 0
		end

		if (@sort_avg is null)
		begin
			select @sort_avg = 0
		end

		if ((@sort_count % 2) = 0)
		begin
			select @sort_midpoint = @sort_count/2
		end
		else   
		begin 
			select @sort_midpoint = @sort_count/2 + 1
		end

		select @sort_avg_dev = 0
		select @sort_median  = 0
		select @sort_pos     = 1

	end


	select @sort_avg_dev = @sort_avg_dev + abs(@sales_ratio - @sort_avg)
		
	/* calculate the median */
	if (@sort_pos = @sort_midpoint) and ((@sort_count % 2) <> 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sales_ratio
	end
	else if  (@sort_pos = @sort_midpoint+1) and ((@sort_count % 2) = 0)
	begin
		select @sort_median = @sort_median + @sales_ratio
		select @sort_median = @sort_median/2
	end
				
	select @sort_pos = @sort_pos + 1

	FETCH NEXT FROM SALES into @sales_ratio
     end
 
     close SALES
     deallocate SALES

if (@sort_count > 0)
begin
	select @sort_avg_dev = @sort_avg_dev/@sort_count
end

select @sort_cod = @sort_avg_dev

if (@sort_median > 0)
begin
	select @sort_cod = (@sort_cod/@sort_median) * 100
end

update sales_ratio_report set temp_avg_dev = @sort_avg_dev,
			      temp_median  = @sort_median,
			      temp_avg     = @sort_avg ,
			      temp_cod     = @sort_cod
where pacs_user_id = @input_user_id

GO

