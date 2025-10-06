interface CrudHeaderProps {
  title: string;
  addLabel?: string;
  onAdd?: () => void;
}

export default function CrudHeader({ title, addLabel = "Aggiungi", onAdd }: CrudHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      {onAdd && (
        <button
          onClick={onAdd}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
