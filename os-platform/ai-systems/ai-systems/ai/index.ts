import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.AI_PORT || 8001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ 
    message: 'Terrafusion AI Service',
    version: '2.0.0',
    status: 'running'
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.post('/analyze', (req, res) => {
  const { data } = req.body
  res.json({ 
    analysis: 'AI analysis completed',
    data: data,
    timestamp: new Date().toISOString()
  })
})

app.listen(port, () => {
  console.log(`Terrafusion AI Service running on port ${port}`)
}) 