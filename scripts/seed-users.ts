import mongoose from "mongoose"
import dbConnect from "../lib/db"
import User from "../models/User"
import brandConfig from "../brand.config.json"

async function seed() {
  try {
    console.log("Connecting to database...")
    await dbConnect()
    console.log("Connected.")

    const candidates = brandConfig.candidates
    console.log(`Found ${candidates.length} candidates in brand.config.json`)

    for (const candidate of candidates) {
      const existingUser = await User.findOne({ name: candidate.name })
      if (!existingUser) {
        await User.create({ name: candidate.name })
        console.log(`Created user: ${candidate.name}`)
      } else {
        console.log(`User already exists: ${candidate.name}`)
      }
    }

    console.log("Seeding completed successfully.")
    process.exit(0)
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  }
}

seed()
