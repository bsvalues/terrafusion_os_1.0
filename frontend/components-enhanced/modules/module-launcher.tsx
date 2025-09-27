"use client"

import {useState} from "react"
import {useModuleRegistry} from "./module-registry"
import {ModuleCard} from "./module-card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Search, Filter, Grid, List} from '@mui/icons-material'
import type {ModuleCategory} from "@/lib/modules"

const categories: {value: ModuleCategory | "all"; label: string}[] = [
  {value: "all", label: "All Modules"},
  {value: "assessment", label: "Assessment"},
  {value: "permits", label: "Permits"},
  {value: "planning", label: "Planning"},
  {value: "finance", label: "Finance"},
  {value: "citizen-services", label: "Citizen Services"},
  {value: "administration", label: "Administration"},
  {value: "analytics", label: "Analytics"},
  {value: "security", label: "Security"},
]

export function ModuleLauncher() {const { modules, activeModules, toggleModule} = useModuleRegistry()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredModules = modules.filter((module) =>{const matchesSearch =
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory
    return matchesSearch && matchesCategory})

  const handleLaunch = (moduleId: string) => {
    // In a real implementation, this would navigate to the module or open it in a new context
    console.log(`Launching module: ${moduleId}`)
  }

  const handleConfigure = (moduleId: string) => {
    // In a real implementation, this would open the module configuration panel
    console.log(`Configuring module: ${moduleId}`)
  }

  return (<div className="space-y-6">{/* Header */}<div className="space-y-4"><div className="flex items-center justify-between"><div><><h1 className="text-3xl font-heading font-bold">Module Launcher</h1><p
</>className="text-muted-foreground">
              Manage and launch your Terrafusion modules. {activeModules.length} of {modules.length} modules active.</p></div><Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20">All Systems: Ready</Badge></div>{/* Controls */}<div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><><Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            /></div><Select
</>

            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as ModuleCategory | "all")}
          ><SelectTrigger className="w-48"><Filter className="w-4 h-4 mr-2" /><><SelectValue /></SelectTrigger><SelectContent
</></>>{categories.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}</SelectContent></Select><div className="flex gap-2"><Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><><Grid className="w-4 h-4" /></Button><Button
</>
variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button></div></div></div>{/* Module Grid */}<div
        className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}
      >{filteredModules.map((module) => (<ModuleCard
            key={module.id}
            module={module}
            onToggle={toggleModule}
            onLaunch={handleLaunch}
            onConfigure={handleConfigure}
            showControls={true} />))}</div>{filteredModules.length === 0 && (<div className="text-center py-12"><><p className="text-muted-foreground">No modules found matching your criteria.</p><Button
</>variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedCategory("all")}}
            className="mt-4"
          >
            Clear Filters</Button></div>)}</div>
  )
}
