"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const navItems = [
  { id: "konsep", label: "Konsep", number: "01" },
  { id: "blender", label: "Blender", number: "02" },
  { id: "model", label: "Model Monas", number: "03" },
  { id: "print", label: "Siap Print", number: "04" },
  { id: "slicing", label: "Slicing", number: "05" },
  { id: "demo", label: "Demo", number: "06" },
];

const primitives = [
  { name: "Cube", role: "Pondasi", shape: "cube" },
  { name: "Cylinder", role: "Menara", shape: "cylinder" },
  { name: "Cone", role: "Transisi", shape: "cone" },
  { name: "Sphere", role: "Api", shape: "sphere" },
];

const shortcuts = [
  { key: "G", label: "Grab / Move", note: "Geser objek pada sumbu" },
  { key: "R", label: "Rotate", note: "Putar objek" },
  { key: "S", label: "Scale", note: "Ubah ukuran" },
  { key: "E", label: "Extrude", note: "Tarik face menjadi volume baru" },
  { key: "⇧ A", label: "Add", note: "Tambah primitive baru" },
  { key: "Tab", label: "Edit / Object", note: "Ganti mode kerja" },
  { key: "↶", label: "Undo", note: "Ctrl + Z untuk kembali" },
];

const modelSteps = [
  { title: "Siapkan satu Cube", minute: "15–18", text: "Tambahkan Cube, skalakan menjadi alas lebar dan tipis, lalu masuk Edit Mode. Seluruh Monas akan tumbuh dari mesh ini.", tip: "S → Z → 0.3 • Tab" },
  { title: "Extrude podium", minute: "18–22", text: "Pilih face paling atas. Tekan E lalu Z untuk menariknya ke atas. Tekan S untuk mengecilkan, lalu ulangi untuk level berikutnya.", tip: "E → Z • S → 0.78" },
  { title: "Extrude menara", minute: "22–29", text: "Dari face atas podium, extrude sedikit lalu perkecil. Extrude jauh ke atas untuk membentuk badan menara yang ramping.", tip: "E → Z • S → 0.35" },
  { title: "Extrude cawan", minute: "29–33", text: "Di puncak menara, extrude pendek. Skalakan keluar untuk membuat cawan, extrude lagi, lalu skalakan kembali ke dalam.", tip: "E → Z • S → 1.8" },
  { title: "Extrude lidah api", minute: "33–38", text: "Extrude beberapa segmen pendek ke atas. Setiap segmen diperkecil dan sedikit digeser agar puncaknya menyerupai lidah api sederhana.", tip: "E → Z • S • G" },
  { title: "Periksa satu mesh", minute: "38–40", text: "Orbit 360°. Pastikan tidak ada face ganda, celah, atau bentuk terlalu tipis. Karena dibuat dengan extrude, seluruh Monas tetap menyatu.", tip: "Tab • Orbit 360°" },
];

const printChecks = [
  { id: "flat", label: "Dasar rata", detail: "Menempel stabil pada build plate" },
  { id: "thick", label: "Cukup tebal", detail: "Bagian kecil tidak rapuh" },
  { id: "joined", label: "Semua menyatu", detail: "Tidak ada bagian melayang" },
  { id: "scale", label: "Skala masuk akal", detail: "Ukuran terbaca dalam milimeter" },
];

