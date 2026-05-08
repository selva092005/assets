import ViewModal from "../common/ViewModal";

/**
 * AssetView – thin wrapper around ViewModal for asset details
 */
export default function AssetView({ open, data, onClose }) {
  return (
    <ViewModal
      open={open}
      title="Asset Details"
      data={data}
      onClose={onClose}
    />
  );
}
