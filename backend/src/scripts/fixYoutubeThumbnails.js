import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import Content from '../models/Content.model.js'

const fixThumbnails = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const contents = await Content.find({ 
    source: 'youtube', 
    $or: [{ poster: null }, { poster: '' }, { poster: { $exists: false } }]
  })

  console.log(`Found ${contents.length} YouTube contents without poster`)

  let fixed = 0
  for (const content of contents) {
    if (content.externalId) {
      content.poster = `https://img.youtube.com/vi/${content.externalId}/mqdefault.jpg`
      await content.save()
      fixed++
    }
  }

  console.log(`✅ Fixed ${fixed} YouTube thumbnails`)
  await mongoose.disconnect()
  process.exit(0)
}

fixThumbnails().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
