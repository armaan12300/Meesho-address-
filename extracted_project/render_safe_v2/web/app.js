(() => {
  "use strict";
  const REQUIRED = ["name", "number", "pincode", "address", "city", "state"];
  const ALIASES = {
    full_name:"name", phone:"number", mobile:"number", mobile_number:"number",
    postal_code:"pincode", zip:"pincode", zipcode:"pincode", street:"address",
    address_line:"address"
  };
  const FORBIDDEN = ["password","passwd","secret","token","cookie","session",
    "authorization","auth_header","otp","api_key","apikey","private_key","credential","login"];
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "address-manager.records.v1";
  function loadSavedRecords() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(r => r && typeof r === "object" && !Array.isArray(r)) : [];
    } catch {
      return [];
    }
  }
  let records = loadSavedRecords();
  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch {
      status("Records are shown, but browser storage is unavailable or full. Export a backup.", true);
      return false;
    }
  }
  const fileInput = $("fileInput");

  function normalize(record) {
    const out = {};
    Object.entries(record).forEach(([key, value]) => {
      let k = key.trim().toLowerCase().replace(/[ -]/g, "_");
      k = ALIASES[k] || k;
      out[k] = value == null ? "" : value;
    });
    return out;
  }
  function parse(text) {
    let raw;
    try { raw = JSON.parse(text); } catch (e) { throw new Error("Invalid JSON: " + e.message); }
    if (!Array.isArray(raw)) raw = raw && Array.isArray(raw.addresses) ? raw.addresses : [raw];
    if (!raw.length) throw new Error("No records found in the JSON file.");
    if (raw.length > 500) throw new Error("Maximum 500 records per import.");
    return raw.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new Error(`Record ${index + 1} must be an object.`);
      const bad = Object.keys(item).filter(k => FORBIDDEN.some(part => k.toLowerCase().replaceAll("-", "_").includes(part)));
      if (bad.length) throw new Error(`Record ${index + 1} has credential-like field(s): ${bad.join(", ")}. Remove them and retry.`);
      return normalize(item);
    });
  }
  function validate(r) {
    const issues = [];
    REQUIRED.forEach(k => { if (r[k] == null || !String(r[k]).trim()) issues.push("Missing " + k); });
    const phone = String(r.number ?? "").trim();
    if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) issues.push("Check phone-number format");
    const pin = String(r.pincode ?? "").trim();
    if (pin && !/^[0-9]{6}$/.test(pin)) issues.push("Pincode must be 6 digits");
    REQUIRED.forEach(k => { if (typeof r[k] === "string" && r[k].length > 300) issues.push(k + " is too long"); });
    return issues;
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render() {
    $("workspace").classList.toggle("hidden", records.length === 0);
    $("count").textContent = records.length;
    const valid = records.filter(r => validate(r).length === 0).length;
    $("summary").replaceChildren(
      el("span", "pill", `${records.length} total`),
      el("span", "pill good", `${valid} valid`),
      el("span", "pill warn", `${records.length - valid} need review`)
    );
    const q = $("searchInput").value.trim().toLowerCase();
    const filter = $("filterSelect").value;
    const root = $("records");
    root.replaceChildren();
    let shown = 0;
    records.forEach((r, i) => {
      const issues = validate(r);
      const haystack = Object.values(r).map(String).join(" ").toLowerCase();
      if (q && !haystack.includes(q)) return;
      if (filter === "valid" && issues.length) return;
      if (filter === "issues" && !issues.length) return;
      shown++;
      const card = el("article", "record");
      const top = el("div", "record-top");
      const left = el("div");
      left.append(el("h3", "", `${i + 1}. ${String(r.name || "Unnamed record")}`));
      left.append(el("div", "meta", `Phone: ${String(r.number || "—")}`));
      const badge = el("span", "badge " + (issues.length ? "warn" : "good"), issues.length ? "Needs review" : "Looks valid");
      top.append(left, badge);
      card.append(top);
      card.append(el("p", "address", `${String(r.address || "—")}\n${String(r.city || "")}${r.city && r.state ? ", " : ""}${String(r.state || "")} ${String(r.pincode || "")}`.trim()));
      if (issues.length) card.append(el("div", "issues", "⚠ " + issues.join(" · ")));
      root.append(card);
    });
    if (!shown) root.append(el("p", "status", "No records match this filter."));
  }
  function status(message, error = false) {
    $("status").textContent = message;
    $("status").classList.toggle("error", error);
  }
  function download(filename, content, type) {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function csvEscape(value) {
    const s = value == null ? "" : String(value);
    return /[",\r\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
  }
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > 1_000_000) { status("File too large. Maximum size is 1 MB.", true); fileInput.value = ""; return; }
    if (!file.name.toLowerCase().endsWith(".json")) { status("Choose a .json file.", true); fileInput.value = ""; return; }
    try {
      const imported = parse(await file.text());
      records = imported;
      const saved = saveRecords();
      render();
      status(saved
        ? `Imported ${records.length} record(s) from ${file.name}. Saved in this browser.`
        : `Imported ${records.length} record(s) from ${file.name}, but they were not saved. Export a backup.`, !saved);
    } catch (e) { status(e.message || "Import failed.", true); }
    fileInput.value = "";
  });
  $("searchInput").addEventListener("input", render);
  $("filterSelect").addEventListener("change", render);
  $("clearBtn").addEventListener("click", () => {
    records = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    render();
    status("Records cleared from this browser.");
  });
  $("templateBtn").addEventListener("click", () => {
    const template = [{name:"",number:"",pincode:"",address:"",city:"",state:""}];
    download("address-template.json", JSON.stringify(template, null, 2), "application/json;charset=utf-8");
  });
  $("jsonBtn").addEventListener("click", () => {
    if (records.length) download("addresses.json", JSON.stringify(records, null, 2), "application/json;charset=utf-8");
  });
  $("csvBtn").addEventListener("click", () => {
    if (!records.length) return;
    const fields = [...new Set(records.flatMap(r => Object.keys(r)))];
    const csv = [fields, ...records.map(r => fields.map(k => r[k] ?? ""))]
      .map(row => row.map(csvEscape).join(",")).join("\r\n");
    download("addresses.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
  });
  if (records.length) {
    render();
    status(`Restored ${records.length} record(s) from this browser's local storage.`);
  }
})();
