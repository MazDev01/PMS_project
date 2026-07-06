"use client";

import { useState, useEffect } from "react";
import Modal from "@/app/components/Modal";
import FileDropzone from "@/app/components/FileDropzone";
import ThaiAddressFields from "@/app/components/ThaiAddressFields";
import {
  IconPlus, IconRefresh, IconCheckCircle,
} from "@/app/components/icons";
import {
  jobTypeToSpecialties, specialtyShort, crewCoverage, personConflict, TODAY_ISO,
} from "@/app/lib/mockData";
import { EMPTY_ADDRESS } from "@/app/lib/thaiAddress";
import { useJobs, useCustomers, useTeams, usePersonnel, useJobTypes, useStore } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";

export default function JobFormModal({ open, onClose, editingJob }) {
  const [jobList, setJobList] = useJobs();
  const [customerList, setCustomerList] = useCustomers();
  const [jobTypes] = useJobTypes();
  const [teams] = useTeams();
  const [personnel] = usePersonnel();
  const { addAuditLog, addNotification } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";

  const [selectedCustomerId, setSelectedCustomerId] = useState(customerList[0]?.id);
  const [jobTypeId, setJobTypeId] = useState(jobTypes[0]?.id);
  const [leadId, setLeadId] = useState(""); // 1 lead responsible for this job — must hold the หัวหน้าช่าง designation
  const [memberIds, setMemberIds] = useState([]); // any number of general technicians working with the lead
  const [personSearch, setPersonSearch] = useState("");
  const [scheduledDate, setScheduledDate] = useState(TODAY_ISO);
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("16:00");
  const [siteAddress, setSiteAddress] = useState(EMPTY_ADDRESS);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustomerAddress, setNewCustomerAddress] = useState(EMPTY_ADDRESS);

  // A job type can require MORE than one specialty by nature — e.g.
  // fire-protection work always needs an electrical technician too (the
  // alarm/suppression wiring is an electrical job) — so this is a checklist
  // the picked crew has to satisfy between them, not a single value.
  const requiredSpecs = jobTypeToSpecialties(jobTypes.find((jt) => jt.id === jobTypeId)?.name || "");
  const crewIds = [leadId, ...memberIds].filter(Boolean);
  const crewCov = crewCoverage(crewIds, personnel);
  const uncoveredSpecs = requiredSpecs.filter((s) => !crewCov.includes(s));

  const personTeamName = (p) => teams.find((t) => t.id === p.teamId)?.name || "ยังไม่มีทีม";
  const personConflictFor = (p) => personConflict(p.id, scheduledDate, startTime, endTime, jobList, editingJob?.id);

  function selectLead(id) {
    setLeadId(id);
    setMemberIds((prev) => prev.filter((x) => x !== id));
  }
  function toggleMember(id) {
    if (id === leadId) return;
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Auto-fill: for every required specialty the current crew doesn't cover
  // yet, add the first person with that skill (preferring someone free at the
  // chosen date/time) — keeps existing picks intact and only fills gaps, so
  // nudging the job type doesn't wipe out a coordinator's manual choices. The
  // lead slot only ever gets filled by someone who holds the หัวหน้าช่าง
  // designation (p.lead) — auto-fill will never promote an ordinary
  // technician into lead just because they cover a gap; it adds them as a
  // member instead and leaves the lead slot for the coordinator to fill.
  function autoFillCrew(specs, curLead, curMembers) {
    let lead = curLead;
    let members = [...curMembers];
    const pickFree = (list) =>
      list.find((p) => !personConflict(p.id, scheduledDate, startTime, endTime, jobList, editingJob?.id)) || list[0];
    specs.forEach((spec) => {
      if (crewCoverage([lead, ...members].filter(Boolean), personnel).includes(spec)) return;
      const excluded = [lead, ...members].filter(Boolean);
      const candidates = personnel.filter((p) => p.specialty === spec && !excluded.includes(p.id));
      if (!lead) {
        const leadCandidate = pickFree(candidates.filter((p) => p.lead));
        if (leadCandidate) { lead = leadCandidate.id; return; }
      }
      const memberCandidate = pickFree(candidates.filter((p) => !p.lead)) || pickFree(candidates);
      if (memberCandidate) members = [...members, memberCandidate.id];
    });
    return { lead, members };
  }

  function handleJobTypeChange(id) {
    // Crew is assigned in Scheduling (จัดแผนงาน), not here — so changing the
    // job type no longer auto-picks technicians.
    setJobTypeId(id);
  }

  // Match required specs first, then available (not conflicting) people, then
  // alphabetical — so the most relevant, free technicians surface at the top.
  function personRank(p) {
    const matched = requiredSpecs.includes(p.specialty) ? 0 : 1;
    const busy = personConflictFor(p) ? 1 : 0;
    return matched * 2 + busy;
  }
  const q = personSearch.trim().toLowerCase();
  const pickablePersonnel = [...personnel]
    .filter((p) => !q || p.name.toLowerCase().includes(q) || personTeamName(p).toLowerCase().includes(q))
    .sort((a, b) => personRank(a) - personRank(b) || a.name.localeCompare(b.name, "th"));
  // Lead candidates and regular-technician candidates are genuinely separate
  // pools: who can be a job's หัวหน้างาน is decided by the หัวหน้าช่าง
  // designation (p.lead, managed in Master Data), not by who the coordinator
  // happens to pick — so an ordinary technician never shows up in that table.
  // Selected people float to the top of each list so the current crew is always
  // visible in the scroll box without hunting for it.
  const leadCandidates = pickablePersonnel
    .filter((p) => p.lead)
    .sort((a, b) => (b.id === leadId ? 1 : 0) - (a.id === leadId ? 1 : 0));
  const memberCandidates = pickablePersonnel
    .filter((p) => !p.lead && p.id !== leadId)
    .sort((a, b) => (memberIds.includes(b.id) ? 1 : 0) - (memberIds.includes(a.id) ? 1 : 0));

  // PREFILL / RESET — replicates the old openNewJobModal / openEditJobModal
  // logic, keyed on open/editingJob so the form is initialized every time the
  // modal is opened (fresh for a new job, prefilled for an edit).
  useEffect(() => {
    if (!open) return;
    if (editingJob) {
      setSelectedCustomerId(editingJob.customerId || customerList[0]?.id);
      setJobTypeId(jobTypes.find((jt) => jt.name === editingJob.jobType)?.id || jobTypes[0]?.id);
      setLeadId(editingJob.crew?.leadId || "");
      setMemberIds(editingJob.crew?.memberIds || []);
      setPersonSearch("");
      setSiteAddress({ ...EMPTY_ADDRESS, ...editingJob.siteAddress });
      setScheduledDate(editingJob.scheduledDate || TODAY_ISO);
      setStartTime(editingJob.startTime || "08:30");
      setEndTime(editingJob.endTime || "16:00");
    } else {
      const firstCustomer = customerList[0];
      setSelectedCustomerId(firstCustomer?.id);
      const jt = jobTypes[0];
      setJobTypeId(jt?.id);
      setSiteAddress(firstCustomer ? { ...EMPTY_ADDRESS, ...firstCustomer.address } : EMPTY_ADDRESS);
      setScheduledDate(TODAY_ISO);
      setStartTime("08:30");
      setEndTime("16:00");
      setPersonSearch("");
      // Team assignment happens later in Scheduling (จัดแผนงาน) — a brand new
      // job is opened WITHOUT a crew.
      setLeadId("");
      setMemberIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingJob]);

  // Convenience: most jobs happen at the customer's own address — copy it in
  // rather than making the coordinator re-select province/district/subdistrict.
  function copyCustomerAddress() {
    const c = customerList.find((cu) => cu.id === selectedCustomerId);
    if (c) setSiteAddress({ ...EMPTY_ADDRESS, ...c.address });
  }

  function openCustomerModal() {
    setNewCustomerAddress(EMPTY_ADDRESS);
    setCustomerModalOpen(true);
  }

  function closeCustomerModal() {
    setCustomerModalOpen(false);
  }

  function handleCreateCustomer(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    if (!name) return;
    const newCustomer = {
      id: `c-new-${Date.now()}`,
      name,
      phone: form.phone.value.trim() || "-",
      address: newCustomerAddress,
    };
    setCustomerList((prev) => [...prev, newCustomer]);
    setSelectedCustomerId(newCustomer.id);
    setSiteAddress(newCustomerAddress);
    closeCustomerModal();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const jobTypeObj = jobTypes.find((jt) => jt.id === jobTypeId);
    const finalLeadId = leadId || pickablePersonnel[0]?.id || "";
    const crew = { leadId: finalLeadId, memberIds };
    // team/teams stay as derived display fields (org team of each crew
    // member) purely so the many existing team-level reports/lists keep
    // working — `crew` is the real record of who's doing the job.
    const crewTeamIds = [...new Set([finalLeadId, ...memberIds].filter(Boolean).map((id) => personnel.find((p) => p.id === id)?.teamId).filter(Boolean))];
    const teamNames = crewTeamIds.map((tid) => teams.find((t) => t.id === tid)?.name).filter(Boolean);
    const primaryTeam = teamNames[0] || teams[0]?.name || "";
    const phone = form.phone.value.trim();
    const customerObj = customerList.find((c) => c.id === selectedCustomerId);
    const leadPerson = personnel.find((p) => p.id === finalLeadId);

    if (editingJob) {
      setJobList((prev) =>
        prev.map((j) =>
          j.id === editingJob.id
            ? {
                ...j,
                customerId: customerObj?.id || j.customerId,
                customer: customerObj?.name || j.customer,
                jobType: jobTypeObj?.name || j.jobType,
                crew,
                team: primaryTeam || j.team,
                teams: teamNames.length ? teamNames : j.teams,
                scheduledDate,
                startTime,
                endTime,
                phone: phone || j.phone,
                siteAddress,
              }
            : j
        )
      );
      addAuditLog({ actor, role: actorRole, action: "แก้ไขงาน", target: editingJob.id });
    } else {
      const nums = jobList
        .map((j) => parseInt(j.id.split("-").pop(), 10))
        .filter((n) => !Number.isNaN(n));
      const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
      const newJob = {
        id: `J-2607-${String(nextNum).padStart(3, "0")}`,
        customerId: customerObj?.id || customerList[0].id,
        customer: customerObj?.name || customerList[0].name,
        jobType: jobTypeObj?.name || jobTypes[0].name,
        status: "in_progress",
        // The job belongs to whoever opened it — so a coordinator's new job
        // immediately shows up in their own scoped list. Admin/executive
        // sessions carry a userId too (e.g. U-07), which is fine: they see
        // everything regardless.
        coordinatorId: session?.userId || null,
        // A newly opened job carries NO crew/team yet — the coordinator assigns
        // technicians later in Scheduling (จัดแผนงาน).
        crew: { leadId: "", memberIds: [] },
        team: "",
        teams: [],
        createdDate: TODAY_ISO,
        scheduledDate,
        startTime,
        endTime,
        phone,
        siteAddress,
        amount: 0,
        paymentStatus: "รอชำระ",
        quotationSigned: false,
      };
      setJobList((prev) => [newJob, ...prev]);
      addAuditLog({ actor, role: actorRole, action: "เปิดงานใหม่", target: newJob.id });
      // No contractor notification here — the team is notified later, when the
      // coordinator assigns them in Scheduling (จัดแผนงาน).
    }

    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        fullscreen
        contentMaxWidth={1120}
        title={editingJob ? `แก้ไขงาน ${editingJob.id}` : "เปิดงานใหม่"}
        description="กรอกรายละเอียดงานให้ครบถ้วนก่อนบันทึกเข้าระบบ"
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" form="job-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="job-form" onSubmit={handleSubmit}>
          <div className="form-section">
          <div className="form-section-head">
            <div>
              <div className="form-section-title">ข้อมูลลูกค้าและงาน</div>
              <div className="form-section-desc">เลือกลูกค้า ประเภทงาน และจุดปฏิบัติงาน</div>
            </div>
          </div>
          <div className="job-form-top">
            <div>
              <div className="form-group">
                <label className="ds-label">ชื่อลูกค้า</label>
                <div className="flex-row" style={{ gap: "0.5rem" }}>
                  <select
                    className="ds-select"
                    style={{ flex: 1 }}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    {customerList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-icon btn-outline"
                    title="เพิ่มลูกค้าใหม่"
                    onClick={openCustomerModal}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="ds-label">เบอร์โทร</label>
                <input className="ds-input" type="text" name="phone" defaultValue={editingJob?.phone || ""} placeholder="08X-XXX-XXXX" />
              </div>
              <div className="form-group">
                <label className="ds-label">ประเภทงาน</label>
                <select className="ds-select" value={jobTypeId} onChange={(e) => handleJobTypeChange(e.target.value)}>
                  {jobTypes.map((jt) => (
                    <option key={jt.id} value={jt.id}>{jt.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="flex-between">
                <label className="ds-label">ที่อยู่หน้างาน (จุดปฏิบัติงาน)</label>
                <button type="button" className="btn btn-sm btn-outline flex-row" onClick={copyCustomerAddress}>
                  <IconRefresh size={13} />ใช้ที่อยู่เดียวกับลูกค้า
                </button>
              </div>
              <ThaiAddressFields value={siteAddress} onChange={setSiteAddress} />
            </div>
          </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={customerModalOpen}
        onClose={closeCustomerModal}
        title="เพิ่มลูกค้าใหม่"
        description="กรอกข้อมูลลูกค้าเพื่อใช้เลือกตอนเปิดงาน"
        maxWidth={480}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeCustomerModal}>ยกเลิก</button>
            <button type="submit" form="new-customer-form" className="btn btn-md btn-default">บันทึกลูกค้า</button>
          </>
        }
      >
        <form id="new-customer-form" onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="ds-label">ชื่อลูกค้า/หน่วยงาน</label>
            <input className="ds-input" type="text" name="name" placeholder="เช่น บจก. ตัวอย่าง จำกัด" required />
          </div>
          <div className="form-group">
            <label className="ds-label">เบอร์โทรติดต่อ</label>
            <input className="ds-input" type="text" name="phone" placeholder="02-XXX-XXXX" />
          </div>
          <ThaiAddressFields value={newCustomerAddress} onChange={setNewCustomerAddress} />
        </form>
      </Modal>
    </>
  );
}

// A single clickable crew candidate row — replaces the old radio/checkbox
// controls with a whole-row toggle. Selected state is shown by a tinted
// background + colored left border and a check icon; unselected rows show a
// muted "เลือก" affordance.
function CrewPickRow({ selected, onClick, name, isMatch, matchLabel, teamName, phone, conflict }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.6rem",
        width: "100%",
        minHeight: 48,
        textAlign: "left",
        padding: "0.45rem 0.6rem",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        border: "1px solid var(--border)",
        borderLeft: selected ? "3px solid var(--primary)" : "3px solid transparent",
        borderRadius: 8,
        background: selected ? "oklch(0.55 0.18 240 / 0.08)" : "var(--card)",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span
            style={{ fontWeight: selected ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}
          >
            {name}
          </span>
          {isMatch && <span className="badge badge-success" style={{ fontSize: "0.58rem", flexShrink: 0 }}>✓ {matchLabel}</span>}
        </div>
        <div className="text-xs text-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {teamName} · {phone}
          {conflict && <span style={{ color: "oklch(0.6 0.16 30)" }}> · ชนกับ {conflict.id}</span>}
        </div>
      </div>
      <div className="flex-row" style={{ gap: "0.4rem", flexShrink: 0 }}>
        <span className={`badge ${conflict ? "badge-destructive" : "badge-success"}`} style={{ fontSize: "0.6rem" }}>
          {conflict ? "ไม่ว่าง" : "ว่าง"}
        </span>
        {selected ? (
          <IconCheckCircle size={17} style={{ color: "var(--primary)", flexShrink: 0 }} />
        ) : (
          <span className="text-xs text-muted">เลือก</span>
        )}
      </div>
    </button>
  );
}
