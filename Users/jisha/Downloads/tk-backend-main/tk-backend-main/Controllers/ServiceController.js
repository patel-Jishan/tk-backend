const Service = require("../Models/ServiceSchema");

// ➕ Create Service
async function CreateService(req, res) {
    try {
        let service = await Service.create(req.body);
        res.json({ success: true, service });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 📄 Get All Services
async function GetServices(req, res) {
    try {
        let services = await Service.find();
        res.json({ success: true, services });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


async function DeleteService(req, res) {
    try {
        let { id } = req.params;

        let service = await Service.findById(id);
        if (!service) {
            return res.json({ success: false, message: "Service not found" });
        }

        await Service.findByIdAndDelete(id);

        res.json({ success: true, message: "Service deleted successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


module.exports = { CreateService, GetServices, DeleteService };