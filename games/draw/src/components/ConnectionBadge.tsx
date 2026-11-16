import { CloudCheckIcon, CloudOffIcon } from "./Icons";

export function ConnectionBadge({ online }: { online: boolean }) {
  return (
    <div className={`connection-badge ${online ? "is-online" : "is-offline"}`} title={online ? "Online" : "Offline"}>
      {online ? <CloudCheckIcon size={18} /> : <CloudOffIcon size={18} />}
      <span>{online ? "Online" : "Offline"}</span>
    </div>
  );
}