import { useEffect, useState } from "react";
import "../../styles/Assets.css";
import { getAssets } from "../../service/assets_service";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import {
  addAsset,
  deleteAsset,
  updateAsset,
  getAssetById,
} from "../../service/assets_service";

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);

  // ✅ UPDATED STATE (FULL Swagger match)
  const [newAsset, setNewAsset] = useState({
    assetId: null,
    assetName: "",
    serialNumber: "",
    brand: "",
    model: "",
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    status: "AVAILABLE",
    assetCondition: "GOOD",
    notes: "",
    typeId: "",
    locationId: "",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await getAssets();
      console.log("API Response:", data);
      setAssets(data.data.content || []);
    } catch (error) {
      console.log("Error fetching assets", error);
      setAssets([]);
    }
  };

  const handleChange = (e) => {
    setNewAsset({
      ...newAsset,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ ADD / UPDATE
  const handleAddAsset = async () => {
    try {
      console.log("Saving:", newAsset);

      if (newAsset.assetId) {
        const payload = {
          ...newAsset,
          id: newAsset.assetId,
        };

        await updateAsset(newAsset.assetId, payload);
      } else {
        await addAsset(newAsset);
      }

      fetchAssets();
      setShowModal(false);
    } catch (error) {
      console.log("Save Error:", error);
      alert(error.response?.data?.message || "Failed to save asset");
    }
  };

  // ✅ EDIT
  const handleEdit = (item) => {
    setNewAsset({
      assetId: item.assetId || item.id,
      assetName: item.assetName || item.name,
      serialNumber: item.serialNumber || "",
      brand: item.brand || item.brandName,
      model: item.model || "",
      purchaseDate: item.purchaseDate || "",
      warrantyExpiry: item.warrantyExpiry || "",
      cost: item.cost || item.price,
      status: item.status,
      assetCondition: item.assetCondition,
      notes: item.notes || "",
      typeId: item.typeId || "",
      locationId: item.locationId || "",
    });

    setShowModal(true);
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        await deleteAsset(id);
        fetchAssets();
      } catch (error) {
        console.log("Delete Error:", error);
      }
    }
  };

  // ✅ VIEW
const handleView = async (item) => {
  try {
    const id = item.id ?? item.assetId;

    const res = await getAssetById(id);

    console.log("VIEW API:", res);

    // ✅ extract ONLY actual asset
    const asset = res.data;

    setViewData(asset);
    setViewModal(true);
  } catch (error) {
    console.log("View Error:", error);
  }
};

  return (
    <div className="ass">
      {/* Filters */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <input
          className="form-control"
          placeholder="Search by name, ID, serial..."
        />

        <select className="form-select w-auto">
          <option>All Categories</option>
        </select>

        <select className="form-select w-auto">
          <option>All Statuses</option>
        </select>

        <button
          className="btn btn-dark"
          onClick={() => {
            setNewAsset({
              assetId: null,
              assetName: "",
              serialNumber: "",
              brand: "",
              model: "",
              purchaseDate: "",
              warrantyExpiry: "",
              cost: "",
              status: "AVAILABLE",
              assetCondition: "GOOD",
              notes: "",
              typeId: "",
              locationId: "",
            });

            setShowModal(true);
          }}
        >
          + Add Asset
        </button>
      </div>

      <p className="text-muted">{assets.length} assets found</p>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle text-nowrap">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Asset Name</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Location</th>
              <th>Value</th>
              <th>Condition</th>
              <th className="text-center" style={{ width: "140px" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(assets) && assets.length > 0 ? (
              assets.map((item, index) => (
                <tr key={index}>
                  <td>{item.assetId || item.id}</td>
                  <td>{item.assetName || item.name}</td>
                  <td>{item.brand || item.brandName}</td>

                  <td>
                    <span
                      className={`badge ${
                        item.status === "AVAILABLE"
                          ? "bg-success"
                          : item.status === "ASSIGNED"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>{item.locationName || item.location}</td>
                  <td>₹{item.cost || item.price}</td>

                  <td
                    className={
                      item.assetCondition === "GOOD"
                        ? "text-success"
                        : item.assetCondition === "FAIR"
                        ? "text-warning"
                        : "text-danger"
                    }
                  >
                    {item.assetCondition}
                  </td>

                  <td className="text-center">
                    <div className="action-group">
                      <button
                        className="action-btn view"
                        onClick={() => handleView(item)}
                      >
                        <FaEye />
                      </button>

                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() =>
                          handleDelete(item.assetId || item.id)
                        }
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-box">
            <h5>Add New Asset</h5>

            <input name="assetName" placeholder="Asset Name" className="form-control mb-2" value={newAsset.assetName} onChange={handleChange} />
            <input name="serialNumber" placeholder="Serial Number" className="form-control mb-2" value={newAsset.serialNumber} onChange={handleChange} />
            <input name="brand" placeholder="Brand" className="form-control mb-2" value={newAsset.brand} onChange={handleChange} />
            <input name="model" placeholder="Model" className="form-control mb-2" value={newAsset.model} onChange={handleChange} />

            <input type="date" name="purchaseDate" className="form-control mb-2" value={newAsset.purchaseDate} onChange={handleChange} />
            <input type="date" name="warrantyExpiry" className="form-control mb-2" value={newAsset.warrantyExpiry} onChange={handleChange} />

            <input type="number" name="cost" placeholder="Cost" className="form-control mb-2" value={newAsset.cost} onChange={handleChange} />

            <select name="status" className="form-select mb-2" value={newAsset.status} onChange={handleChange}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>

            <select name="assetCondition" className="form-select mb-2" value={newAsset.assetCondition} onChange={handleChange}>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
            </select>

            <input name="notes" placeholder="Notes" className="form-control mb-2" value={newAsset.notes} onChange={handleChange} />
            <input type="number" name="typeId" placeholder="Type ID" className="form-control mb-2" value={newAsset.typeId} onChange={handleChange} />
            <input type="number" name="locationId" placeholder="Location ID" className="form-control mb-2" value={newAsset.locationId} onChange={handleChange} />

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleAddAsset}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModal && viewData && (
        <div className="modal-backdrop-custom">
          <div className="modal-box">
            <h5>Asset Details</h5>

            {Object.entries(viewData).map(([key, value]) => (
              <div key={key} className="mb-2">
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}

            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-secondary" onClick={() => setViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;