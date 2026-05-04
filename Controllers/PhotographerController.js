const Photographer = require("../Models/PhotographerSchema");

async function CreatePhotographer(req, res) {
    try {
        let photographer = await Photographer.create(req.body);
        res.json({ success: true, photographer });
    } catch (error) {
        res.json({ success: false, message: error.message });
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
        let updated = await Photographer.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, updated });
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

        await Photographer.findByIdAndDelete(id);

        res.json({ success: true, message: "Photographer deleted successfully" });

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