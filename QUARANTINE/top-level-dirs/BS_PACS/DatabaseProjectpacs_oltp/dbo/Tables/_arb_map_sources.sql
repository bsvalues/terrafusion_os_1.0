CREATE TABLE [dbo].[_arb_map_sources] (
    [InquiryOwner]       VARCHAR (10) NOT NULL,
    [InquiryMortgage]    VARCHAR (10) NOT NULL,
    [InquiryAgent]       VARCHAR (10) NOT NULL,
    [InquiryAttorney]    VARCHAR (10) NOT NULL,
    [InquiryCollector]   VARCHAR (10) NOT NULL,
    [InquiryTaxDistrict] VARCHAR (10) NOT NULL,
    [InquiryTaxserver]   VARCHAR (10) NOT NULL,
    [ProtestOwner]       VARCHAR (10) NOT NULL,
    [ProtestMortgage]    VARCHAR (10) NOT NULL,
    [ProtestAgent]       VARCHAR (10) NOT NULL,
    [ProtestAttorney]    VARCHAR (10) NOT NULL,
    [ProtestCollector]   VARCHAR (10) NOT NULL,
    [ProtestTaxDistrict] VARCHAR (10) NOT NULL,
    [ProtestTaxserver]   VARCHAR (10) NOT NULL,
    [lARBMapSourceID]    INT          IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK__arb_map_sources] PRIMARY KEY CLUSTERED ([lARBMapSourceID] ASC) WITH (FILLFACTOR = 100)
);


GO

