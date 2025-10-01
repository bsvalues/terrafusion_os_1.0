import {CountySegmentation} from "./county-segmentation"
import {MessagingFramework} from "./messaging-framework"
import {CampaignExecution} from "./campaign-execution"
import {PerformanceMetrics} from "./performance-metrics"

export function StrategicDashboard() {return (
    <div className="space-y-8"><CountySegmentation /><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><MessagingFramework /><><CampaignExecution /></div><PerformanceMetrics
</>
/></div>
  )}
