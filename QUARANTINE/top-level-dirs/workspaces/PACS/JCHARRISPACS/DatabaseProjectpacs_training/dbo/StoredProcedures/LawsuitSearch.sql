

CREATE procedure LawsuitSearch 

@strSQL		varchar(3072)

as

set nocount on

declare @lawsuit_id         	int  
declare @cause_num          	varchar(50)  
declare @attorney_suit_num 	varchar(50)  
declare @court 			varchar(50)  
declare @judge 		varchar(50)  
declare @reason_for_suit 	varchar(50)  
declare @status 		varchar(10)  
declare @date_filed 		datetime 
declare @certified_date 	datetime 
declare @trial_date 		datetime 
declare @comments 		varchar(500)  
declare @jury_type 		char(5)  
declare @prop_list		varchar(100)
declare @year_list		varchar(100)
declare @year			numeric(4)
declare @prop_id		int
declare @strCursor		varchar(3200)
declare @owner_name		varchar(70)
declare @appraiser_nm		varchar(40)
declare @appraiser_list		varchar(100)


/* create temporary table */

CREATE TABLE [#lawsuit] (
	[lawsuit_id] [int] NOT NULL ,
	[cause_num] [varchar] (50)  NULL ,
	[attorney_suit_num] [varchar] (50)  NULL ,
	[court] [varchar] (50)  NULL ,
	[judge] [varchar] (50)  NULL ,
	[reason_for_suit] [varchar] (50)  NULL ,
	[status] [varchar] (10)  NULL ,
	[date_filed] [datetime] NULL ,
	[certified_date] [datetime] NULL ,
	[trial_date] [datetime] NULL ,
	[comments] [varchar] (500)  NULL ,
	[jury_type] [char] (5)  NULL ,
	[prop_list] varchar(100) not null,
	[year_list] varchar(100) not null,
	[owner_name] varchar(70) null,
	[appraiser_list] varchar(100) null,
	CONSTRAINT [PK_lawsuit] PRIMARY KEY  CLUSTERED 
	(
		[lawsuit_id]
	)  ON [PRIMARY] 
) ON [PRIMARY]


set @strCursor = 'declare lawsuit_list CURSOR FAST_FORWARD '
set @strCursor = @strCursor + ' for '
set @strCursor = @strCursor + @strSQL

exec (@strCursor)

open lawsuit_list
fetch next from lawsuit_list into @lawsuit_id

while (@@FETCH_STATUS = 0)
begin

	set @prop_list = ''
	set @year_list = ''

	select
	@cause_num         = cause_num,                                          
	@attorney_suit_num = attorney_suit_num,                                  
	@court 		   = court,                                              
	@judge		   = judge,                                              
	@reason_for_suit   = reason_for_suit,                                    
	@status            = status,     
	@date_filed        = date_filed,                                             
	@certified_date    = certified_date,                                         
	@trial_date        = trial_date,                                             
	@comments          = comments,                                                                                                                                                                                                                                
                         
	@jury_type         = jury_type 
	From lawsuit
	where lawsuit_id = @lawsuit_id
	
	DECLARE lawsuit_property CURSOR FAST_FORWARD
	FOR
	select distinct lawsuit_yr
	from lawsuit_property
	where  lawsuit_id = @lawsuit_id
	order by lawsuit_yr

	open lawsuit_property
	fetch next from lawsuit_property into @year
	/* Build the year list */
	while (@@FETCH_STATUS = 0)
	begin
		if (@year_list = '')
		begin
			set @year_list = @year
		end
		else
		begin
			set @year_list = @year_list + ', ' + convert(varchar(4), @year)
		end

		fetch next from lawsuit_property into @year
	end

	close lawsuit_property
	deallocate lawsuit_property
	
	DECLARE lawsuit_property CURSOR FAST_FORWARD
	FOR
	select distinct prop_id
	from lawsuit_property
	where lawsuit_id = @lawsuit_id
	order by prop_id
	
	open lawsuit_property
	fetch next from lawsuit_property into @prop_id
	/* Build the property list */
	while (@@FETCH_STATUS = 0)
	begin
		if (@prop_list = '')
		begin
			set @prop_list = convert(varchar(12), @prop_id)
		end
		else
		begin
			set @prop_list = @prop_list + ', ' + convert(varchar(12), @prop_id)
		end

		fetch next from lawsuit_property into @prop_id
	end
	
	close lawsuit_property
	deallocate lawsuit_property

	/*
		Get the name of the "first" owner of the "first" property
	
		We shall define:
			"first" owner -- The owner with the majority interest
			"first" property -- The property with the highest certified value
	*/
	set @owner_name = null
	select @owner_name = a.file_as_name
	from lawsuit_property as lp with(nolock)
	join prop_supp_assoc as psa with(nolock) on
		lp.prop_id = psa.prop_id and
		lp.lawsuit_yr = psa.owner_tax_yr
	join owner as o with(nolock) on
		psa.prop_id = o.prop_id and
		psa.owner_tax_yr = o.owner_tax_yr and
		psa.sup_num = o.sup_num
	join account as a with(nolock) on
		o.owner_id = a.acct_id
	where
		lp.lawsuit_id = @lawsuit_id
	order by
		lp.certified_value asc, o.pct_ownership asc


	DECLARE lawsuit_property CURSOR FAST_FORWARD
	FOR
	select distinct appraiser_nm
	from lawsuit_property as lp
	with (nolock)
	inner join property_val as pv
	with (nolock)
	on lp.prop_id = pv.prop_id
	and lp.lawsuit_yr = pv.prop_val_yr
	and pv.sup_num = 0
	inner join appraiser
	with (nolock)
	on pv.last_appraiser_id = appraiser.appraiser_id
	where lawsuit_id = @lawsuit_id
	order by appraiser_nm

	set @appraiser_list = ''
	
	open lawsuit_property
	fetch next from lawsuit_property into @appraiser_nm

	while @@FETCH_STATUS = 0
	begin
		if @appraiser_list = ''
		begin
			set @appraiser_list = @appraiser_nm
		end
		else
		begin
			set @appraiser_list = @appraiser_list + ', ' + @appraiser_nm
		end

		fetch next from lawsuit_property into @appraiser_nm
	end

	close lawsuit_property
	deallocate lawsuit_property
	
	insert into #lawsuit
	(
	lawsuit_id,
	cause_num ,                                                
	attorney_suit_num,                                
	court, 		                                            
	judge,		                                          
	reason_for_suit,                                       
	status,            
	date_filed,                                              
	certified_date,                                            
	trial_date,                                                 
	comments,                                                                                                                                                                                                                                                     
        
	jury_type,
	prop_list,
	year_list,
	owner_name,
	appraiser_list
	)
	values
	(
	@lawsuit_id,
	@cause_num ,                                                
	@attorney_suit_num,                                
	@court, 		                                            
	@judge,		                                          
	@reason_for_suit,                                       
	@status,            
	@date_filed,                                              
	@certified_date,                                            
	@trial_date,                                                 
	@comments,                                                                                                                                                                                                                                                    
         
	@jury_type,
	@prop_list,
	@year_list,
	@owner_name,
	@appraiser_list
	)


	fetch next from lawsuit_list into @lawsuit_id
end

close lawsuit_list
deallocate lawsuit_list

set nocount off

select * from #lawsuit

drop table #lawsuit

GO

