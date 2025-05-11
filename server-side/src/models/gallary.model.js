const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2; // استورد Cloudinary هنا عشان نستخدمه في الحذف

// const imageSchema = new mongoose.Schema({
//  public_id: String,
//  url: String,
// });

// module.exports  = mongoose.model("Image", imageSchema);


const imageSchema = new mongoose.Schema({
    publicId: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    // This is a reference to the document that uses this image
    reference: {
        model: { type: String },
        field: { type: String },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "reference.model",
        },
    },
});
imageSchema.pre("findOneAndDelete", async function (next) {
    const filter = this.getFilter();
    const imageDoc = await this.model.findById(filter._id).lean();

    if (imageDoc && imageDoc.reference && imageDoc.reference.documentId) {
        const refModel = mongoose.model(imageDoc.reference.model);
        const refDoc = await refModel
            .findById(imageDoc.reference.documentId)
            .lean();

        if (refDoc) {
            const fieldData = refDoc[imageDoc.reference.field];

            // Case 1: Direct reference (non-array)
            if (!Array.isArray(fieldData)) {
                if (fieldData === imageDoc._id.toString()) {
                    throw new APIError(
                        `Cannot delete image. ${imageDoc.reference.model} requires this image.`,
                        400
                    );
                } else {
                    try {
                        const deleteResult = await cloudinary.uploader.destroy(imageDoc.publicId);
                        console.log('Cloudinary Delete Result (from gallary.model):', deleteResult);
                    } catch (error) {
                        console.error('Error deleting from Cloudinary (from gallary.model):', error);
                        // لا ترمي Error هنا عشان عملية حذف الـ Image Document متتوقفش
                    }
                    return next();
                }
            }

            // Case 2: Array with <= 1 elements
            if (Array.isArray(fieldData) && fieldData.length <= 1) {
                throw new APIError(
                    `Cannot delete image. ${imageDoc.reference.model} requires at least one image.`,
                    400
                );
            }

            // Case 3: Remove the image from the array
            await refModel.updateOne(
                { _id: refDoc._id },
                { $pull: { [imageDoc.reference.field]: imageDoc._id } }
            );
        }
    }

    // If no reference or documentId, just delete from Cloudinary
    if (imageDoc && imageDoc.publicId) {
        try {
            const deleteResult = await cloudinary.uploader.destroy(imageDoc.publicId);
            console.log('Cloudinary Delete Result (from gallary.model):', deleteResult);
        } catch (error) {
            console.error('Error deleting from Cloudinary (from gallary.model):', error);
            // لا ترمي Error هنا عشان عملية حذف الـ Image Document متتوقفش
        }
    }

    next();
});

module.exports = mongoose.model("Image", imageSchema);