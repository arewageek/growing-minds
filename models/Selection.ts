import mongoose, { Schema, Document, model, models } from "mongoose"

export interface ISelection extends Document {
  userId: mongoose.Types.ObjectId
  week: string // Format: YYYY-WW or similar
  createdAt: Date
  updatedAt: Date
}

const SelectionSchema = new Schema<ISelection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    week: { type: String, required: true },
  },
  { timestamps: true },
)

// Index to ensure only one selection per week
SelectionSchema.index({ week: 1 }, { unique: true })

const Selection = models.Selection || model<ISelection>("Selection", SelectionSchema)

export default Selection
