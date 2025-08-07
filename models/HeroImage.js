import mongoose, { Schema } from "mongoose";

const HeroImageSchema = new Schema(
  {
    image: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);


export const heroImageModel = mongoose.models.heroimages || mongoose.model("heroimage",HeroImageSchema) 