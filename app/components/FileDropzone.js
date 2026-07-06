"use client";

import { useRef, useState } from "react";
import { IconUpload, IconFileText, IconX } from "./icons";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({ name, accept, multiple = false, hint }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const arr = Array.from(fileList);
    setFiles((prev) => (multiple ? [...prev, ...arr] : arr.slice(0, 1)));
  }

  function handleChange(e) {
    if (e.target.files && e.target.files.length) addFiles(e.target.files);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div
        className={`file-dropzone ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <div className="file-dropzone-icon">
          <IconUpload size={17} />
        </div>
        <div>
          <div className="file-dropzone-text">
            <strong>คลิกเพื่อเลือกไฟล์</strong> หรือลากไฟล์มาวางที่นี่
          </div>
          {hint && <div className="file-dropzone-hint">{hint}</div>}
        </div>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>
      {files.length > 0 && (
        <div className="file-chip-row">
          {files.map((f, i) => (
            <div className="file-chip" key={`${f.name}-${i}`}>
              <IconFileText size={12} />
              <span className="file-chip-name">{f.name}</span>
              <span className="file-chip-size">{formatSize(f.size)}</span>
              <button
                type="button"
                className="file-chip-remove"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                aria-label="ลบไฟล์"
              >
                <IconX size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