function MonasObject({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`monas-object${compact ? " compact" : ""}`} aria-hidden="true">
      <div className="monas-flame" />
      <div className="monas-crown" />
      <div className="monas-tower" />
      <div className="monas-deck" />
      <div className="monas-base mid" />
      <div className="monas-base wide" />
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("top");
  const [dimension, setDimension] = useState<"2d" | "3d">("3d");
  const [axis, setAxis] = useState("z");
  const [activeTool, setActiveTool] = useState("G");
  const [modelStep, setModelStep] = useState(0);
  const [checks, setChecks] = useState<Record<string, boolean>>({ flat: true, thick: true, joined: false, scale: false });
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [infill, setInfill] = useState(15);
  const [supports, setSupports] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-25% 0px -60%", threshold: [0, 0.2, 0.5] }
    );
    document.querySelectorAll("section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setTimer((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const activeIndex = Math.max(0, navItems.findIndex((item) => item.id === activeSection));
  const checkedCount = Object.values(checks).filter(Boolean).length;
  const estimate = useMemo(() => {
    const minutes = Math.round(24 * (0.2 / layerHeight) * (1 + infill / 120) + (supports ? 8 : 0));
    const grams = Math.round(7 * (1 + infill / 100) + (supports ? 2 : 0));
    return { minutes, grams };
  }, [layerHeight, infill, supports]);

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <main>
      <div className="progress-rail" aria-hidden="true">
        <span style={{ width: `${((activeIndex + 1) / navItems.length) * 100}%` }} />
      </div>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kembali ke awal">
          <span className="brand-mark">3D</span>
          <span>MONAS LAB</span>
        </a>
        <nav aria-label="Navigasi materi workshop">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? "active" : ""}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="top-actions">
          <span className="duration">60 MENIT</span>
          <button className="icon-button" onClick={toggleFullscreen} aria-label="Buka mode layar penuh" title="Layar penuh">⛶</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">WORKSHOP • BEGINNER FRIENDLY</p>
          <h1>DARI LANDMARK<br />JADI <em>3D.</em></h1>
          <p className="hero-lede">
            Amati bentuknya. Bangun di Blender. Siapkan di Bambu Studio.
            Lalu cetak miniatur Monas yang bisa kamu pegang.
          </p>
          <a className="start-button" href="#konsep">
            Mulai workshop <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="hero-visual" aria-label="Ilustrasi miniatur Monas dalam ruang tiga dimensi">
          <div className="axis-badge x">X</div>
          <div className="axis-badge y">Y</div>
          <div className="axis-badge z">Z</div>
          <MonasObject />
          <span className="visual-note note-one">COMPLEX OBJECT</span>
          <span className="visual-note note-two">SIMPLE SHAPES</span>
        </div>

        <div className="hero-stats">
          <span><strong>01</strong> Observe</span>
          <span><strong>02</strong> Model</span>
          <span><strong>03</strong> Create</span>
        </div>
      </section>

      <section className="runway" aria-labelledby="rundown-title">
        <div>
          <p className="section-kicker dark">RUNDOWN / 60 MENIT</p>
          <h2 id="rundown-title">Satu jam.<br />Satu objek nyata.</h2>
        </div>
        <ol className="timeline">
          {[
            ["00–10", "See it", "3D, primitive, XYZ"],
            ["10–15", "Control it", "Blender survival kit"],
            ["15–40", "Build it", "Model miniatur Monas"],
            ["40–55", "Prepare it", "STL + Bambu Studio"],
            ["55–60", "Make it", "Demo dan refleksi"],
          ].map(([time, title, detail]) => (
            <li key={time}>
              <span className="timeline-time">{time}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="lesson concept" id="konsep">
        <div className="section-head">
          <div>
            <p className="section-kicker">01 / SEE IT • 00–10 MENIT</p>
            <h2>Dunia punya<br /><span>tiga dimensi.</span></h2>
          </div>
          <p className="section-intro">2D punya panjang dan lebar. Tambahkan tinggi—sumbu Z—dan kita mulai membentuk benda yang bisa diputar, dilihat, dan akhirnya dicetak.</p>
        </div>

        <div className="dimension-lab">
          <div className={`dimension-stage ${dimension === "2d" ? "two-d" : "three-d"}`}>
            <div className="grid-floor" />
            {dimension === "2d" ? (
              <div className="flat-shape"><span>Y</span><b>X</b></div>
            ) : (
              <div className="css-cube"><i className="front" /><i className="back" /><i className="right" /><i className="left" /><i className="top" /><i className="bottom" /></div>
            )}
            <span className="stage-caption">{dimension === "2d" ? "X + Y = bidang" : "X + Y + Z = volume"}</span>
          </div>
          <div className="lab-copy">
            <p className="micro-label">COBA SENDIRI</p>
            <h3>Tambah satu sumbu.<br />Ubah cara melihat.</h3>
            <div className="segmented" aria-label="Pilih dimensi">
              <button onClick={() => setDimension("2d")} className={dimension === "2d" ? "selected" : ""} aria-pressed={dimension === "2d"}>2D</button>
              <button onClick={() => setDimension("3d")} className={dimension === "3d" ? "selected" : ""} aria-pressed={dimension === "3d"}>3D</button>
            </div>
            <p><strong>Ingat:</strong> X = kiri/kanan, Y = depan/belakang, Z = atas/bawah.</p>
          </div>
        </div>

        <div className="primitive-block">
          <div className="block-title">
            <p className="micro-label">DECOMPOSITION CHALLENGE</p>
            <h3>Monas tersusun dari apa?</h3>
            <p>Klik setiap bentuk untuk melihat perannya. Objek kompleks hanyalah susunan bentuk sederhana.</p>
          </div>
          <div className="primitive-grid">
            {primitives.map((primitive) => (
              <button className="primitive-card" key={primitive.name} onClick={() => setAxis(primitive.shape)}>
                <span className={`primitive-shape ${primitive.shape}`} />
                <span><strong>{primitive.name}</strong><small>{primitive.role}</small></span>
                <b aria-hidden="true">↗</b>
              </button>
            ))}
          </div>
        </div>

        <div className="axis-lab">
          <div>
            <p className="micro-label">XYZ LAB</p>
            <h3>Satu objek.<br />Tiga arah.</h3>
            <div className="axis-controls">
              {["x", "y", "z"].map((item) => <button key={item} onClick={() => setAxis(item)} className={axis === item ? `axis-${item} selected` : `axis-${item}`} aria-pressed={axis === item}>{item.toUpperCase()}</button>)}
            </div>
          </div>
          <div className={`axis-demo move-${axis}`}>
            <div className="axis-lines"><i className="line-x" /><i className="line-y" /><i className="line-z" /></div>
            <div className="axis-token">OBJ</div>
          </div>
          <p className="axis-explain">{axis === "x" ? "X menggeser objek ke kiri dan kanan." : axis === "y" ? "Y menggeser objek ke depan dan belakang." : axis === "z" ? "Z mengangkat dan menurunkan objek." : "Bentuk ini membantu membangun Monas."}</p>
        </div>
      </section>

      <section className="lesson blender" id="blender">
        <div className="section-head light-head">
          <div>
            <p className="section-kicker">02 / CONTROL IT • 10–15 MENIT</p>
            <h2>Blender<br /><span>survival kit.</span></h2>
          </div>
          <p className="section-intro">Kita tidak perlu menguasai semuanya. Tujuh perintah ini cukup—dan <strong>E untuk Extrude</strong> menjadi alat utama untuk menumbuhkan Monas dari satu Cube.</p>
        </div>

        <div className="shortcut-lab">
          <div className={`viewport tool-${activeTool.replace(" ", "-").replace("⇧", "shift").replace("↶", "undo")}`}>
            <div className="viewport-bar"><span /><span /><span /><b>MONAS_01.BLEND</b></div>
            <div className="viewport-grid" />
            <div className="viewport-object"><MonasObject compact /></div>
            {activeTool === "⇧ A" && <div className="add-menu"><b>Add</b><span>Mesh</span><span>Cube</span><span>Cylinder</span></div>}
            {activeTool === "E" && <div className="extrude-overlay"><span>SELECT TOP FACE</span><i /><b>E + Z</b></div>}
            <div className="tool-readout"><span>ACTIVE TOOL</span><strong>{activeTool === "↶" ? "CTRL + Z" : activeTool}</strong></div>
          </div>

          <div className="shortcut-list" role="list" aria-label="Daftar shortcut Blender">
            {shortcuts.map((shortcut) => (
              <button key={shortcut.key} className={activeTool === shortcut.key ? "active" : ""} onClick={() => setActiveTool(shortcut.key)}>
                <kbd>{shortcut.key}</kbd>
                <span><strong>{shortcut.label}</strong><small>{shortcut.note}</small></span>
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </div>

        <div className="quick-challenge">
          <span className="challenge-number">02:00</span>
          <div><p className="micro-label">MINI CHALLENGE</p><h3>Extrude. Tinggikan. Skalakan.</h3><p>Pilih face atas Cube. Tekan E, kunci dengan Z, tarik ke atas, lalu tekan S untuk mengecilkan.</p></div>
          <button onClick={() => setActiveTool("E")}>Coba Extrude <span>→</span></button>
        </div>
      </section>

      <section className="lesson modeling" id="model">
        <div className="section-head">
          <div>
            <p className="section-kicker">03 / BUILD IT • 15–40 MENIT</p>
            <h2>Tarik Monas<br /><span>dari satu Cube.</span></h2>
          </div>
          <p className="section-intro">Pilih face paling atas, lalu ulangi ritme <strong>Extrude → Z → Scale</strong>. Hasilnya satu mesh yang rapi, menyatu, dan lebih mudah dicetak.</p>
        </div>

        <div className="model-builder">
          <div className="build-window">
            <div className="build-label"><span>EXTRUSION VIEW • SINGLE MESH</span><b>STEP {String(modelStep + 1).padStart(2, "0")}</b></div>
            <div className={`build-object extrude-mode step-${modelStep}`}>
              <div className={`build-part flame ${modelStep >= 4 ? "built" : ""} ${modelStep === 4 ? "current-face" : ""}`} />
              <div className={`build-part crown ${modelStep >= 3 ? "built" : ""} ${modelStep === 3 ? "current-face" : ""}`} />
              <div className={`build-part tower ${modelStep >= 2 ? "built" : ""} ${modelStep === 2 ? "current-face" : ""}`} />
              <div className={`build-part deck ${modelStep >= 1 ? "built" : ""} ${modelStep === 1 ? "current-face" : ""}`} />
              <div className={`build-part base-two built ${modelStep === 1 ? "current-face" : ""}`} />
              <div className={`build-part base-one built ${modelStep === 0 ? "current-face" : ""}`} />
            </div>
            <div className="extrude-trace"><span>SELECTED FACE</span><i /><b>E + Z</b></div>
            <div className="build-ground" />
            <div className="orbit-hint">↻ DRAG TO ORBIT</div>
          </div>

          <div className="step-panel">
            <div className="step-meta"><span>{modelSteps[modelStep].minute} MENIT</span><b>{modelStep + 1} / {modelSteps.length}</b></div>
            <h3>{modelSteps[modelStep].title}</h3>
            <p>{modelSteps[modelStep].text}</p>
            <div className="shortcut-tip"><span>SHORTCUT</span><kbd>{modelSteps[modelStep].tip}</kbd></div>
            <div className="step-nav">
              <button onClick={() => setModelStep((value) => Math.max(0, value - 1))} disabled={modelStep === 0} aria-label="Langkah sebelumnya">←</button>
              <div>{modelSteps.map((step, index) => <button key={step.title} onClick={() => setModelStep(index)} className={index === modelStep ? "active" : ""} aria-label={`Buka langkah ${index + 1}`} />)}</div>
              <button onClick={() => setModelStep((value) => Math.min(modelSteps.length - 1, value + 1))} disabled={modelStep === modelSteps.length - 1} aria-label="Langkah berikutnya">→</button>
            </div>
          </div>
        </div>

        <div className="extrude-recipe" aria-label="Urutan dasar extrude">
          <div><span>01</span><kbd>3</kbd><strong>Face Select</strong><small>Pilih face paling atas</small></div>
          <b aria-hidden="true">→</b>
          <div><span>02</span><kbd>E</kbd><strong>Extrude</strong><small>Buat geometri baru</small></div>
          <b aria-hidden="true">→</b>
          <div><span>03</span><kbd>Z</kbd><strong>Lock Axis</strong><small>Tarik lurus ke atas</small></div>
          <b aria-hidden="true">→</b>
          <div><span>04</span><kbd>S</kbd><strong>Scale</strong><small>Atur lebar segmen</small></div>
        </div>

        <aside className="facilitator-note"><span>CATATAN FASILITATOR</span><p>Tunjukkan satu siklus lengkap: pilih face atas → E → Z → klik → S. Setelah peserta memahami ritmenya, podium dan menara hanya pengulangan dengan tinggi serta skala berbeda.</p></aside>
      </section>

      <section className="lesson prepare" id="print">
        <div className="section-head light-head">
          <div>
            <p className="section-kicker">04 / PREPARE IT • 40–48 MENIT</p>
            <h2>Bagus di layar.<br /><span>Aman di printer.</span></h2>
          </div>
          <p className="section-intro">Model yang terlihat benar belum tentu bisa dicetak. Periksa empat hal sebelum mengekspor.</p>
        </div>

        <div className="printability-grid">
          <div className="checklist-card">
            <div className="score-ring" style={{ "--score": `${checkedCount * 25}%` } as CSSProperties}><strong>{checkedCount}/4</strong><span>READY</span></div>
            <div className="checklist">
              {printChecks.map((check) => (
                <button key={check.id} onClick={() => setChecks((state) => ({ ...state, [check.id]: !state[check.id] }))} className={checks[check.id] ? "checked" : ""} aria-pressed={checks[check.id]}>
                  <i>{checks[check.id] ? "✓" : ""}</i><span><strong>{check.label}</strong><small>{check.detail}</small></span>
                </button>
              ))}
            </div>
          </div>

          <div className="wall-demo">
            <p className="micro-label">GOLDEN RULE</p>
            <h3>Jangan terlalu tipis.</h3>
            <div className="wall-bars"><span className="fragile">0.4<small>RISK</small></span><span className="okay">1.2<small>OK</small></span><span className="strong">2.0<small>STRONG</small></span></div>
            <p>Detail tipis mudah patah atau hilang saat slicing. Untuk latihan, prioritaskan bentuk tebal dan siluet jelas.</p>
          </div>
        </div>

        <div className="export-strip">
          <div><p className="micro-label">EXPORT STL</p><h3>Tiga klik menuju Bambu Studio.</h3></div>
          <ol>
            <li><span>01</span><div><strong>Select model</strong><small>Pilih satu mesh Monas hasil extrude</small></div></li>
            <li><span>02</span><div><strong>File → Export → STL</strong><small>Aktifkan “Selection Only”</small></div></li>
            <li><span>03</span><div><strong>Save</strong><small>Nama: monas_nama.stl</small></div></li>
          </ol>
        </div>
      </section>

      <section className="lesson slicing" id="slicing">
        <div className="section-head">
          <div>
            <p className="section-kicker">05 / SLICE IT • 48–55 MENIT</p>
            <h2>Dari volume<br /><span>menjadi lapisan.</span></h2>
          </div>
          <p className="section-intro">Bambu Studio menerjemahkan model menjadi jalur gerak printer. Atur seperlunya, lalu tekan Slice Plate.</p>
        </div>

        <div className="slicer-app">
          <div className="slicer-toolbar"><b>BAMBU STUDIO</b><span>Prepare</span><span className="active">Preview</span><button>Slice plate</button></div>
          <div className="slicer-sidebar">
            <div><label htmlFor="layer">Layer height <b>{layerHeight.toFixed(2)} mm</b></label><input id="layer" type="range" min="0.12" max="0.28" step="0.04" value={layerHeight} onChange={(event) => setLayerHeight(Number(event.target.value))} /></div>
            <div><label htmlFor="infill">Sparse infill <b>{infill}%</b></label><input id="infill" type="range" min="5" max="40" step="5" value={infill} onChange={(event) => setInfill(Number(event.target.value))} /></div>
            <button className={`support-toggle ${supports ? "on" : ""}`} onClick={() => setSupports((value) => !value)} aria-pressed={supports}><span><strong>Support</strong><small>{supports ? "Enabled" : "Disabled"}</small></span><i /></button>
            <div className="recommended"><span>RECOMMENDED</span><p>0.20 mm • 15% infill • support off</p></div>
          </div>
          <div className={`slicer-preview ${supports ? "has-support" : ""}`}>
            <div className="layer-model"><MonasObject compact /></div>
            <div className="layer-lines" style={{ backgroundSize: `100% ${Math.max(3, layerHeight * 26)}px` }} />
            <div className="slice-scale"><span>42.8 mm</span></div>
          </div>
          <div className="slicer-estimate">
            <span><small>EST. TIME</small><strong>{estimate.minutes} min</strong></span>
            <span><small>FILAMENT</small><strong>{estimate.grams} g</strong></span>
            <span><small>LAYERS</small><strong>{Math.round(42.8 / layerHeight)}</strong></span>
          </div>
        </div>
        <p className="estimate-note">*Estimasi di halaman ini adalah simulasi untuk belajar. Nilai aktual mengikuti model dan profil printer di Bambu Studio.</p>
      </section>

      <section className="lesson demo" id="demo">
        <div className="section-head light-head">
          <div>
            <p className="section-kicker">06 / MAKE IT • 55–60 MENIT</p>
            <h2>Send.<br /><span>Print. Watch.</span></h2>
          </div>
          <p className="section-intro">Sebelum mengirim, pastikan plate bersih, filament cukup, dan area printer aman.</p>
        </div>

        <div className="printer-demo">
          <div className="printer-visual">
            <div className={`printer ${timerRunning ? "printing" : ""}`}>
              <div className="printer-top"><span className="printer-screen">{timerRunning ? "PRINTING" : "READY"}</span></div>
              <div className="printer-chamber"><i className="print-head" /><div className="printed-monas"><MonasObject compact /></div><div className="print-bed" /></div>
            </div>
          </div>
          <div className="demo-control">
            <p className="micro-label">LIVE DEMO CONTROL</p>
            <div className="big-timer">{formatTime(timer)}</div>
            <div className="timer-buttons">
              <button className="primary" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? "Pause demo" : timer === 0 ? "Start demo" : "Continue"}</button>
              <button onClick={() => { setTimer(0); setTimerRunning(false); }}>Reset</button>
            </div>
            <ol className="demo-steps">
              <li><span>01</span>Confirm printer & plate</li>
              <li><span>02</span>Send file to printer</li>
              <li><span>03</span>Watch the first layer</li>
            </ol>
            <div className="safety-note"><b>!</b><p><strong>Safety first</strong>Nozzle dan build plate bisa panas. Amati tanpa menyentuh area cetak.</p></div>
          </div>
        </div>
      </section>

      <section className="closing" id="closing">
        <p className="section-kicker">CLOSING / REFLECTION</p>
        <h2>YOU JUST TURNED<br /><span>AN IDEA INTO MATTER.</span></h2>
        <div className="workflow">
          {[
            ["01", "Observe", "Pecah objek menjadi bentuk sederhana"],
            ["02", "Model", "Extrude, tarik, lalu skalakan satu mesh"],
            ["03", "Prepare", "Periksa lalu slice untuk printer"],
            ["04", "Create", "Cetak dan evaluasi hasilnya"],
          ].map(([number, title, copy], index) => (
            <div key={title}><span>{number}</span><strong>{title}</strong><p>{copy}</p>{index < 3 && <b aria-hidden="true">→</b>}</div>
          ))}
        </div>
        <div className="reflection">
          <p>Jika kamu bisa mengubah Monas menjadi bentuk sederhana…</p>
          <h3>APA YANG INGIN KAMU BUAT SELANJUTNYA?</h3>
        </div>
        <a className="back-top" href="#top">Ulangi dari awal <span>↑</span></a>
        <footer><span>MONAS LAB • BLENDER × BAMBU LAB</span><span>BUILD SMALL. THINK IN 3D.</span></footer>
      </section>

      <nav className="mobile-nav" aria-label="Navigasi cepat seluler">
        {navItems.map((item) => <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? "active" : ""} aria-label={item.label}>{item.number}</a>)}
      </nav>
    </main>
  );
}
