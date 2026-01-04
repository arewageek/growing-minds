"use server"

import dbConnect from "@/lib/db"
import User from "@/models/User"
import WeeklySelection from "@/models/Selection"

function getNextSaturdayDate() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() + (6 - day)
  const nextSat = new Date(d.setDate(diff))
  return nextSat.toISOString().split("T")[0] // YYYY-MM-DD
}

export async function getUsers() {
  await dbConnect()
  const users = await User.find({}).lean()
  
  // Get selection counts for all users
  const usersWithCounts = await Promise.all(
    users.map(async (user: any) => {
      const count = await WeeklySelection.countDocuments({ userId: user._id })
      return {
        ...user,
        selectionCount: count,
      }
    })
  )

  return JSON.parse(JSON.stringify(usersWithCounts))
}

export async function getLatestSelection() {
  await dbConnect()
  const week = getNextSaturdayDate()
  const selection = await WeeklySelection.findOne({ week }).populate("userId").lean()
  return selection ? JSON.parse(JSON.stringify(selection)) : null
}

export async function saveSelection(userId: string) {
  await dbConnect()
  const week = getNextSaturdayDate()

  // Double check if already exists for the week
  const existing = await WeeklySelection.findOne({ week })
  if (existing) {
    throw new Error("Facilitator already picked for this week")
  }

  const selection = await WeeklySelection.create({
    userId,
    week,
  })

  return JSON.parse(JSON.stringify(selection))
}
