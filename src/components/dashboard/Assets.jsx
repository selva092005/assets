import { useEffect, useState } from "react";
import "../../styles/Assets.css";
import { getAssets } from "../../service/assets_service";
import { getAssetTypes } from "../../service/assets_service";
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
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

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
  fetchAssets(search, page);
  fetchTypes(); // ✅ ADD THIS LINE
}, [page]);

const fetchTypes = async () => {
  try {
    const res = await getAssetTypes();
    console.log("TYPES:", res);

    // ✅ THIS IS THE IMPORTANT LINE
    setTypes(res.data.data || []);
  } catch (error) {
    console.log("Error fetching types", error);
  }
};

const fetchAssets = async (keyword = "", page = 0) => {
  try {
    setLoading(true);
const data = await getAssets({
  name: keyword,   // ✅ match backend
  page: page,
  // size: 5          // optional but recommended
});

    console.log("API Response:", data);

    // ✅ FIX HERE
    setAssets(data.data.content || []);
    setTotalPages(data.data.totalPages || 0);

  } catch (error) {
    console.log("Error fetching assets", error);
    setAssets([]);
  } finally {
    setLoading(false);
  }
};

//   const fetchTypes = async () => {
//   try {
//     const res = await getAssetTypes();
//     console.log("TYPES:", res);

//     setTypes(res.data || []);
//   } catch (error) {
//     console.log("Error fetching types", error);
//   }
// };




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
    const id = item.assetId; // ✅ FIXED

    const res = await getAssetById(id);

    console.log("VIEW API:", res);

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
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
<div className="btn-group-custom">
  <button
    className="btn-icon search"
    onClick={() => {
  setPage(0); // reset page
  fetchAssets(search, 0);
}}
    title="Search"
  >
    <i className="bi bi-search"></i>
  </button>

  <button
    className="btn-icon reset"
    onClick={() => {
  setSearch("");
  setPage(0);
  fetchAssets("", 0);
}}
    title="Reset"
  >
    <i className="bi bi-arrow-clockwise"></i>
  </button>
</div>

        <select className="form-select w-auto">
  <option value="">All Categories</option>

  {types.map((type) => (
    <option key={type.typeId} value={type.typeId}>
      {type.typeName}
    </option>
  ))}
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
  {loading ? (
    <tr>
      <td colSpan="8" className="text-center">
        ⏳ Loading assets...
      </td>
    </tr>
  ) : Array.isArray(assets) && assets.length > 0 ? (
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

      {/* ✅ PAGINATION */}
<div className="d-flex justify-content-between align-items-center mt-3">

  <span className="text-muted">
    Page {page + 1} of {totalPages}
  </span>

  <div>
    <button
      className="btn btn-outline-secondary me-2"
      disabled={page === 0}
      onClick={() => setPage(page - 1)}
    >
      Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        onClick={() => setPage(i)}
        className={`btn me-1 ${
          page === i ? "btn-primary" : "btn-outline-primary"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      className="btn btn-outline-secondary ms-2"
      disabled={page === totalPages - 1}
      onClick={() => setPage(page + 1)}
    >
      Next
    </button>
  </div>

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
          <div className="modal-box square-card">
  <h5 className="modal-title">Asset Details</h5>

  <div className="details-container">
    {Object.entries(viewData).map(([key, value]) => (
      <div key={key} className="detail-item">
        <span className="label">{key}</span>
        <span className="value">{String(value)}</span>
      </div>
    ))}
  </div>

  <div className="d-flex justify-content-center mt-3">
    <button
      className="btn close-btn"
      onClick={() => setViewModal(false)}
    >
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