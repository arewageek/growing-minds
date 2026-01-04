import mongoose, { Schema, Document, model, models } from "mongoose"

export interface IUser extends Document {
  name: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
)

const User = models.User || model<IUser>("User", UserSchema)

export default User
