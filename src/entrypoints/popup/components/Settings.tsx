interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  return (
    <div className="section">
      <button className="btn btn-ghost" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
