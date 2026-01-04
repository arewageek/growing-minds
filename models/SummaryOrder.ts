import mongoose, { Schema, Document, model, models } from "mongoose"

export interface ISummaryOrder extends Document {
  week: string // Format: YYYY-MM-DD (matches Selection week)
  orderedUserIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const SummaryOrderSchema = new Schema<ISummaryOrder>(
  {
    week: { type: String, required: true, unique: true },
    orderedUserIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  },
  { timestamps: true },
)

const SummaryOrder = models.SummaryOrder || model<ISummaryOrder>("SummaryOrder", SummaryOrderSchema)

export default SummaryOrder
