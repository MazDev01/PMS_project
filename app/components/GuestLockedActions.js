import Link from "next/link";
import { IconArrowRight } from "./icons";

export default function GuestLockedActions({ nextHref, nextLabel }) {
  return (
    <div className="flex-row" style={{ marginTop: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
      {nextHref && (
        <Link href={nextHref} className="btn btn-sm btn-default">
          ดูตัวอย่างขั้นตอนถัดไป: {nextLabel} <IconArrowRight size={13} />
        </Link>
      )}
      <Link href="/guest" className="btn btn-sm btn-outline">
        กลับหน้าตัวอย่างลิงก์ทั้งหมด
      </Link>
    </div>
  );
}
