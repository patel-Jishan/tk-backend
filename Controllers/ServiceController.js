const Service = require("../Models/ServiceSchema");

// ➕ Create Service
async function CreateService(req, res) {
  try {
    const { name, type, role, priceType, price } = req.body;

    if (!name || !type || !role || !priceType || price == null) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    const service = await Service.create({
      name,
      type,
      role,
      priceType,
      price
    });

    res.json({
      success: true,
      message: "Service created successfully",
      service
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

// 📄 Get All Services
async function GetServices(req, res) {
  try {
    const services = await Service.find().sort({ _id: -1 });

    res.json({
      success: true,
      count: services.length,
      services
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

// ✏️ Update Service
async function UpdateService(req, res) {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.json({
        success: false,
        message: "Service not found"
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      service: updatedService
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

// 🗑️ Delete Service
async function DeleteService(req, res) {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.json({
        success: false,
        message: "Service not found"
      });
    }

    await Service.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Service deleted successfully"
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  CreateService,
  GetServices,
  UpdateService,
  DeleteService
};



// const Service = require("../Models/ServiceSchema");

// // ➕ Create Service
// async function CreateService(req, res) {
//     try {
//         let service = await Service.create(req.body);
//         res.json({ success: true, service });
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// }

// // 📄 Get All Services
// async function GetServices(req, res) {
//     try {
//         let services = await Service.find();
//         res.json({ success: true, services });
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// }



// async function DeleteService(req, res) {
//     try {
//         let { id } = req.params;

//         let service = await Service.findById(id);
//         if (!service) {
//             return res.json({ success: false, message: "Service not found" });
//         }

//         await Service.findByIdAndDelete(id);

//         res.json({ success: true, message: "Service deleted successfully" });

//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// }


// module.exports = { CreateService, GetServices, DeleteService };














