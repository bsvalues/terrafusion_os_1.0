import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import coreRoutes from './core-routes'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || '5000')

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api', coreRoutes)

app.use(express.static(path.join(__dirname, '../dist/public')))

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'))
})

app.listen(PORT, () => {
  console.log(`Terrafusion Civil Infrastructure Server running on port ${PORT}`)
  console.log(`Visit http://localhost:${PORT} to access the application`)
})

export default app