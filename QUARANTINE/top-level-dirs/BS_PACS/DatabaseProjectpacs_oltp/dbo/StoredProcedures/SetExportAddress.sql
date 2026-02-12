


CREATE procedure SetExportAddress

@input_notice_yr	numeric(4),
@input_notice_num	int

as

--Revision History
--1.0 Creation
--1.1 EricZ 04/20/2004; added RTRIM() to select cursor statement - fixed HelpSTAR #15773

declare @bAgent		char(1)
declare @bAddrLine1	char(1)
declare @bAddrLine2	char(1)
declare @bAddrLine3	char(1)

declare @exp_addr_line1	varchar(100)
declare @exp_addr_line2	varchar(100)
declare @exp_addr_line3	varchar(100)
declare @exp_addr_line4	varchar(100)
declare @exp_addr_line5	varchar(100)
declare @exp_addr_line6	varchar(100)
declare @city_state_zip	varchar(100)


declare @prop_id 		int
declare @sup_num 		int
declare @sup_yr 		numeric(4)
declare @notice_owner_id	int
declare @notice_owner_name 	varchar(60)
declare @owner_id		int	  
declare @file_as_name 		varchar(60)
declare @addr_line1 		varchar(60)
declare @addr_line2 		varchar(60)
declare @addr_line3		varchar(60)						  
declare @addr_city 		varchar(60)
declare @addr_state 		varchar(60)
declare @addr_zip		varchar(60)

DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
FOR select  	prop_id,
		sup_num,
		sup_yr,
		notice_owner_id,
		rtrim(notice_owner_name),
		owner_id,
		rtrim(file_as_name),
    		rtrim(addr_line1),
		rtrim(addr_line2),
		rtrim(addr_line3),
		rtrim(addr_city),
		rtrim(addr_state),
		rtrim(addr_zip)
    from    appr_notice_prop_list
    where notice_num = @input_notice_num
    and     notice_yr = @input_notice_yr

open APPR_NOTICE_PROP_LIST_CURSOR
fetch next from APPR_NOTICE_PROP_LIST_CURSOR into @prop_id, @sup_num, @sup_yr, @notice_owner_id, 
						  @notice_owner_name, @owner_id,
						  @file_as_name, @addr_line1, @addr_line2, @addr_line3,
						  @addr_city, @addr_state, @addr_zip

while (@@fetch_status = 0)
begin
	select @bAgent	   = 0	
	select @bAddrLine1 = 0	
	select @bAddrLine2 = 0	
	select @bAddrLine3 = 0	

	select @exp_addr_line1	= NULL
	select @exp_addr_line2	= NULL
	select @exp_addr_line3	= NULL
	select @exp_addr_line4	= NULL
	select @exp_addr_line5	= NULL
	select @exp_addr_line6	= NULL
	select @city_state_zip	= NULL

	select @city_state_zip = @addr_city + ', ' + @addr_state + ' ' + @addr_zip

	select @exp_addr_line1	= @notice_owner_name
	
	/* check for agent */
	if (@notice_owner_id <> @owner_id)
	begin
		/* indicates agent, also indicates that line1 & line2 have the same name in it must eliminate second name */
		select @exp_addr_line2	= '%' +  @file_as_name
	end
	
	if (@addr_line1 is not null or
	    @addr_line1 <> '')
	begin
		if (@exp_addr_line2 is null)
		begin
			select @exp_addr_line2 = @addr_line1
		end
		else if  (@exp_addr_line3 is null)
		begin
			select @exp_addr_line3 = @addr_line1
		end
	end

	if (@addr_line2 is not null or
	    @addr_line2 <> '')
	begin
		if (@exp_addr_line2 is  null)
		begin
			select @exp_addr_line2 = @addr_line2
		end
		else if  (@exp_addr_line3 is  null)
		begin
			select @exp_addr_line3 = @addr_line2
		end
		else if  (@exp_addr_line4 is null)
		begin
			select @exp_addr_line4 = @addr_line2
		end
	end

	
	if (@addr_line3 is not null or
	    @addr_line3 <> '')
	begin
		if (@exp_addr_line2 is  null)
		begin
			select @exp_addr_line2 = @addr_line3
		end
		else if  (@exp_addr_line3 is null)
		begin
			select @exp_addr_line3 = @addr_line3
		end
		else if  (@exp_addr_line4 is null)
		begin
			select @exp_addr_line4 = @addr_line3
		end
		else if  (@exp_addr_line5 is null)
		begin
			select @exp_addr_line5 = @addr_line3
		end
	end

	if (@city_state_zip is not null or
	    @city_state_zip <> '')
	begin
		if (@exp_addr_line2 is null)
		begin
			select @exp_addr_line2 = @city_state_zip
		end
		else if  (@exp_addr_line3 is null)
		begin
			select @exp_addr_line3 = @city_state_zip
		end
		else if  (@exp_addr_line4 is null)
		begin
			select @exp_addr_line4 = @city_state_zip
		end
		else if  (@exp_addr_line5 is null)
		begin
			select @exp_addr_line5 = @city_state_zip
		end
		else if  (@exp_addr_line6 is null)
		begin
			select @exp_addr_line6 = @city_state_zip
		end
	end
	
	

	update appr_notice_prop_list
	set 	exp_addr_line1 = @exp_addr_line1,
		exp_addr_line2 = @exp_addr_line2,
		exp_addr_line3 = @exp_addr_line3,
		exp_addr_line4 = @exp_addr_line4,
		exp_addr_line5 = @exp_addr_line5,
		exp_addr_line6 = @exp_addr_line6
	where appr_notice_prop_list.notice_num = @input_notice_num
	and   appr_notice_prop_list.notice_yr  = @input_notice_yr
	and   appr_notice_prop_list.prop_id    = @prop_id
	and   appr_notice_prop_list.owner_id   = @owner_id
	and   appr_notice_prop_list.sup_num    = @sup_num
	and   appr_notice_prop_list.sup_yr     = @sup_yr








	fetch next from APPR_NOTICE_PROP_LIST_CURSOR into @prop_id, @sup_num, @sup_yr, @notice_owner_id, @notice_owner_name, @owner_id,
						  @file_as_name, @addr_line1, @addr_line2, @addr_line3,
						  @addr_city, @addr_state, @addr_zip
end

close APPR_NOTICE_PROP_LIST_CURSOR
deallocate APPR_NOTICE_PROP_LIST_CURSOR

GO

