import { useEffect, useState } from "react";
import "../../styles/Assets.css";
import { getAssets } from "../../service/login";

const Assets = () => {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data); // ✅ store API data
      console.log(data);
    } catch (error) {
      console.log("Error fetching assets", error);
    }
  };

  return (
    <div className="ass">
      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
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

        <button className="btn btn-dark">+ Add Asset</button>
      </div>

      <p className="text-muted">{assets.length} assets found</p>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Asset Name</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Location</th>
              <th>Value</th>
              <th>Condition</th>
            </tr>
          </thead>

          <tbody>
            {assets.map((item) => (
              <tr key={item.assetId}>
                <td>{item.assetId}</td>
                <td>{item.assetName}</td>
                <td>{item.brand}</td>

                <td>
                  <span
                    className={`badge ${
                      item.status === "Active"
                        ? "bg-success"
                        : item.status === "In Maintenance"
                        ? "bg-warning text-dark"
                        : "bg-danger"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td>{item.locationName}</td>
                <td>₹{item.cost}</td>

                <td
                  className={
                    item.assetCondition === "Good"
                      ? "text-success"
                      : item.assetCondition === "Fair"
                      ? "text-warning"
                      : "text-danger"
                  }
                >
                  {item.assetCondition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assets;