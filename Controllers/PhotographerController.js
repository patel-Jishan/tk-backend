const Photographer = require("../Models/PhotographerSchema");
const PhotographerPayment = require("../Models/PhotographerPaymentSchema");
const cloudinary = require("../Config/cloudinary");

async function CreatePhotographer(req, res) {
    try {
        // let { name, email, phone, city, role } = req.body;
        let { name, email, phone, city, role, perDayRate } = req.body;

        let avatarData = {};

        // 🔥 Avatar upload (optional)
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "photographers",
                width: 300,
                height: 300,
                crop: "fill"
            });

            avatarData = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }

        if (!role?.trim()) {
            return res.json({
                success: false,
                message: "Role is required"
            });
        }

        // 🔥 Save Photographer
        let photographer = await Photographer.create({
            name,
            email,
            phone,
            city,
            role,
            perDayRate,
            avatar: avatarData
        });

        res.json({
            success: true,
            message: "Photographer created successfully",
            photographer
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

async function GetPhotographers(req, res) {
    try {
        let data = await Photographer.find();
        res.json({ success: true, data });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

async function UpdatePhotographer(req, res) {
    try {
        let { id } = req.params;
        let {role} = req.body;

        let photographer = await Photographer.findById(id);
        if (!photographer) {
            return res.json({ success: false, message: "Photographer not found" });
        }
        if (!role?.trim()) {
            return res.json({
                success: false,
                message: "Role is required"
            });
        }

        let updateData = req.body;

        // 🔥 New avatar upload
        if (req.file) {

            // ❌ old image delete
            if (photographer.avatar?.public_id) {
                await cloudinary.uploader.destroy(photographer.avatar.public_id);
            }

            // ✅ new upload
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "photographers",
                width: 300,
                height: 300,
                crop: "fill"
            });

            updateData.avatar = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }
        // 🔥 check if any payment exists for current month
        let currentMonth = new Date().toISOString().slice(0, 7);

        let existingPayment = await PhotographerPayment.findOne({
            photographerId: id,
            month: currentMonth
        });

        if (existingPayment && req.body.perDayRate) {
            return res.json({
                success: false,
                message: "Cannot change rate. Already used in current month"
            });
        }
        let updated = await Photographer.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: "Photographer updated",
            updated
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


async function DeletePhotographer(req, res) {
    try {
        let { id } = req.params;

        let photographer = await Photographer.findById(id);
        if (!photographer) {
            return res.json({ success: false, message: "Photographer not found" });
        }

        // 🔥 Cloudinary se delete
        if (photographer.avatar?.public_id) {
            await cloudinary.uploader.destroy(photographer.avatar.public_id);
        }

        // 🔥 DB se delete
        await Photographer.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Photographer deleted successfully"
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}




module.exports = {
    CreatePhotographer,
    GetPhotographers,
    UpdatePhotographer,
    DeletePhotographer
};
