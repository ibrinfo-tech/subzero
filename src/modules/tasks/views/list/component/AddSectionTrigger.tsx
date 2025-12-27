export function AddSectionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="text-sm text-muted-foreground px-4 py-3 hover:text-primary"
      onClick={onClick}
    >
      + Add section
    </button>
  );
}
