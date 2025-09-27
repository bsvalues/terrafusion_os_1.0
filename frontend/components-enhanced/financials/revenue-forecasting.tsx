import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"

export function RevenueForecasting() {const forecast = [
    { year: "2025", counties: 500, arr: "$50M", growth: "127%"},
    {year: "2026", counties: 750, arr: "$180M", growth: "260%"},
    {year: "2027", counties: 1000, arr: "$420M", growth: "133%"},
    {year: "2028", counties: 1250, arr: "$780M", growth: "86%"},
    {year: "2029", counties: 1500, arr: "$1.2B", growth: "54%"},
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">5-Year Revenue Forecast</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-primary/20"><><th className="text-left py-3 text-gray-300">Year</th><th
</>
className="text-left py-3 text-gray-300">Counties</th><><th className="text-left py-3 text-gray-300">ARR</th><th
</>
className="text-left py-3 text-gray-300">Growth</th></tr></thead><tbody>{forecast.map((item /* , index */) => (<tr key={index} className="border-b border-dark-700/50"><><td className="py-4 text-white font-semibold">{item.year}</td><td
</>
className="py-4 text-gray-300">{item.counties}</td><><td className="py-4 text-accent font-bold">{item.arr}</td><td
</>
className="py-4 text-transcend">+{item.growth}</td></tr>))}</tbody></table></div></CardContent></Card>
  )
}
