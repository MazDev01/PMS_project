import { IconCheck } from "./icons";

export default function Steps({ steps, currentIndex }) {
  return (
    <div className="steps">
      {steps.map((label, i) => (
        <div className={`step ${i < currentIndex ? "done" : i === currentIndex ? "current" : ""}`} key={label} style={{ flex: i === steps.length - 1 ? "0 0 auto" : "1" }}>
          <div className="step-circle">{i < currentIndex ? <IconCheck size={14} /> : i + 1}</div>
          <span className="step-label">{label}</span>
          {i < steps.length - 1 && <div className={`step-line ${i < currentIndex ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
