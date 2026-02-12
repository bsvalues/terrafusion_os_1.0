CREATE TABLE [dbo].[penalty_and_interest] (
    [p_and_i_id]                        INT              IDENTITY (1, 1) NOT NULL,
    [type_cd]                           VARCHAR (5)      NOT NULL,
    [percentage]                        NUMERIC (13, 10) NOT NULL,
    [frequency_type_cd]                 VARCHAR (5)      NOT NULL,
    [begin_date]                        DATETIME         NULL,
    [end_date]                          DATETIME         NULL,
    [ref_id]                            INT              NOT NULL,
    [ref_type_cd]                       VARCHAR (5)      NOT NULL,
    [year]                              NUMERIC (4)      NULL,
    [ref_date_type_cd]                  VARCHAR (5)      NULL,
    [ref_date_offset]                   INT              NULL,
    [ref_cd]                            VARCHAR (50)     NULL,
    [fee_type_cd]                       VARCHAR (10)     NULL,
    [begin_date_h2]                     DATETIME         NULL,
    [end_date_h2]                       DATETIME         NULL,
    [ref_date_offset_months]            INT              NULL,
    [penalty_interest_property_type_cd] VARCHAR (10)     NULL,
    CONSTRAINT [CPK_penalty_and_interest] PRIMARY KEY CLUSTERED ([p_and_i_id] ASC) WITH (FILLFACTOR = 100)
);


GO


		create trigger tr_penalty_and_interest_delete_insert_update_MemTable
		on penalty_and_interest
		for delete, insert, update
		as
 
		if ( @@rowcount = 0 )
		begin
			return
		end
 
		set nocount on
 
		update table_cache_status with(rowlock)
		set lDummy = 0
		where szTableName = 'penalty_and_interest'

GO

