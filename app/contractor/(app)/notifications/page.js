"use client";

import { useEffect } from "react";
import { IconBriefcase, IconCalendar, IconCheckCircle, IconAlertTriangle, IconFileText, IconBell } from "@/app/components/icons";
import { useNotifications } from "@/app/lib/store";
import { formatRelativeTH } from "@/app/lib/format";

// Illustrative history so the page doesn't read empty on a fresh demo —
// real actions (new job assigned, schedule confirmed, repair ticket, job
// closed, etc.) are prepended live above these from the shared store.
const EARLIER = [
  { icon: <IconCheckCircle size={16} />, title: "ปิดงานเรียบร้อย", detail: "J-2607-030 — อบต. คลองสาม ได้รับการยืนยันปิดงานแล้ว", time: "2 ก.ค.", unread: false },
  { icon: <IconAlertTriangle size={16} />, title: "แจ้งเตือนงานใกล้ถึงกำหนด", detail: "J-2607-045 — เทศบาลตำบลบางแก้ว นัดหมาย 5 ก.ค. 2569", time: "1 ก.ค.", unread: false },
  { icon: <IconFileText size={16} />, title: "ลูกค้าเซ็นอนุมัติใบเสนอราคา", detail: "J-2607-036 — บจก. เกรทวอลล์ โลจิสติกส์", time: "30 มิ.ย.", unread: false },
];

function NotifItem({ icon, title, detail, time, unread }) {
  return (
    <div className="cnotif-item">
      <div className="cnotif-icon">
        {icon}
        {unread && <span className="dot" />}
      </div>
      <div className="cnotif-body">
        <div className="cnotif-top">
          <span className="cnotif-title">{title}</span>
          <span className="cnotif-time">{time}</span>
        </div>
        <div className="cnotif-detail">{detail}</div>
      </div>
    </div>
  );
}

export default function ContractorNotificationsPage() {
  const { notifications, markAllNotificationsRead } = useNotifications();
  const live = notifications.filter((n) => n.audience === "all" || n.audience === "contractor");

  useEffect(() => {
    markAllNotificationsRead("contractor");
    // Only needs to run once, when the page is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.9rem" }}>การแจ้งเตือน</h2>

      <div className="ds-card">
        <div className="ds-card-content">
          {live.length > 0 && (
            <>
              <div className="cnotif-section-label">วันนี้</div>
              {live.map((n) => (
                <NotifItem key={n.id} icon={<IconBell size={16} />} title={n.title} detail={n.detail} time={formatRelativeTH(n.time)} unread={n.unread} />
              ))}
            </>
          )}

          <div className="cnotif-section-label">ก่อนหน้านี้</div>
          {EARLIER.map((n, i) => <NotifItem key={i} {...n} />)}
        </div>
      </div>
    </div>
  );
}
