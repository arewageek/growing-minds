import mongoose from "mongoose"

const MONGODB_URI = (process.env.MONGODB_URI || process.env.DATABASE_URI) as string

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("MongoDB Connected")
  } catch (error) {
    console.error("MongoDB Connection Error:", error)
    throw error
  }
}

export default dbConnect
