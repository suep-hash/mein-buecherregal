const STATUS_LABELS = {
  gelesen: "Gelesen",
  "lese-ich": "Lese ich gerade",
  "moechte-ich": "Möchte ich lesen",
};

export default function StatusBadge({ status }) {
  return <span className="statusBadge">{STATUS_LABELS[status] ?? status}</span>;
}
