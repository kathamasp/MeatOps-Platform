import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// DATABASE LAYER (localStorage — swap to SQL later)
// ============================================================
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(`erp_${key}`)) || null; } catch { return null; }
  },
  set(key, val) { localStorage.setItem(`erp_${key}`, JSON.stringify(val)); },
  getAll(prefix) {
    const r = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(`erp_${prefix}_`)) {
        try { r.push(JSON.parse(localStorage.getItem(k))); } catch {}
      }
    }
    return r;
  },
  delete(key) { localStorage.removeItem(`erp_${key}`); },
  nextId(prefix) {
    const all = DB.getAll(prefix);
    if (!all.length) return `${prefix.charAt(0).toUpperCase()}001`;
    const nums = all.map(a => parseInt(String(a.id).replace(/\D/g, "")) || 0);
    const next = Math.max(...nums) + 1;
    return `${prefix.charAt(0).toUpperCase()}${String(next).padStart(3, "0")}`;
  }
};

// ============================================================
// SEED DATA
// ============================================================
const SEED = () => {
  if (DB.get("seeded_v3")) return;
  // Clear old seeds
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("erp_")) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // --- Users ---
  const users = [
    { id: "U001", username: "admin", name: "ผู้ดูแลระบบ", role: "Admin", dept: "IT", status: "active", email: "admin@erp.com" },
    { id: "U002", username: "somchai", name: "สมชาย รักงาน", role: "Manager", dept: "ผลิต", status: "active", email: "somchai@erp.com" },
    { id: "U003", username: "somying", name: "สมหญิง ใจดี", role: "QC Staff", dept: "QC", status: "active", email: "somying@erp.com" },
    { id: "U004", username: "somsak", name: "สมศักดิ์ มั่นคง", role: "Supervisor", dept: "QC", status: "active", email: "somsak@erp.com" },
    { id: "U005", username: "somsri", name: "สมศรี สุขใจ", role: "Staff", dept: "คลัง", status: "active", email: "somsri@erp.com" },
  ];
  users.forEach(u => DB.set(`users_${u.id}`, u));

  // --- Organization ---
  const orgs = [
    { id: "O001", name: "บริษัท โรงเชือดไก่ไทย จำกัด", type: "บริษัท", parent: "-", manager: "ผู้บริหาร", employees: 120 },
    { id: "O002", name: "ฝ่ายผลิต", type: "ฝ่าย", parent: "O001", manager: "สมชาย", employees: 45 },
    { id: "O003", name: "ฝ่ายควบคุมคุณภาพ", type: "ฝ่าย", parent: "O001", manager: "สมศักดิ์", employees: 15 },
    { id: "O004", name: "ฝ่ายคลังสินค้า", type: "ฝ่าย", parent: "O001", manager: "สมศรี", employees: 12 },
    { id: "O005", name: "ฝ่ายขนส่ง", type: "ฝ่าย", parent: "O001", manager: "สมพร", employees: 10 },
    { id: "O006", name: "ฝ่ายวิศวกรรม", type: "ฝ่าย", parent: "O001", manager: "สมใจ", employees: 8 },
    { id: "O007", name: "ฝ่ายบัญชีและการเงิน", type: "ฝ่าย", parent: "O001", manager: "สมบัติ", employees: 6 },
    { id: "O008", name: "ฝ่าย HR", type: "ฝ่าย", parent: "O001", manager: "สมหวัง", employees: 5 },
  ];
  orgs.forEach(o => DB.set(`orgs_${o.id}`, o));

  // --- Purchase Config ---
  const purchaseConfig = [
    { id: "PC001", name: "วงเงินอนุมัติ PR", value: "50,000 บาท", category: "PR", status: "active" },
    { id: "PC002", name: "วงเงินอนุมัติ PO", value: "200,000 บาท", category: "PO", status: "active" },
    { id: "PC003", name: "ระยะเวลาชำระเงิน", value: "30 วัน", category: "Payment", status: "active" },
    { id: "PC004", name: "จำนวนใบเสนอราคาขั้นต่ำ", value: "3 ราย", category: "Quotation", status: "active" },
  ];
  purchaseConfig.forEach(p => DB.set(`purchaseconfig_${p.id}`, p));

  // --- Sales Config ---
  const salesConfig = [
    { id: "SC001", name: "วงเงินเครดิต Default", value: "100,000 บาท", category: "Credit", status: "active" },
    { id: "SC002", name: "ส่วนลดสูงสุด", value: "15%", category: "Discount", status: "active" },
    { id: "SC003", name: "ระยะเวลาเครดิต", value: "30 วัน", category: "Credit", status: "active" },
  ];
  salesConfig.forEach(s => DB.set(`salesconfig_${s.id}`, s));

  // --- QC Config ---
  const qcConfig = [
    { id: "QCC001", name: "อุณหภูมิน้ำลวกมาตรฐาน", value: "58-62°C", category: "ผลิต", status: "active" },
    { id: "QCC002", name: "อุณหภูมิแช่เย็นมาตรฐาน", value: "0-4°C", category: "ผลิต", status: "active" },
    { id: "QCC003", name: "ค่าแบคทีเรียสูงสุด", value: "500 CFU/g", category: "จุลชีวะ", status: "active" },
    { id: "QCC004", name: "ค่าคลอรีนน้ำล้าง", value: "20-50 ppm", category: "สุขาภิบาล", status: "active" },
    { id: "QCC005", name: "อุณหภูมิห้องเย็น", value: "-18°C", category: "คลัง", status: "active" },
  ];
  qcConfig.forEach(q => DB.set(`qcconfig_${q.id}`, q));

  // --- Germ Config ---
  const germConfig = [
    { id: "GC001", name: "Salmonella Test", method: "PCR", frequency: "ทุก Batch", standard: "ต้องไม่พบ", status: "active" },
    { id: "GC002", name: "E.coli Count", method: "Plate Count", frequency: "ทุก Batch", standard: "<100 CFU/g", status: "active" },
    { id: "GC003", name: "Total Plate Count", method: "Plate Count", frequency: "ทุก Batch", standard: "<500,000 CFU/g", status: "active" },
    { id: "GC004", name: "Listeria monocytogenes", method: "PCR", frequency: "สัปดาห์ละ 1 ครั้ง", standard: "ต้องไม่พบ", status: "active" },
  ];
  germConfig.forEach(g => DB.set(`germconfig_${g.id}`, g));

  // --- Categories ---
  const categories = [
    { id: "CAT001", name: "ไก่สด", group: "สินค้า", desc: "ผลิตภัณฑ์ไก่สดทุกชนิด", status: "active" },
    { id: "CAT002", name: "ชิ้นส่วน", group: "สินค้า", desc: "ชิ้นส่วนไก่ตัดแต่ง", status: "active" },
    { id: "CAT003", name: "เครื่องใน", group: "สินค้า", desc: "เครื่องในไก่", status: "active" },
    { id: "CAT004", name: "ผลพลอยได้", group: "สินค้า", desc: "หนัง กระดูก ขน", status: "active" },
    { id: "CAT005", name: "วัตถุดิบหลัก", group: "วัตถุดิบ", desc: "ไก่มีชีวิต", status: "active" },
    { id: "CAT006", name: "เคมีภัณฑ์", group: "วัตถุดิบ", desc: "น้ำยาทำความสะอาด คลอรีน", status: "active" },
    { id: "CAT007", name: "บรรจุภัณฑ์", group: "วัตถุดิบ", desc: "ถุง ถาด กล่อง", status: "active" },
  ];
  categories.forEach(c => DB.set(`categories_${c.id}`, c));

  // --- Currency ---
  const currencies = [
    { id: "CUR001", code: "THB", name: "บาทไทย", symbol: "฿", rate: 1, isDefault: "ใช่" },
    { id: "CUR002", code: "USD", name: "ดอลลาร์สหรัฐ", symbol: "$", rate: 34.5, isDefault: "ไม่" },
    { id: "CUR003", code: "JPY", name: "เยนญี่ปุ่น", symbol: "¥", rate: 0.23, isDefault: "ไม่" },
  ];
  currencies.forEach(c => DB.set(`currencies_${c.id}`, c));

  // --- ISO ---
  const isos = [
    { id: "ISO001", name: "ISO 9001:2015", scope: "ระบบบริหารคุณภาพ", certDate: "2567-01-15", expDate: "2570-01-14", body: "Bureau Veritas", status: "active" },
    { id: "ISO002", name: "ISO 22000:2018", scope: "ระบบจัดการความปลอดภัยอาหาร", certDate: "2567-03-01", expDate: "2570-02-28", body: "SGS", status: "active" },
    { id: "ISO003", name: "GMP/HACCP", scope: "หลักเกณฑ์วิธีการผลิตที่ดี", certDate: "2567-06-01", expDate: "2569-05-31", body: "อย.", status: "active" },
    { id: "ISO004", name: "Halal Certification", scope: "การรับรองฮาลาล", certDate: "2568-01-01", expDate: "2569-12-31", body: "สกอท.", status: "active" },
  ];
  isos.forEach(i => DB.set(`isos_${i.id}`, i));

  // --- Customers ---
  const customers = [
    { id: "C001", name: "บริษัท เทสโก้ โลตัส จำกัด", contact: "คุณสมชาย", phone: "02-123-4567", address: "กรุงเทพฯ", type: "ห้างค้าปลีก", credit: 500000 },
    { id: "C002", name: "บริษัท ซีพี ออลล์ จำกัด", contact: "คุณวิภา", phone: "02-234-5678", address: "กรุงเทพฯ", type: "ร้านสะดวกซื้อ", credit: 300000 },
    { id: "C003", name: "ร้านอาหารครัวคุณแม่", contact: "คุณแม่นิด", phone: "081-234-5678", address: "เชียงใหม่", type: "ร้านอาหาร", credit: 50000 },
    { id: "C004", name: "โรงแรมแกรนด์ พาเลซ", contact: "คุณพิมพ์", phone: "02-345-6789", address: "กรุงเทพฯ", type: "โรงแรม", credit: 200000 },
    { id: "C005", name: "บริษัท แม็คโคร จำกัด", contact: "คุณอนุชา", phone: "02-456-7890", address: "นนทบุรี", type: "ค้าส่ง", credit: 800000 },
  ];
  customers.forEach(c => DB.set(`customers_${c.id}`, c));

  // --- Suppliers ---
  const suppliers = [
    { id: "S001", name: "ฟาร์มไก่สมบูรณ์", contact: "คุณสมบูรณ์", phone: "089-111-2222", address: "นครปฐม", type: "ฟาร์มไก่", paymentTerm: "30 วัน" },
    { id: "S002", name: "ฟาร์มไก่ทองคำ", contact: "คุณทอง", phone: "089-222-3333", address: "ราชบุรี", type: "ฟาร์มไก่", paymentTerm: "30 วัน" },
    { id: "S003", name: "ฟาร์มไก่เจริญชัย", contact: "คุณชัย", phone: "089-333-4444", address: "กาญจนบุรี", type: "ฟาร์มไก่", paymentTerm: "15 วัน" },
    { id: "S004", name: "บจก. เคมีภัณฑ์สะอาด", contact: "คุณสะอาด", phone: "02-567-8901", address: "สมุทรปราการ", type: "เคมีภัณฑ์", paymentTerm: "45 วัน" },
    { id: "S005", name: "บจก. บรรจุภัณฑ์ไทย", contact: "คุณไทย", phone: "02-678-9012", address: "ปทุมธานี", type: "บรรจุภัณฑ์", paymentTerm: "30 วัน" },
  ];
  suppliers.forEach(s => DB.set(`suppliers_${s.id}`, s));

  // --- Farms ---
  const farms = [
    { id: "F001", name: "ฟาร์มสมบูรณ์ สาขา 1", location: "นครปฐม", capacity: 50000, currentStock: 42000, supplier: "S001", status: "active" },
    { id: "F002", name: "ฟาร์มสมบูรณ์ สาขา 2", location: "ราชบุรี", capacity: 30000, currentStock: 25000, supplier: "S001", status: "active" },
    { id: "F003", name: "ฟาร์มทองคำ", location: "ราชบุรี", capacity: 40000, currentStock: 35000, supplier: "S002", status: "active" },
    { id: "F004", name: "ฟาร์มเจริญชัย", location: "กาญจนบุรี", capacity: 35000, currentStock: 0, supplier: "S003", status: "maintenance" },
  ];
  farms.forEach(f => DB.set(`farms_${f.id}`, f));

  // --- Materials ---
  const materials = [
    { id: "M001", name: "ไก่มีชีวิต", unit: "ตัว", stock: 24567, minStock: 5000, price: 46, category: "วัตถุดิบหลัก", location: "ลานรับ" },
    { id: "M002", name: "น้ำยาฆ่าเชื้อ", unit: "ลิตร", stock: 500, minStock: 100, price: 85, category: "เคมีภัณฑ์", location: "WH-C" },
    { id: "M003", name: "ถุงบรรจุ 1 กก.", unit: "ใบ", stock: 50000, minStock: 10000, price: 1.5, category: "บรรจุภัณฑ์", location: "WH-P" },
    { id: "M004", name: "ถาดโฟม", unit: "ใบ", stock: 30000, minStock: 5000, price: 2, category: "บรรจุภัณฑ์", location: "WH-P" },
    { id: "M005", name: "น้ำแข็ง", unit: "กก.", stock: 2000, minStock: 500, price: 5, category: "วัตถุดิบ", location: "COLD" },
    { id: "M006", name: "คลอรีน", unit: "กก.", stock: 200, minStock: 50, price: 120, category: "เคมีภัณฑ์", location: "WH-C" },
    { id: "M007", name: "สติ๊กเกอร์ฉลาก", unit: "ม้วน", stock: 150, minStock: 30, price: 250, category: "บรรจุภัณฑ์", location: "WH-P" },
    { id: "M008", name: "กล่องลูกฟูก", unit: "ใบ", stock: 5000, minStock: 1000, price: 12, category: "บรรจุภัณฑ์", location: "WH-P" },
  ];
  materials.forEach(m => DB.set(`materials_${m.id}`, m));

  // --- Products ---
  const products = [
    { id: "P001", name: "ไก่ทั้งตัว", unit: "ตัว", price: 120, cost: 85, stock: 850, category: "ไก่สด", shelfLife: "5 วัน" },
    { id: "P002", name: "อกไก่", unit: "กก.", price: 95, cost: 65, stock: 320, category: "ชิ้นส่วน", shelfLife: "5 วัน" },
    { id: "P003", name: "น่องไก่", unit: "กก.", price: 85, cost: 58, stock: 280, category: "ชิ้นส่วน", shelfLife: "5 วัน" },
    { id: "P004", name: "ปีกไก่", unit: "กก.", price: 70, cost: 48, stock: 200, category: "ชิ้นส่วน", shelfLife: "5 วัน" },
    { id: "P005", name: "เครื่องในไก่", unit: "กก.", price: 45, cost: 20, stock: 150, category: "เครื่องใน", shelfLife: "3 วัน" },
    { id: "P006", name: "ขาไก่", unit: "กก.", price: 55, cost: 35, stock: 180, category: "ชิ้นส่วน", shelfLife: "5 วัน" },
    { id: "P007", name: "หนังไก่", unit: "กก.", price: 30, cost: 10, stock: 100, category: "ผลพลอยได้", shelfLife: "3 วัน" },
  ];
  products.forEach(p => DB.set(`products_${p.id}`, p));

  // --- Office Equipment ---
  const officeEquip = [
    { id: "OE001", name: "คอมพิวเตอร์ตั้งโต๊ะ", qty: 10, location: "สำนักงาน", status: "active", purchaseDate: "2567-01-15" },
    { id: "OE002", name: "เครื่องพิมพ์ Brother", qty: 3, location: "สำนักงาน", status: "active", purchaseDate: "2567-03-01" },
    { id: "OE003", name: "เครื่องสแกนบาร์โค้ด", qty: 8, location: "คลัง/ผลิต", status: "active", purchaseDate: "2567-06-01" },
    { id: "OE004", name: "Tablet 10 นิ้ว", qty: 5, location: "QC/ผลิต", status: "active", purchaseDate: "2568-01-10" },
  ];
  officeEquip.forEach(e => DB.set(`officeequip_${e.id}`, e));

  // --- Machines ---
  const machines = [
    { id: "EQ001", name: "เครื่องถอนขน A", location: "LINE E", status: "running", lastMaint: "2568-07-15", nextMaint: "2568-09-15", power: "15 kW" },
    { id: "EQ002", name: "เครื่องถอนขน B", location: "LINE C", status: "running", lastMaint: "2568-07-20", nextMaint: "2568-09-20", power: "15 kW" },
    { id: "EQ003", name: "เครื่องลวก", location: "LINE E", status: "running", lastMaint: "2568-08-01", nextMaint: "2568-10-01", power: "25 kW" },
    { id: "EQ004", name: "สายพานลำเลียง 1", location: "LINE E", status: "maintenance", lastMaint: "2568-08-10", nextMaint: "2568-08-15", power: "5 kW" },
    { id: "EQ005", name: "ห้องแช่เย็น 1", location: "COLD", status: "running", lastMaint: "2568-07-25", nextMaint: "2568-10-25", power: "30 kW" },
    { id: "EQ006", name: "เครื่องแพ็ค VP-1", location: "PACK", status: "running", lastMaint: "2568-08-05", nextMaint: "2568-11-05", power: "8 kW" },
    { id: "EQ007", name: "เครื่อง Stunning", location: "LINE E", status: "running", lastMaint: "2568-08-01", nextMaint: "2568-10-01", power: "3 kW" },
    { id: "EQ008", name: "เครื่องตัดแต่ง", location: "LINE C", status: "running", lastMaint: "2568-07-28", nextMaint: "2568-09-28", power: "5 kW" },
  ];
  machines.forEach(m => DB.set(`machines_${m.id}`, m));

  // --- Germ Analysis ---
  const germRecords = [
    { id: "GA001", batchId: "B001", testName: "Salmonella", method: "PCR", date: "2568-08-11", result: "ไม่พบ", standard: "ต้องไม่พบ", status: "ผ่าน", analyst: "สมหญิง" },
    { id: "GA002", batchId: "B001", testName: "E.coli", method: "Plate Count", date: "2568-08-11", result: "45 CFU/g", standard: "<100 CFU/g", status: "ผ่าน", analyst: "สมหญิง" },
    { id: "GA003", batchId: "B003", testName: "TPC", method: "Plate Count", date: "2568-08-10", result: "120,000 CFU/g", standard: "<500,000 CFU/g", status: "ผ่าน", analyst: "สมศักดิ์" },
    { id: "GA004", batchId: "B002", testName: "Salmonella", method: "PCR", date: "2568-08-11", result: "ไม่พบ", standard: "ต้องไม่พบ", status: "ผ่าน", analyst: "สมหญิง" },
    { id: "GA005", batchId: "B004", testName: "Listeria", method: "PCR", date: "2568-08-10", result: "ไม่พบ", standard: "ต้องไม่พบ", status: "ผ่าน", analyst: "สมศักดิ์" },
  ];
  germRecords.forEach(g => DB.set(`germ_${g.id}`, g));

  // --- Receiving ---
  const receivings = [
    { id: "RV001", date: "2568-08-11", poId: "PO001", supplierId: "S001", farmId: "F001", chickenCount: 5000, avgWeight: 2.5, totalWeight: 12500, temp: 28, healthCheck: "ผ่าน", receiver: "สมปอง", status: "completed" },
    { id: "RV002", date: "2568-08-11", poId: "PO002", supplierId: "S002", farmId: "F003", chickenCount: 3000, avgWeight: 2.4, totalWeight: 7200, temp: 27, healthCheck: "ผ่าน", receiver: "สมปอง", status: "completed" },
    { id: "RV003", date: "2568-08-12", poId: "PO003", supplierId: "S003", farmId: "F003", chickenCount: 4500, avgWeight: 2.5, totalWeight: 11250, temp: 29, healthCheck: "รอตรวจ", receiver: "สมชาย", status: "pending" },
  ];
  receivings.forEach(r => DB.set(`receiving_${r.id}`, r));

  // --- PRs ---
  const prs = [
    { id: "PR001", date: "2568-08-08", requestBy: "สมศรี", dept: "คลัง", item: "ถุงบรรจุ 1 กก.", qty: 20000, estimatedCost: 30000, reason: "สต็อกใกล้หมด", approver: "สมชาย", status: "approved" },
    { id: "PR002", date: "2568-08-09", requestBy: "สมใจ", dept: "วิศวกรรม", item: "อะไหล่สายพาน", qty: 2, estimatedCost: 15000, reason: "สายพานขาด", approver: "สมชาย", status: "approved" },
    { id: "PR003", date: "2568-08-11", requestBy: "สมศรี", dept: "คลัง", item: "คลอรีน", qty: 100, estimatedCost: 12000, reason: "เติมสต็อก", approver: "-", status: "pending" },
    { id: "PR004", date: "2568-08-11", requestBy: "สมหญิง", dept: "QC", item: "ชุดทดสอบ Salmonella", qty: 50, estimatedCost: 25000, reason: "ใช้ประจำเดือน", approver: "-", status: "pending" },
  ];
  prs.forEach(p => DB.set(`pr_${p.id}`, p));

  // --- POs ---
  const pos = [
    { id: "PO001", date: "2568-08-09", supplierId: "S001", supplierName: "ฟาร์มไก่สมบูรณ์", item: "ไก่มีชีวิต 5,000 ตัว", total: 225000, prRef: "PR-", status: "received" },
    { id: "PO002", date: "2568-08-10", supplierId: "S002", supplierName: "ฟาร์มไก่ทองคำ", item: "ไก่มีชีวิต 3,000 ตัว", total: 141000, prRef: "PR-", status: "received" },
    { id: "PO003", date: "2568-08-11", supplierId: "S003", supplierName: "ฟาร์มไก่เจริญชัย", item: "ไก่มีชีวิต 4,500 ตัว", total: 207000, prRef: "PR-", status: "pending" },
    { id: "PO004", date: "2568-08-11", supplierId: "S005", supplierName: "บจก. บรรจุภัณฑ์ไทย", item: "ถุง+ถาด", total: 50000, prRef: "PR001", status: "approved" },
  ];
  pos.forEach(p => DB.set(`po_${p.id}`, p));

  // --- Purchase Plan ---
  const purchasePlans = [
    { id: "PP001", month: "ส.ค. 2568", item: "ไก่มีชีวิต", targetQty: "150,000 ตัว", estimatedBudget: "6,900,000", supplier: "ฟาร์มรวม 3 ราย", status: "active" },
    { id: "PP002", month: "ส.ค. 2568", item: "บรรจุภัณฑ์", targetQty: "100,000 ชิ้น", estimatedBudget: "200,000", supplier: "บจก. บรรจุภัณฑ์ไทย", status: "active" },
    { id: "PP003", month: "ก.ย. 2568", item: "ไก่มีชีวิต", targetQty: "160,000 ตัว", estimatedBudget: "7,360,000", supplier: "ฟาร์มรวม 3 ราย", status: "planning" },
    { id: "PP004", month: "ก.ย. 2568", item: "เคมีภัณฑ์", targetQty: "500 ลิตร", estimatedBudget: "85,000", supplier: "บจก. เคมีภัณฑ์สะอาด", status: "planning" },
  ];
  purchasePlans.forEach(p => DB.set(`purchaseplan_${p.id}`, p));

  // --- Sales Orders ---
  const sos = [
    { id: "SO001", date: "2568-08-10", customerId: "C001", customerName: "เทสโก้ โลตัส", item: "ไก่ทั้งตัว 200 + อกไก่ 50กก.", total: 28750, deliveryDate: "2568-08-11", status: "delivered" },
    { id: "SO002", date: "2568-08-11", customerId: "C002", customerName: "ซีพี ออลล์", item: "อกไก่ 100กก. + น่อง 80กก.", total: 16300, deliveryDate: "2568-08-12", status: "processing" },
    { id: "SO003", date: "2568-08-11", customerId: "C003", customerName: "ครัวคุณแม่", item: "ไก่ทั้งตัว 50", total: 6000, deliveryDate: "2568-08-12", status: "pending" },
    { id: "SO004", date: "2568-08-11", customerId: "C005", customerName: "แม็คโคร", item: "ปีกไก่ 150กก. + เครื่องใน 100กก.", total: 15000, deliveryDate: "2568-08-13", status: "approved" },
  ];
  sos.forEach(s => DB.set(`so_${s.id}`, s));

  // --- Production Batches ---
  const STEPS = ["รับไก่", "พักไก่", "ทำให้สลบ", "เชือด", "ลวก", "ถอนขน", "เอาเครื่องใน", "ล้าง", "แช่เย็น", "ตัดแต่ง", "แพ็ค", "เก็บ/ขนส่ง"];
  DB.set("production_steps", STEPS);

  const batches = [
    { id: "B001", date: "2568-08-11", farmId: "F001", farmName: "ฟาร์มสมบูรณ์ 1", chickenCount: 5000, weight: 12500, status: "completed", currentStep: 12, yieldRate: 92.5, line: "LINE E" },
    { id: "B002", date: "2568-08-11", farmId: "F002", farmName: "ฟาร์มสมบูรณ์ 2", chickenCount: 3000, weight: 7500, status: "in_progress", currentStep: 7, yieldRate: 0, line: "LINE C" },
    { id: "B003", date: "2568-08-10", farmId: "F003", farmName: "ฟาร์มทองคำ", chickenCount: 4500, weight: 11250, status: "completed", currentStep: 12, yieldRate: 94.1, line: "LINE E" },
    { id: "B004", date: "2568-08-10", farmId: "F001", farmName: "ฟาร์มสมบูรณ์ 1", chickenCount: 5200, weight: 13000, status: "completed", currentStep: 12, yieldRate: 91.8, line: "LINE SP" },
    { id: "B005", date: "2568-08-09", farmId: "F002", farmName: "ฟาร์มสมบูรณ์ 2", chickenCount: 2800, weight: 7000, status: "completed", currentStep: 12, yieldRate: 93.2, line: "LINE C" },
  ];
  batches.forEach(b => DB.set(`batches_${b.id}`, b));

  // Step logs for B002
  const operators = ["สมชาย", "สมหญิง", "สมศักดิ์", "สมศรี", "สมปอง", "สมพร", "สมใจ"];
  for (let i = 0; i < 7; i++) {
    DB.set(`steplog_B002_${i}`, {
      batchId: "B002", step: i, stepName: STEPS[i],
      startTime: `0${6 + Math.floor(i / 2)}:${(i % 2) * 30}0`,
      endTime: `0${6 + Math.floor((i + 1) / 2)}:${((i + 1) % 2) * 30}0`,
      operator: operators[i % operators.length],
      status: "completed", qcPass: true, temp: [28, 27, "-", "-", 60, "-", "-"][i], notes: ""
    });
  }
  // Step logs for B001 (all completed)
  for (let i = 0; i < 12; i++) {
    DB.set(`steplog_B001_${i}`, {
      batchId: "B001", step: i, stepName: STEPS[i],
      startTime: `0${5 + Math.floor(i / 3)}:${(i % 3) * 20}0`,
      endTime: `0${5 + Math.floor((i + 1) / 3)}:${((i + 1) % 3) * 20}0`,
      operator: operators[i % operators.length],
      status: "completed", qcPass: true, notes: ""
    });
  }

  // --- BOM ---
  const boms = [
    { id: "BOM001", product: "ไก่ทั้งตัว (P001)", rawMaterial: "ไก่มีชีวิต 1 ตัว", packaging: "ถุง 1 ใบ + สติ๊กเกอร์", yieldRate: "92%", laborMin: 8, status: "active" },
    { id: "BOM002", product: "อกไก่ 1 กก. (P002)", rawMaterial: "ไก่มีชีวิต 4 ตัว (ส่วนอก)", packaging: "ถาดโฟม + แรป", yieldRate: "28%", laborMin: 5, status: "active" },
    { id: "BOM003", product: "น่องไก่ 1 กก. (P003)", rawMaterial: "ไก่มีชีวิต 3 ตัว (ส่วนน่อง)", packaging: "ถาดโฟม + แรป", yieldRate: "22%", laborMin: 4, status: "active" },
    { id: "BOM004", product: "ปีกไก่ 1 กก. (P004)", rawMaterial: "ไก่มีชีวิต 5 ตัว (ส่วนปีก)", packaging: "ถุง 1 ใบ", yieldRate: "15%", laborMin: 3, status: "active" },
  ];
  boms.forEach(b => DB.set(`bom_${b.id}`, b));

  // --- Manpower ---
  const manpower = [
    { id: "MP001", line: "LINE E", shift: "เช้า (06:00-14:00)", workers: 18, supervisor: "สมชาย", date: "2568-08-11", status: "active" },
    { id: "MP002", line: "LINE E", shift: "บ่าย (14:00-22:00)", workers: 15, supervisor: "สมปอง", date: "2568-08-11", status: "active" },
    { id: "MP003", line: "LINE C", shift: "เช้า (06:00-14:00)", workers: 12, supervisor: "สมศักดิ์", date: "2568-08-11", status: "active" },
    { id: "MP004", line: "LINE SP", shift: "เช้า (06:00-14:00)", workers: 10, supervisor: "สมพร", date: "2568-08-11", status: "active" },
    { id: "MP005", line: "PACKING", shift: "เช้า (06:00-14:00)", workers: 8, supervisor: "สมศรี", date: "2568-08-11", status: "active" },
  ];
  manpower.forEach(m => DB.set(`manpower_${m.id}`, m));

  // --- Production Plan ---
  const prodPlans = [
    { id: "PLP001", date: "2568-08-12", line: "LINE E", farmId: "F001", targetQty: 5000, product: "ไก่ทั้งตัว + ชิ้นส่วน", shift: "เช้า", status: "planned" },
    { id: "PLP002", date: "2568-08-12", line: "LINE C", farmId: "F003", targetQty: 4000, product: "ชิ้นส่วนตัดแต่ง", shift: "เช้า", status: "planned" },
    { id: "PLP003", date: "2568-08-13", line: "LINE E", farmId: "F002", targetQty: 3000, product: "ไก่ทั้งตัว", shift: "เช้า", status: "planned" },
  ];
  prodPlans.forEach(p => DB.set(`prodplan_${p.id}`, p));

  // --- Production Records (หน้าลาน) ---
  const prodRecords = [
    { id: "PRD001", date: "2568-08-11", time: "06:30", farmId: "F001", truckPlate: "กก-1234", chickenCount: 5000, deadOnArrival: 12, avgWeight: 2.5, temp: 28, inspector: "สมปอง", status: "accepted" },
    { id: "PRD002", date: "2568-08-11", time: "07:45", farmId: "F003", truckPlate: "ขข-5678", chickenCount: 3000, deadOnArrival: 5, avgWeight: 2.4, temp: 27, inspector: "สมปอง", status: "accepted" },
    { id: "PRD003", date: "2568-08-12", time: "06:15", farmId: "F001", truckPlate: "กก-1234", chickenCount: 5000, deadOnArrival: 8, avgWeight: 2.5, temp: 29, inspector: "สมชาย", status: "pending" },
  ];
  prodRecords.forEach(p => DB.set(`prodrecord_${p.id}`, p));

  // --- Packing Records ---
  const packings = [
    { id: "PK001", batchId: "B001", date: "2568-08-11", product: "ไก่ทั้งตัว", qty: 800, packType: "ถุง PE", weightPerPack: "2.5 กก.", labelOk: "ใช่", operator: "สมศรี", status: "completed" },
    { id: "PK002", batchId: "B001", date: "2568-08-11", product: "อกไก่", qty: 120, packType: "ถาดโฟม+แรป", weightPerPack: "0.5 กก.", labelOk: "ใช่", operator: "สมศรี", status: "completed" },
    { id: "PK003", batchId: "B002", date: "2568-08-11", product: "น่องไก่", qty: 0, packType: "ถาดโฟม+แรป", weightPerPack: "0.5 กก.", labelOk: "-", operator: "-", status: "pending" },
  ];
  packings.forEach(p => DB.set(`packing_${p.id}`, p));

  // --- QC Records (per department) ---
  const qcRecords = [
    { id: "QC001", batchId: "B001", dept: "PC", date: "2568-08-11", inspector: "สมหญิง", checkItem: "อุณหภูมิซาก", result: "4.2°C", standard: "<7°C", status: "ผ่าน", notes: "ปกติ" },
    { id: "QC002", batchId: "B001", dept: "QC", date: "2568-08-11", inspector: "สมศักดิ์", checkItem: "แบคทีเรีย", result: "120 CFU/g", standard: "<500 CFU/g", status: "ผ่าน", notes: "ต่ำกว่าเกณฑ์" },
    { id: "QC003", batchId: "B003", dept: "QC", date: "2568-08-10", inspector: "สมศรี", checkItem: "สี กลิ่น เนื้อสัมผัส", result: "ปกติ", standard: "ตามมาตรฐาน", status: "ผ่าน", notes: "ดีมาก" },
    { id: "QC004", batchId: "B002", dept: "EN", date: "2568-08-11", inspector: "สมชาย", checkItem: "อุณหภูมิน้ำลวก", result: "60.5°C", standard: "58-62°C", status: "ผ่าน", notes: "ปกติ" },
    { id: "QC005", batchId: "B001", dept: "HR", date: "2568-08-11", inspector: "สมหวัง", checkItem: "สุขอนามัยพนักงาน", result: "ผ่าน", standard: "GMP", status: "ผ่าน", notes: "พนักงานสวมชุดครบ" },
    { id: "QC006", batchId: "B001", dept: "SHE", date: "2568-08-11", inspector: "สมใจ", checkItem: "ความปลอดภัยพื้นที่", result: "ผ่าน", standard: "ISO 45001", status: "ผ่าน", notes: "ไม่พบจุดเสี่ยง" },
    { id: "QC007", batchId: "B002", dept: "SN", date: "2568-08-11", inspector: "สมหญิง", checkItem: "ความสะอาดอุปกรณ์", result: "ผ่าน", standard: "SSOP", status: "ผ่าน", notes: "ทำความสะอาดแล้ว" },
    { id: "QC008", batchId: "B001", dept: "PROD", date: "2568-08-11", inspector: "สมชาย", checkItem: "Yield Rate", result: "92.5%", standard: ">90%", status: "ผ่าน", notes: "ได้ตามเป้า" },
  ];
  qcRecords.forEach(q => DB.set(`qc_${q.id}`, q));

  // --- Warehouse GRN (ใบเบิก) ---
  const grns = [
    { id: "GRN001", date: "2568-08-11", requestBy: "สมปอง", dept: "ผลิต", item: "น้ำยาฆ่าเชื้อ", qty: 20, unit: "ลิตร", purpose: "ทำความสะอาดไลน์", approver: "สมชาย", status: "approved" },
    { id: "GRN002", date: "2568-08-11", requestBy: "สมศรี", dept: "แพ็ค", item: "ถุงบรรจุ 1 กก.", qty: 5000, unit: "ใบ", purpose: "แพ็คสินค้า B001", approver: "สมชาย", status: "approved" },
    { id: "GRN003", date: "2568-08-11", requestBy: "สมหญิง", dept: "QC", item: "คลอรีน", qty: 10, unit: "กก.", purpose: "ตรวจน้ำล้าง", approver: "-", status: "pending" },
  ];
  grns.forEach(g => DB.set(`grn_${g.id}`, g));

  // --- Vehicles ---
  const vehicles = [
    { id: "V001", plate: "กก-1234", type: "รถห้องเย็น 6 ล้อ", capacity: "5 ตัน", driver: "สมพร", tempControl: "-18°C", status: "available" },
    { id: "V002", plate: "ขข-5678", type: "รถห้องเย็น 4 ล้อ", capacity: "2 ตัน", driver: "สมบัติ", tempControl: "-18°C", status: "in_use" },
    { id: "V003", plate: "คค-9012", type: "รถกระบะห้องเย็น", capacity: "1 ตัน", driver: "ว่าง", tempControl: "0-4°C", status: "available" },
  ];
  vehicles.forEach(v => DB.set(`vehicles_${v.id}`, v));

  // --- Shipping Areas ---
  const areas = [
    { id: "AR001", name: "กรุงเทพ เขต 1", coverage: "ปทุมวัน จตุจักร ลาดพร้าว", distance: "30 กม.", deliveryTime: "2 ชม.", vehicle: "V002", status: "active" },
    { id: "AR002", name: "กรุงเทพ เขต 2", coverage: "บางนา สมุทรปราการ", distance: "45 กม.", deliveryTime: "3 ชม.", vehicle: "V001", status: "active" },
    { id: "AR003", name: "นนทบุรี-ปทุมธานี", coverage: "เมือง ปากเกร็ด รังสิต", distance: "50 กม.", deliveryTime: "3 ชม.", vehicle: "V003", status: "active" },
    { id: "AR004", name: "เชียงใหม่", coverage: "เมือง หางดง สันทราย", distance: "700 กม.", deliveryTime: "12 ชม.", vehicle: "V001", status: "active" },
  ];
  areas.forEach(a => DB.set(`areas_${a.id}`, a));

  // --- Shipping Plans ---
  const shipPlans = [
    { id: "SP001", date: "2568-08-12", soId: "SO002", customer: "ซีพี ออลล์", area: "กรุงเทพ เขต 1", vehicle: "V002", driver: "สมบัติ", departTime: "06:00", status: "planned" },
    { id: "SP002", date: "2568-08-12", soId: "SO003", customer: "ครัวคุณแม่", area: "เชียงใหม่", vehicle: "V001", driver: "สมพร", departTime: "22:00", status: "planned" },
    { id: "SP003", date: "2568-08-13", soId: "SO004", customer: "แม็คโคร", area: "นนทบุรี-ปทุมธานี", vehicle: "V003", driver: "ว่าง", departTime: "07:00", status: "planning" },
  ];
  shipPlans.forEach(s => DB.set(`shipplan_${s.id}`, s));

  // --- Loading Records ---
  const loadings = [
    { id: "LD001", date: "2568-08-11", soId: "SO001", vehicle: "V002 (ขข-5678)", items: "ไก่ทั้งตัว 200 + อกไก่ 50กก.", totalWeight: "550 กก.", temp: "-15°C", loader: "สมปอง", checker: "สมศรี", status: "completed" },
    { id: "LD002", date: "2568-08-12", soId: "SO002", vehicle: "V002 (ขข-5678)", items: "อกไก่ 100กก. + น่องไก่ 80กก.", totalWeight: "180 กก.", temp: "-", loader: "-", checker: "-", status: "pending" },
  ];
  loadings.forEach(l => DB.set(`loading_${l.id}`, l));

  // --- Shipping Documents ---
  const shipDocs = [
    { id: "SD001", date: "2568-08-11", soId: "SO001", customer: "เทสโก้ โลตัส", vehicle: "ขข-5678", driver: "สมบัติ", items: "ไก่ทั้งตัว 200, อกไก่ 50กก.", totalValue: 28750, receivedBy: "คุณสมชาย", status: "delivered" },
    { id: "SD002", date: "2568-08-12", soId: "SO002", customer: "ซีพี ออลล์", vehicle: "ขข-5678", driver: "สมบัติ", items: "อกไก่ 100กก., น่องไก่ 80กก.", totalValue: 16300, receivedBy: "-", status: "pending" },
  ];
  shipDocs.forEach(s => DB.set(`shipdoc_${s.id}`, s));

  // --- Maintenance ---
  const maints = [
    { id: "MR001", equipId: "EQ004", equipName: "สายพานลำเลียง 1", date: "2568-08-10", type: "ซ่อมแซม", desc: "สายพานขาด ต้องเปลี่ยน", priority: "สูง", assignee: "สมใจ", cost: 15000, status: "กำลังซ่อม" },
    { id: "MR002", equipId: "EQ001", equipName: "เครื่องถอนขน A", date: "2568-08-15", type: "บำรุงรักษา", desc: "เปลี่ยนใบมีด + หล่อลื่น", priority: "ปกติ", assignee: "สมใจ", cost: 5000, status: "รอดำเนินการ" },
    { id: "MR003", equipId: "EQ003", equipName: "เครื่องลวก", date: "2568-09-01", type: "บำรุงรักษา", desc: "ตรวจเช็คประจำ 3 เดือน", priority: "ปกติ", assignee: "สมใจ", cost: 3000, status: "วางแผน" },
  ];
  maints.forEach(m => DB.set(`maint_${m.id}`, m));

  // --- Maintenance Plans ---
  const maintPlans = [
    { id: "MPL001", equipId: "EQ001", equipName: "เครื่องถอนขน A", frequency: "ทุก 2 เดือน", lastDate: "2568-07-15", nextDate: "2568-09-15", type: "PM", scope: "เปลี่ยนใบมีด หล่อลื่น ตรวจมอเตอร์", status: "active" },
    { id: "MPL002", equipId: "EQ003", equipName: "เครื่องลวก", frequency: "ทุก 3 เดือน", lastDate: "2568-08-01", nextDate: "2568-11-01", type: "PM", scope: "ตรวจฮีตเตอร์ เทอร์โม วาล์ว", status: "active" },
    { id: "MPL003", equipId: "EQ005", equipName: "ห้องแช่เย็น 1", frequency: "ทุกเดือน", lastDate: "2568-07-25", nextDate: "2568-08-25", type: "PM", scope: "ตรวจคอมเพรสเซอร์ น้ำยาแอร์ ฉนวน", status: "active" },
    { id: "MPL004", equipId: "EQ006", equipName: "เครื่องแพ็ค VP-1", frequency: "ทุก 3 เดือน", lastDate: "2568-08-05", nextDate: "2568-11-05", type: "PM", scope: "ตรวจปั๊มสุญญากาศ ซีลฮีตเตอร์", status: "active" },
  ];
  maintPlans.forEach(m => DB.set(`maintplan_${m.id}`, m));

  // --- Engineering Issues ---
  const engIssues = [
    { id: "EI001", date: "2568-08-10", location: "LINE E", equipment: "สายพานลำเลียง 1", issue: "สายพานขาดขณะทำงาน", impact: "หยุดสายผลิต 2 ชม.", rootCause: "สายพานเสื่อมสภาพ", action: "เปลี่ยนสายพานใหม่", assignee: "สมใจ", status: "resolved" },
    { id: "EI002", date: "2568-08-08", location: "COLD", equipment: "ห้องแช่เย็น 1", issue: "อุณหภูมิสูงขึ้นผิดปกติ", impact: "เสี่ยงสินค้าเสียหาย", rootCause: "น้ำยาแอร์รั่ว", action: "เติมน้ำยาและซ่อมรอยรั่ว", assignee: "สมใจ", status: "resolved" },
    { id: "EI003", date: "2568-08-11", location: "LINE C", equipment: "เครื่องถอนขน B", issue: "เสียงดังผิดปกติ", impact: "ยังทำงานได้แต่ต้องเฝ้าระวัง", rootCause: "รอตรวจ", action: "วางแผนตรวจ", assignee: "สมใจ", status: "monitoring" },
  ];
  engIssues.forEach(e => DB.set(`engissue_${e.id}`, e));

  // --- Assets ---
  const assets = [
    { id: "A001", name: "เครื่องถอนขนอัตโนมัติ", category: "เครื่องจักร", value: 1500000, depreciation: 250000, currentValue: 1250000, purchaseDate: "2566-01-15", dept: "ผลิต", status: "ใช้งาน" },
    { id: "A002", name: "ห้องเย็น Walk-in", category: "สิ่งก่อสร้าง", value: 3500000, depreciation: 350000, currentValue: 3150000, purchaseDate: "2565-06-01", dept: "คลัง", status: "ใช้งาน" },
    { id: "A003", name: "รถห้องเย็น 6 ล้อ", category: "ยานพาหนะ", value: 2800000, depreciation: 560000, currentValue: 2240000, purchaseDate: "2567-03-10", dept: "ขนส่ง", status: "ใช้งาน" },
    { id: "A004", name: "เครื่องแพ็คสุญญากาศ", category: "เครื่องจักร", value: 800000, depreciation: 160000, currentValue: 640000, purchaseDate: "2567-01-20", dept: "แพ็ค", status: "ใช้งาน" },
    { id: "A005", name: "คอมพิวเตอร์สำนักงาน x5", category: "เครื่องใช้สำนักงาน", value: 150000, depreciation: 50000, currentValue: 100000, purchaseDate: "2567-06-01", dept: "สำนักงาน", status: "ใช้งาน" },
    { id: "A006", name: "เครื่อง Stunning", category: "เครื่องจักร", value: 450000, depreciation: 90000, currentValue: 360000, purchaseDate: "2567-06-15", dept: "ผลิต", status: "ใช้งาน" },
  ];
  assets.forEach(a => DB.set(`assets_${a.id}`, a));

  // --- Asset Counts ---
  const assetCounts = [
    { id: "AC001", date: "2568-07-01", counter: "สมบัติ", totalAssets: 6, found: 6, missing: 0, damaged: 0, notes: "ครบถ้วน", status: "completed" },
    { id: "AC002", date: "2568-08-01", counter: "สมบัติ", totalAssets: 6, found: 5, missing: 0, damaged: 1, notes: "A004 ซีลเสื่อม", status: "completed" },
  ];
  assetCounts.forEach(a => DB.set(`assetcount_${a.id}`, a));

  // --- Asset Transfers ---
  const assetTransfers = [
    { id: "AT001", date: "2568-07-15", assetId: "A005", assetName: "คอมพิวเตอร์สำนักงาน 1 เครื่อง", fromDept: "สำนักงาน", toDept: "QC", reason: "QC ต้องใช้บันทึกข้อมูล", approver: "ผู้จัดการ", status: "completed" },
  ];
  assetTransfers.forEach(a => DB.set(`assettransfer_${a.id}`, a));

  // --- Asset Damage ---
  const assetDamages = [
    { id: "AD001", date: "2568-08-01", assetId: "A004", assetName: "เครื่องแพ็คสุญญากาศ", damage: "ซีลฮีตเตอร์เสื่อม", repairCost: 8000, action: "ส่งซ่อมและเปลี่ยนซีล", status: "repaired" },
  ];
  assetDamages.forEach(a => DB.set(`assetdamage_${a.id}`, a));

  // --- Asset Disposal ---
  const assetDisposals = [
    { id: "ADP001", date: "2568-06-01", assetId: "-", assetName: "เครื่องพิมพ์เก่า", originalValue: 15000, bookValue: 0, disposalMethod: "ขายซาก", disposalValue: 500, approver: "ผู้จัดการ", status: "completed" },
  ];
  assetDisposals.forEach(a => DB.set(`assetdisposal_${a.id}`, a));

  // --- Finance ---
  const finances = [
    { id: "FN001", date: "2568-08-11", type: "รายรับ", category: "ขายสินค้า", desc: "SO001 - เทสโก้ โลตัส", amount: 28750, payMethod: "โอนเงิน", ref: "SO001", status: "received" },
    { id: "FN002", date: "2568-08-10", type: "รายจ่าย", category: "ซื้อวัตถุดิบ", desc: "PO001 - ฟาร์มไก่สมบูรณ์", amount: -225000, payMethod: "เช็ค", ref: "PO001", status: "paid" },
    { id: "FN003", date: "2568-08-10", type: "รายจ่าย", category: "ซื้อวัตถุดิบ", desc: "PO002 - ฟาร์มไก่ทองคำ", amount: -141000, payMethod: "โอนเงิน", ref: "PO002", status: "paid" },
    { id: "FN004", date: "2568-08-11", type: "รายจ่าย", category: "ค่าแรง", desc: "เงินเดือนพนักงาน ส.ค.", amount: -480000, payMethod: "โอนเงิน", ref: "PAY-AUG", status: "pending" },
    { id: "FN005", date: "2568-08-11", type: "รายรับ", category: "ขายสินค้า", desc: "SO002 - ซีพี ออลล์", amount: 16300, payMethod: "เครดิต 30 วัน", ref: "SO002", status: "pending" },
  ];
  finances.forEach(f => DB.set(`finance_${f.id}`, f));

  // --- Employees ---
  const employees = [
    { id: "E001", name: "สมชาย รักงาน", dept: "ผลิต", position: "หัวหน้าสายผลิต", phone: "081-111-1111", startDate: "2563-01-15", salary: 35000, status: "active" },
    { id: "E002", name: "สมหญิง ใจดี", dept: "QC", position: "เจ้าหน้าที่ตรวจสอบ", phone: "081-222-2222", startDate: "2564-03-01", salary: 22000, status: "active" },
    { id: "E003", name: "สมศักดิ์ มั่นคง", dept: "QC", position: "หัวหน้า QC", phone: "081-333-3333", startDate: "2562-06-01", salary: 38000, status: "active" },
    { id: "E004", name: "สมศรี สุขใจ", dept: "คลัง", position: "เจ้าหน้าที่คลังสินค้า", phone: "081-444-4444", startDate: "2564-08-01", salary: 20000, status: "active" },
    { id: "E005", name: "สมปอง แข็งแรง", dept: "ผลิต", position: "พนักงานผลิต", phone: "081-555-5555", startDate: "2565-01-10", salary: 15000, status: "active" },
    { id: "E006", name: "สมพร มีสุข", dept: "ขนส่ง", position: "พนักงานขับรถ", phone: "081-666-6666", startDate: "2565-04-01", salary: 18000, status: "active" },
    { id: "E007", name: "สมใจ รักษา", dept: "วิศวกรรม", position: "ช่างซ่อมบำรุง", phone: "081-777-7777", startDate: "2563-09-01", salary: 25000, status: "active" },
    { id: "E008", name: "สมบัติ จัดการ", dept: "บัญชี", position: "พนักงานบัญชี", phone: "081-888-8888", startDate: "2564-01-15", salary: 22000, status: "active" },
    { id: "E009", name: "สมหวัง ดีใจ", dept: "HR", position: "เจ้าหน้าที่ HR", phone: "081-999-9999", startDate: "2565-06-01", salary: 20000, status: "active" },
  ];
  employees.forEach(e => DB.set(`employees_${e.id}`, e));

  // --- Leave Records ---
  const leaves = [
    { id: "LV001", empId: "E005", empName: "สมปอง แข็งแรง", type: "ลาป่วย", startDate: "2568-08-05", endDate: "2568-08-05", days: 1, reason: "ไม่สบาย", approver: "สมชาย", status: "approved" },
    { id: "LV002", empId: "E002", empName: "สมหญิง ใจดี", type: "ลาพักร้อน", startDate: "2568-08-20", endDate: "2568-08-22", days: 3, reason: "พักผ่อน", approver: "สมศักดิ์", status: "approved" },
    { id: "LV003", empId: "E007", empName: "สมใจ รักษา", type: "ลากิจ", startDate: "2568-08-15", endDate: "2568-08-15", days: 1, reason: "ธุระส่วนตัว", approver: "ผู้จัดการ", status: "pending" },
  ];
  leaves.forEach(l => DB.set(`leave_${l.id}`, l));

  // --- KPI Records ---
  const kpis = [
    { id: "KPI001", empId: "E001", empName: "สมชาย รักงาน", period: "H1/2568", score: 92, grade: "A", target: "Yield > 90%", actual: "92.5%", evaluator: "ผู้จัดการ", status: "completed" },
    { id: "KPI002", empId: "E003", empName: "สมศักดิ์ มั่นคง", period: "H1/2568", score: 88, grade: "B+", target: "QC Pass > 95%", actual: "97%", evaluator: "ผู้จัดการ", status: "completed" },
    { id: "KPI003", empId: "E004", empName: "สมศรี สุขใจ", period: "H1/2568", score: 85, grade: "B", target: "Stock Accuracy > 98%", actual: "97.5%", evaluator: "สมชาย", status: "completed" },
  ];
  kpis.forEach(k => DB.set(`kpi_${k.id}`, k));

  // --- Payroll ---
  const payrolls = [
    { id: "PAY001", month: "ส.ค. 2568", empId: "E001", empName: "สมชาย รักงาน", baseSalary: 35000, ot: 4500, bonus: 0, deduction: 1750, socialSec: 750, tax: 1200, netPay: 35800, status: "pending" },
    { id: "PAY002", month: "ส.ค. 2568", empId: "E002", empName: "สมหญิง ใจดี", baseSalary: 22000, ot: 2000, bonus: 0, deduction: 0, socialSec: 750, tax: 350, netPay: 22900, status: "pending" },
    { id: "PAY003", month: "ส.ค. 2568", empId: "E003", empName: "สมศักดิ์ มั่นคง", baseSalary: 38000, ot: 3000, bonus: 5000, deduction: 0, socialSec: 750, tax: 2500, netPay: 42750, status: "pending" },
    { id: "PAY004", month: "ก.ค. 2568", empId: "E001", empName: "สมชาย รักงาน", baseSalary: 35000, ot: 3500, bonus: 0, deduction: 0, socialSec: 750, tax: 1100, netPay: 36650, status: "paid" },
  ];
  payrolls.forEach(p => DB.set(`payroll_${p.id}`, p));

  // --- Recruitment ---
  const recruits = [
    { id: "RC001", position: "พนักงานผลิต", dept: "ผลิต", qty: 5, salary: "12,000-15,000", requirement: "อายุ 18+ สุขภาพดี", postDate: "2568-08-01", closeDate: "2568-08-31", applicants: 12, status: "open" },
    { id: "RC002", position: "เจ้าหน้าที่ QC", dept: "QC", qty: 1, salary: "18,000-22,000", requirement: "ปริญญาตรี วิทยาศาสตร์อาหาร", postDate: "2568-08-05", closeDate: "2568-09-05", applicants: 3, status: "open" },
    { id: "RC003", position: "พนักงานขับรถ", dept: "ขนส่ง", qty: 1, salary: "15,000-18,000", requirement: "ใบขับขี่ประเภท 2", postDate: "2568-07-15", closeDate: "2568-08-15", applicants: 5, status: "closed" },
  ];
  recruits.forEach(r => DB.set(`recruit_${r.id}`, r));

  DB.set("seeded_v3", true);
};

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  const icons = {
    dashboard: <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    settings: <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    database: <svg {...s}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    bug: <svg {...s}><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M3 13h3M18 13h3"/></svg>,
    truck: <svg {...s}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    cart: <svg {...s}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    clipboard: <svg {...s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
    box: <svg {...s}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    factory: <svg {...s}><path d="M2 20h20V8l-6 4V8l-6 4V4H2z"/></svg>,
    wrench: <svg {...s}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    grid: <svg {...s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    wallet: <svg {...s}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
    users: <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    report: <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    chevron: <svg {...s}><polyline points="6 9 12 15 18 9"/></svg>,
    logout: <svg {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    bell: <svg {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    user: <svg {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    menu: <svg {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    search: <svg {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    check: <svg {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ============================================================
// MENU STRUCTURE
// ============================================================
const MENU = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "setup", label: "ตั้งค่าเริ่มต้น", icon: "settings", children: [
    { key: "setup_users", label: "ผู้ใช้งานระบบ" }, { key: "setup_org", label: "โครงสร้างองค์กร" },
    { key: "setup_purchase", label: "ระบบจัดซื้อ" }, { key: "setup_sales", label: "ระบบงานขาย" },
    { key: "setup_qc", label: "ระบบตรวจสอบคุณภาพ" }, { key: "setup_germ", label: "ระบบตรวจวิเคราะห์เชื้อ" },
    { key: "setup_category", label: "ระบบจำแนกหมวดหมู่" }, { key: "setup_currency", label: "สกุลเงิน" },
    { key: "setup_iso", label: "ISO Certification" },
  ]},
  { key: "master", label: "ข้อมูลหลัก", icon: "database", children: [
    { key: "customers", label: "ลูกค้า" }, { key: "suppliers", label: "ผู้จำหน่าย" },
    { key: "farms", label: "ลูกฟาร์ม" }, { key: "materials", label: "วัตถุดิบ" },
    { key: "products", label: "สินค้า" }, { key: "office_equip", label: "เครื่องใช้สำนักงาน" },
    { key: "machines", label: "เครื่องจักร" },
  ]},
  { key: "germ", label: "ระบบตรวจวิเคราะห์เชื้อ", icon: "bug" },
  { key: "receiving", label: "ระบบรับเข้า", icon: "truck" },
  { key: "purchasing", label: "ระบบจัดซื้อ", icon: "cart", children: [
    { key: "pr", label: "ขอซื้อ (PR)" }, { key: "po", label: "จัดซื้อ (PO)" }, { key: "purchase_plan", label: "แผนจัดซื้อ" },
  ]},
  { key: "qc", label: "ระบบตรวจสอบคุณภาพ", icon: "clipboard", children: [
    { key: "qc_pc", label: "แผนก (PC)" }, { key: "qc_qc", label: "แผนก (QC)" }, { key: "qc_en", label: "แผนก (EN)" },
    { key: "qc_hr", label: "แผนก (HR)" }, { key: "qc_she", label: "แผนก (SHE)" }, { key: "qc_sn", label: "แผนก (SN)" },
    { key: "qc_prod", label: "แผนก (ผลิต)" },
  ]},
  { key: "warehouse", label: "ระบบคลังสินค้า", icon: "box", children: [
    { key: "wh_grn", label: "ยื่นใบเบิก" }, { key: "wh_raw", label: "วัตถุดิบ" }, { key: "wh_product", label: "สินค้า" },
    { key: "wh_other", label: "อื่นๆ" }, { key: "wh_raw_wh", label: "WAREHOUSE (วัตถุดิบ)" },
    { key: "wh_prod_wh", label: "WAREHOUSE (สินค้า)" }, { key: "wh_other_wh", label: "WAREHOUSE (อื่นๆ)" },
  ]},
  { key: "production", label: "ระบบงานผลิต", icon: "factory", children: [
    { key: "prod_process", label: "ขั้นตอนการผลิต" }, { key: "prod_bom", label: "BOM" },
    { key: "prod_manpower", label: "MANPOWER" }, { key: "prod_plan_chicken", label: "แผนผลิตไก่ (แปรรูป)" },
    { key: "prod_record", label: "บันทึกไก่เป็น (หน้าลาน)" }, { key: "prod_line_e", label: "ฝ่ายผลิต (LINE E)" },
    { key: "prod_line_c", label: "ฝ่ายผลิต (LINE C)" }, { key: "prod_line_sp", label: "ฝ่ายผลิต (LINE SP)" },
    { key: "prod_packing", label: "PACKING" },
  ]},
  { key: "shipping", label: "ระบบขนส่งสินค้า", icon: "truck", children: [
    { key: "ship_register", label: "ลงทะเบียนรถขนส่ง" }, { key: "ship_area", label: "กำหนดพื้นที่จัดส่ง" },
    { key: "ship_plan", label: "แผนจัดส่งสินค้า" }, { key: "ship_loading", label: "LOADING PRODUCT" },
    { key: "ship_doc", label: "ระบบใบขนส่งสินค้า" },
  ]},
  { key: "engineering", label: "ระบบงานวิศวกรรม", icon: "wrench", children: [
    { key: "eng_repair", label: "ใบแจ้งซ่อม/สร้าง" }, { key: "eng_maint", label: "แผนซ่อมบำรุงรักษา" },
    { key: "eng_issue", label: "การจัดการเหตุขัดข้อง" },
  ]},
  { key: "asset", label: "ระบบจัดการทรัพย์สิน", icon: "grid", children: [
    { key: "asset_register", label: "ทะเบียนทรัพย์สิน" }, { key: "asset_count", label: "ตรวจนับทรัพย์สิน" },
    { key: "asset_transfer", label: "โอนย้ายทรัพย์สิน" }, { key: "asset_damage", label: "ทรัพย์สินชำรุด" },
    { key: "asset_dispose", label: "ทรัพย์สินรอจำหน่าย" },
  ]},
  { key: "finance", label: "ระบบบัญชีและการเงิน", icon: "wallet" },
  { key: "hr", label: "ทรัพยากรบุคคล", icon: "users", children: [
    { key: "hr_info", label: "ระบบข้อมูลพนักงาน" }, { key: "hr_leave", label: "ระบบวันลา-วันหยุด (TM)" },
    { key: "hr_kpi", label: "ระบบประเมิน (KPI)" }, { key: "hr_payroll", label: "เงินเดือนและผลตอบแทน" },
    { key: "hr_recruit", label: "รับสมัครพนักงาน" },
  ]},
  { key: "reports", label: "ระบบรายงาน", icon: "report", children: [
    { key: "rpt_purchase", label: "ระบบจัดซื้อ" }, { key: "rpt_sales", label: "ระบบงานขาย" },
    { key: "rpt_raw_wh", label: "ระบบคลังวัตถุดิบ" }, { key: "rpt_prod_wh", label: "ระบบคลังสินค้า" },
    { key: "rpt_shipping", label: "ระบบขนส่งสินค้า" }, { key: "rpt_production", label: "ระบบการผลิต" },
    { key: "rpt_cost", label: "ต้นทุนการผลิต" }, { key: "rpt_pnl", label: "กำไร-ขาดทุน" }, { key: "rpt_kpi", label: "KPI" },
  ]},
];

// ============================================================
// STYLE CONSTANTS
// ============================================================
const C = {
  sidebar: "#0a1628", sideHover: "#132240", sideActive: "#1a3260",
  header: "#e8f0fe", body: "#f0f4fa", accent: "#2563eb",
  green: "#22c55e", blue: "#3b82f6", purple: "#a855f7",
  orange: "#f97316", cyan: "#06b6d4", red: "#ef4444",
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
const Card = ({ children, style }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", ...style }}>{children}</div>
);
const StatCard = ({ label, value, unit, color, icon }) => (
  <div style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, borderRadius: 12, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1, minWidth: 160 }}>
    <div>
      <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{unit}</div>
    </div>
    <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
  </div>
);
const Badge = ({ text, color }) => (
  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}20`, color, display: "inline-block" }}>{text}</span>
);
const Btn = ({ children, color = "#2563eb", onClick, small, outline }) => (
  <button onClick={onClick} style={{ padding: small ? "4px 12px" : "8px 16px", borderRadius: 8, border: outline ? `1px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#fff", fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 0.2s" }}>{children}</button>
);
const sColor = s => {
  const m = { completed: "#22c55e", received: "#22c55e", delivered: "#22c55e", active: "#22c55e", available: "#22c55e", running: "#22c55e", "ใช้งาน": "#22c55e", "ผ่าน": "#22c55e", accepted: "#22c55e", paid: "#22c55e", repaired: "#22c55e", resolved: "#22c55e", open: "#3b82f6", closed: "#64748b", in_progress: "#f59e0b", processing: "#f59e0b", approved: "#3b82f6", in_use: "#f59e0b", maintenance: "#ef4444", "กำลังซ่อม": "#f59e0b", pending: "#94a3b8", "รอดำเนินการ": "#94a3b8", planning: "#8b5cf6", planned: "#3b82f6", monitoring: "#f59e0b", "วางแผน": "#8b5cf6" };
  return m[s] || "#64748b";
};
const sText = s => {
  const m = { completed: "เสร็จสิ้น", received: "รับแล้ว", delivered: "จัดส่งแล้ว", in_progress: "กำลังผลิต", processing: "กำลังดำเนินการ", approved: "อนุมัติ", pending: "รอดำเนินการ", active: "ใช้งาน", available: "พร้อมใช้", in_use: "ใช้งานอยู่", running: "ทำงาน", maintenance: "ซ่อมบำรุง", planned: "วางแผนแล้ว", planning: "กำลังวางแผน", accepted: "รับแล้ว", paid: "จ่ายแล้ว", repaired: "ซ่อมแล้ว", resolved: "แก้ไขแล้ว", open: "เปิดรับ", closed: "ปิดรับ", monitoring: "เฝ้าระวัง" };
  return m[s] || s;
};

// ============================================================
// GENERIC CRUD TABLE
// ============================================================
function DataPage({ title, emoji, subtitle, prefix, fields, labels, stats, setModal }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => { setData(DB.getAll(prefix)); }, [prefix]);
  const refresh = () => setData(DB.getAll(prefix));
  const filtered = data.filter(item => fields.some(f => String(item[f] || "").toLowerCase().includes(search.toLowerCase())));

  const handleSave = (item, isNew) => {
    if (isNew && !item[fields[0]]) item[fields[0]] = DB.nextId(prefix);
    DB.set(`${prefix}_${item[fields[0]]}`, item);
    refresh();
    setModal(null);
  };
  const handleDelete = (id) => { if (confirm("ยืนยันการลบ?")) { DB.delete(`${prefix}_${id}`); refresh(); } };

  const openForm = (item = null) => {
    const isNew = !item;
    setModal({
      title: isNew ? `เพิ่ม${title}` : `แก้ไข${title}`,
      content: <FormEditor fields={fields} labels={labels} data={item || {}} onSave={d => handleSave(d, isNew)} isNew={isNew} />
    });
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>{emoji} {title}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>{subtitle || `จัดการข้อมูล${title}`}</p>
      {stats && <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>{stats(data)}</div>}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", borderRadius: 8, padding: "6px 12px" }}>
            <Icon name="search" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: "inherit", width: 180 }} />
          </div>
          <Btn onClick={() => openForm()}><Icon name="plus" size={14} /> เพิ่ม{title}</Btn>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
            <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              {labels.map(h => <th key={h} style={{ padding: "8px 6px", textAlign: "left", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}
              <th style={{ padding: "8px 6px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {fields.map(f => (
                    <td key={f} style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {f === "status" ? <Badge text={sText(item[f])} color={sColor(item[f])} /> :
                        typeof item[f] === "number" ? item[f].toLocaleString() : String(item[f] ?? "")}
                    </td>
                  ))}
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={() => openForm(item)} style={{ background: "#eff6ff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#2563eb" }}><Icon name="edit" size={14} /></button>
                      <button onClick={() => handleDelete(item[fields[0]])} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#ef4444" }}><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={fields.length + 1} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>ไม่พบข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>แสดง {filtered.length} จาก {data.length} รายการ</div>
      </Card>
    </div>
  );
}

function FormEditor({ fields, labels, data: initData, onSave, isNew }) {
  const [form, setForm] = useState(initData);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fields.map((f, i) => (
          <div key={f}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{labels[i]}</label>
            <input value={form[f] ?? ""} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} disabled={f === fields[0] && !isNew}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", background: f === fields[0] && !isNew ? "#f1f5f9" : "#fff", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn color="#22c55e" onClick={() => onSave(form)}><Icon name="check" size={14} /> บันทึก</Btn>
      </div>
    </div>
  );
}

// ============================================================
// PAGE ROUTER — ALL PAGES FUNCTIONAL
// ============================================================
function PageRouter({ page, setPage, setModal }) {
  // Helper to find label
  const findLabel = (key) => MENU.flatMap(m => [m, ...(m.children || [])]).find(c => c.key === key)?.label || key;

  // === DASHBOARD ===
  if (page === "dashboard") return <DashboardPage setPage={setPage} />;

  // === SETUP ===
  if (page === "setup_users") return <DataPage title="ผู้ใช้งานระบบ" emoji="👤" prefix="users" fields={["id","username","name","role","dept","email","status"]} labels={["รหัส","Username","ชื่อ","Role","แผนก","Email","สถานะ"]} setModal={setModal} />;
  if (page === "setup_org") return <DataPage title="โครงสร้างองค์กร" emoji="🏢" prefix="orgs" fields={["id","name","type","parent","manager","employees"]} labels={["รหัส","ชื่อหน่วยงาน","ประเภท","สังกัด","ผู้จัดการ","จำนวนพนักงาน"]} setModal={setModal} />;
  if (page === "setup_purchase") return <DataPage title="ตั้งค่าระบบจัดซื้อ" emoji="⚙️" prefix="purchaseconfig" fields={["id","name","value","category","status"]} labels={["รหัส","รายการ","ค่า","หมวด","สถานะ"]} setModal={setModal} />;
  if (page === "setup_sales") return <DataPage title="ตั้งค่าระบบงานขาย" emoji="⚙️" prefix="salesconfig" fields={["id","name","value","category","status"]} labels={["รหัส","รายการ","ค่า","หมวด","สถานะ"]} setModal={setModal} />;
  if (page === "setup_qc") return <DataPage title="ตั้งค่ามาตรฐาน QC" emoji="⚙️" prefix="qcconfig" fields={["id","name","value","category","status"]} labels={["รหัส","รายการ","ค่ามาตรฐาน","หมวด","สถานะ"]} setModal={setModal} />;
  if (page === "setup_germ") return <DataPage title="ตั้งค่าการตรวจวิเคราะห์เชื้อ" emoji="🔬" prefix="germconfig" fields={["id","name","method","frequency","standard","status"]} labels={["รหัส","ชื่อทดสอบ","วิธี","ความถี่","มาตรฐาน","สถานะ"]} setModal={setModal} />;
  if (page === "setup_category") return <DataPage title="ระบบจำแนกหมวดหมู่" emoji="🏷️" prefix="categories" fields={["id","name","group","desc","status"]} labels={["รหัส","ชื่อหมวด","กลุ่ม","คำอธิบาย","สถานะ"]} setModal={setModal} />;
  if (page === "setup_currency") return <DataPage title="สกุลเงิน" emoji="💱" prefix="currencies" fields={["id","code","name","symbol","rate","isDefault"]} labels={["รหัส","รหัสสกุลเงิน","ชื่อ","สัญลักษณ์","อัตราแลกเปลี่ยน","ค่าเริ่มต้น"]} setModal={setModal} />;
  if (page === "setup_iso") return <DataPage title="ISO Certification" emoji="📜" prefix="isos" fields={["id","name","scope","certDate","expDate","body","status"]} labels={["รหัส","มาตรฐาน","ขอบเขต","วันรับรอง","วันหมดอายุ","หน่วยรับรอง","สถานะ"]} setModal={setModal} />;

  // === MASTER DATA ===
  if (page === "customers") return <DataPage title="ลูกค้า" emoji="🤝" prefix="customers" fields={["id","name","contact","phone","address","type","credit"]} labels={["รหัส","ชื่อลูกค้า","ผู้ติดต่อ","โทร","ที่อยู่","ประเภท","วงเงินเครดิต"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="ลูกค้าทั้งหมด" value={d.length} unit="ราย" color={C.blue} icon="🤝" />, <StatCard key="c" label="วงเงินเครดิตรวม" value={`฿${(d.reduce((s,i)=>s+(+i.credit||0),0)/1e6).toFixed(1)}M`} unit="บาท" color={C.green} icon="💰" />]} />;
  if (page === "suppliers") return <DataPage title="ผู้จำหน่าย" emoji="🏭" prefix="suppliers" fields={["id","name","contact","phone","address","type","paymentTerm"]} labels={["รหัส","ชื่อผู้จำหน่าย","ผู้ติดต่อ","โทร","ที่อยู่","ประเภท","เงื่อนไขชำระ"]} setModal={setModal} />;
  if (page === "farms") return <DataPage title="ลูกฟาร์ม" emoji="🐓" prefix="farms" fields={["id","name","location","capacity","currentStock","supplier","status"]} labels={["รหัส","ชื่อฟาร์ม","จังหวัด","ความจุ","คงเหลือ","ผู้จำหน่าย","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="f" label="ฟาร์มทั้งหมด" value={d.length} unit="ฟาร์ม" color={C.blue} icon="🐓" />, <StatCard key="a" label="ฟาร์มใช้งาน" value={d.filter(f=>f.status==="active").length} unit="ฟาร์ม" color={C.green} icon="✅" />, <StatCard key="s" label="ไก่คงเหลือรวม" value={d.reduce((s,i)=>s+(+i.currentStock||0),0)} unit="ตัว" color={C.orange} icon="🐔" />]} />;
  if (page === "materials") return <DataPage title="วัตถุดิบ" emoji="📦" prefix="materials" fields={["id","name","unit","stock","minStock","price","category","location"]} labels={["รหัส","ชื่อ","หน่วย","คงเหลือ","จุดสั่งซื้อ","ราคา/หน่วย","หมวด","ตำแหน่ง"]} setModal={setModal} />;
  if (page === "products") return <DataPage title="สินค้า" emoji="🍗" prefix="products" fields={["id","name","unit","price","cost","stock","category","shelfLife"]} labels={["รหัส","ชื่อสินค้า","หน่วย","ราคาขาย","ต้นทุน","คงเหลือ","หมวด","อายุสินค้า"]} setModal={setModal} />;
  if (page === "office_equip") return <DataPage title="เครื่องใช้สำนักงาน" emoji="🖥️" prefix="officeequip" fields={["id","name","qty","location","status","purchaseDate"]} labels={["รหัส","ชื่อ","จำนวน","ตำแหน่ง","สถานะ","วันที่ซื้อ"]} setModal={setModal} />;
  if (page === "machines") return <DataPage title="เครื่องจักร" emoji="⚙️" prefix="machines" fields={["id","name","location","status","lastMaint","nextMaint","power"]} labels={["รหัส","ชื่อเครื่อง","ตำแหน่ง","สถานะ","บำรุงล่าสุด","บำรุงถัดไป","กำลังไฟ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="เครื่องจักรทั้งหมด" value={d.length} unit="เครื่อง" color={C.blue} icon="⚙️" />, <StatCard key="r" label="ทำงานอยู่" value={d.filter(e=>e.status==="running").length} unit="เครื่อง" color={C.green} icon="✅" />, <StatCard key="m" label="ซ่อมบำรุง" value={d.filter(e=>e.status==="maintenance").length} unit="เครื่อง" color={C.red} icon="🔧" />]} />;

  // === GERM ===
  if (page === "germ") return <DataPage title="ระบบตรวจวิเคราะห์เชื้อ" emoji="🔬" subtitle="ผลการตรวจวิเคราะห์จุลินทรีย์" prefix="germ" fields={["id","batchId","testName","method","date","result","standard","status","analyst"]} labels={["รหัส","Batch","ชื่อทดสอบ","วิธี","วันที่","ผลลัพธ์","มาตรฐาน","ผล","ผู้วิเคราะห์"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="ตรวจทั้งหมด" value={d.length} unit="ตัวอย่าง" color={C.blue} icon="🔬" />, <StatCard key="p" label="ผ่านเกณฑ์" value={d.filter(r=>r.status==="ผ่าน").length} unit="ตัวอย่าง" color={C.green} icon="✅" />]} />;

  // === RECEIVING ===
  if (page === "receiving") return <DataPage title="ระบบรับเข้า" emoji="🚛" subtitle="บันทึกการรับไก่เข้าโรงงาน" prefix="receiving" fields={["id","date","supplierId","farmId","chickenCount","avgWeight","totalWeight","temp","healthCheck","receiver","status"]} labels={["รหัส","วันที่","ผู้จำหน่าย","ฟาร์ม","จำนวน(ตัว)","น้ำหนักเฉลี่ย","น้ำหนักรวม","อุณหภูมิ","สุขภาพ","ผู้รับ","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="รับเข้าวันนี้" value={d.filter(r=>r.date==="2568-08-11").reduce((s,r)=>s+(+r.chickenCount||0),0)} unit="ตัว" color={C.green} icon="🐔" />, <StatCard key="w" label="น้ำหนักรวม" value={d.filter(r=>r.date==="2568-08-11").reduce((s,r)=>s+(+r.totalWeight||0),0)} unit="กก." color={C.blue} icon="⚖️" />]} />;

  // === PURCHASING ===
  if (page === "pr") return <DataPage title="ขอซื้อ (PR)" emoji="📝" prefix="pr" fields={["id","date","requestBy","dept","item","qty","estimatedCost","reason","approver","status"]} labels={["เลขที่","วันที่","ผู้ขอ","แผนก","รายการ","จำนวน","งบประมาณ","เหตุผล","ผู้อนุมัติ","สถานะ"]} setModal={setModal} />;
  if (page === "po") return <DataPage title="จัดซื้อ (PO)" emoji="🛒" prefix="po" fields={["id","date","supplierName","item","total","prRef","status"]} labels={["เลขที่","วันที่","ผู้จำหน่าย","รายการ","ยอดรวม","อ้างอิง PR","สถานะ"]} setModal={setModal} />;
  if (page === "purchase_plan") return <DataPage title="แผนจัดซื้อ" emoji="📊" prefix="purchaseplan" fields={["id","month","item","targetQty","estimatedBudget","supplier","status"]} labels={["รหัส","เดือน","รายการ","เป้าหมาย","งบประมาณ","ผู้จำหน่าย","สถานะ"]} setModal={setModal} />;

  // === QC ===
  if (page.startsWith("qc_")) {
    const deptMap = { pc: "PC", qc: "QC", en: "EN", hr: "HR", she: "SHE", sn: "SN", prod: "PROD" };
    const dept = deptMap[page.replace("qc_", "")] || "QC";
    const deptNames = { PC: "Production Control", QC: "Quality Control", EN: "Engineering", HR: "Human Resources", SHE: "Safety Health Environment", SN: "Sanitation", PROD: "ผลิต" };
    return <DataPage title={`ตรวจสอบคุณภาพ - แผนก ${dept}`} emoji="🔍" subtitle={deptNames[dept]} prefix="qc"
      fields={["id","batchId","dept","date","inspector","checkItem","result","standard","status","notes"]}
      labels={["รหัส","Batch","แผนก","วันที่","ผู้ตรวจ","รายการตรวจ","ผลลัพธ์","มาตรฐาน","ผล","หมายเหตุ"]}
      setModal={setModal}
      stats={d => { const fd = d.filter(r => r.dept === dept || dept === "PROD"); return [<StatCard key="t" label="ตรวจทั้งหมด" value={fd.length} unit="รายการ" color={C.blue} icon="🔍" />, <StatCard key="p" label="ผ่านเกณฑ์" value={fd.filter(r=>r.status==="ผ่าน").length} unit="รายการ" color={C.green} icon="✅" />]; }} />;
  }

  // === WAREHOUSE ===
  if (page === "wh_grn") return <DataPage title="ยื่นใบเบิก" emoji="📋" subtitle="คำขอเบิกวัตถุดิบ/สินค้า" prefix="grn" fields={["id","date","requestBy","dept","item","qty","unit","purpose","approver","status"]} labels={["เลขที่","วันที่","ผู้ขอ","แผนก","รายการ","จำนวน","หน่วย","วัตถุประสงค์","ผู้อนุมัติ","สถานะ"]} setModal={setModal} />;
  if (page === "wh_raw" || page === "wh_raw_wh") return <DataPage title="คลังวัตถุดิบ" emoji="📦" subtitle="สต็อกวัตถุดิบ" prefix="materials" fields={["id","name","unit","stock","minStock","price","category","location"]} labels={["รหัส","ชื่อ","หน่วย","คงเหลือ","จุดสั่งซื้อ","ราคา","หมวด","ตำแหน่ง"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="รายการ" value={d.length} unit="รายการ" color={C.blue} icon="📦" />, <StatCard key="l" label="ต่ำกว่าจุดสั่งซื้อ" value={d.filter(i=>+i.stock<+i.minStock).length} unit="รายการ" color={C.red} icon="⚠️" />, <StatCard key="v" label="มูลค่ารวม" value={`฿${d.reduce((s,i)=>s+(+i.stock||0)*(+i.price||0),0).toLocaleString()}`} unit="บาท" color={C.green} icon="💰" />]} />;
  if (page === "wh_product" || page === "wh_prod_wh") return <DataPage title="คลังสินค้า" emoji="🍗" subtitle="สต็อกสินค้าสำเร็จรูป" prefix="products" fields={["id","name","unit","price","cost","stock","category","shelfLife"]} labels={["รหัส","ชื่อ","หน่วย","ราคาขาย","ต้นทุน","คงเหลือ","หมวด","อายุ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="รายการ" value={d.length} unit="SKU" color={C.blue} icon="🍗" />, <StatCard key="v" label="มูลค่าราคาขาย" value={`฿${d.reduce((s,i)=>s+(+i.stock||0)*(+i.price||0),0).toLocaleString()}`} unit="บาท" color={C.green} icon="💰" />]} />;
  if (page === "wh_other" || page === "wh_other_wh") return <DataPage title="คลังอื่นๆ" emoji="📦" subtitle="วัสดุสิ้นเปลือง อะไหล่ อื่นๆ" prefix="officeequip" fields={["id","name","qty","location","status","purchaseDate"]} labels={["รหัส","ชื่อ","จำนวน","ตำแหน่ง","สถานะ","วันที่ซื้อ"]} setModal={setModal} />;

  // === PRODUCTION ===
  if (page === "prod_process") return <ProductionFlowPage setModal={setModal} />;
  if (page === "prod_bom") return <DataPage title="BOM - Bill of Materials" emoji="📋" subtitle="สูตรการผลิต" prefix="bom" fields={["id","product","rawMaterial","packaging","yieldRate","laborMin","status"]} labels={["รหัส","สินค้า","วัตถุดิบ","บรรจุภัณฑ์","Yield%","เวลา(นาที)","สถานะ"]} setModal={setModal} />;
  if (page === "prod_manpower") return <DataPage title="MANPOWER" emoji="👷" subtitle="กำลังคนในสายการผลิต" prefix="manpower" fields={["id","line","shift","workers","supervisor","date","status"]} labels={["รหัส","สาย","กะ","จำนวนคน","หัวหน้า","วันที่","สถานะ"]} setModal={setModal} />;
  if (page === "prod_plan_chicken") return <DataPage title="แผนผลิตไก่ (แปรรูป)" emoji="📅" subtitle="วางแผนการผลิตรายวัน" prefix="prodplan" fields={["id","date","line","farmId","targetQty","product","shift","status"]} labels={["รหัส","วันที่","สาย","ฟาร์ม","เป้า(ตัว)","สินค้า","กะ","สถานะ"]} setModal={setModal} />;
  if (page === "prod_record") return <DataPage title="บันทึกไก่เป็น (หน้าลาน)" emoji="🐔" subtitle="บันทึกรับไก่มีชีวิตที่หน้าลาน" prefix="prodrecord" fields={["id","date","time","farmId","truckPlate","chickenCount","deadOnArrival","avgWeight","temp","inspector","status"]} labels={["รหัส","วันที่","เวลา","ฟาร์ม","ทะเบียนรถ","จำนวน(ตัว)","ตายระหว่างขนส่ง","น้ำหนักเฉลี่ย","อุณหภูมิ","ผู้ตรวจ","สถานะ"]} setModal={setModal} />;
  if (page === "prod_line_e" || page === "prod_line_c" || page === "prod_line_sp") {
    const lineName = page === "prod_line_e" ? "LINE E" : page === "prod_line_c" ? "LINE C" : "LINE SP";
    return <DataPage title={`ฝ่ายผลิต (${lineName})`} emoji="🏭" subtitle={`สถานะและ Batch ใน ${lineName}`} prefix="batches"
      fields={["id","date","farmName","chickenCount","weight","line","currentStep","yieldRate","status"]}
      labels={["Batch","วันที่","ฟาร์ม","จำนวน(ตัว)","น้ำหนัก(กก.)","สาย","ขั้นตอน","Yield%","สถานะ"]}
      setModal={setModal}
      stats={d => { const ld = d.filter(b=>b.line===lineName); return [<StatCard key="t" label={`Batch ใน ${lineName}`} value={ld.length} unit="batch" color={C.blue} icon="🏭" />, <StatCard key="p" label="กำลังผลิต" value={ld.filter(b=>b.status==="in_progress").length} unit="batch" color={C.orange} icon="⚡" />, <StatCard key="c" label="เสร็จสิ้น" value={ld.filter(b=>b.status==="completed").length} unit="batch" color={C.green} icon="✅" />]; }} />;
  }
  if (page === "prod_packing") return <DataPage title="PACKING" emoji="📦" subtitle="บันทึกการบรรจุ" prefix="packing" fields={["id","batchId","date","product","qty","packType","weightPerPack","labelOk","operator","status"]} labels={["รหัส","Batch","วันที่","สินค้า","จำนวน","ประเภทบรรจุ","น้ำหนัก/แพ็ค","ฉลากถูกต้อง","ผู้ปฏิบัติ","สถานะ"]} setModal={setModal} />;

  // === SHIPPING ===
  if (page === "ship_register") return <DataPage title="ลงทะเบียนรถขนส่ง" emoji="🚛" prefix="vehicles" fields={["id","plate","type","capacity","driver","tempControl","status"]} labels={["รหัส","ทะเบียน","ประเภท","ความจุ","คนขับ","ควบคุมอุณหภูมิ","สถานะ"]} setModal={setModal} />;
  if (page === "ship_area") return <DataPage title="กำหนดพื้นที่จัดส่ง" emoji="🗺️" prefix="areas" fields={["id","name","coverage","distance","deliveryTime","vehicle","status"]} labels={["รหัส","พื้นที่","ขอบเขต","ระยะทาง","เวลาจัดส่ง","รถ","สถานะ"]} setModal={setModal} />;
  if (page === "ship_plan") return <DataPage title="แผนจัดส่งสินค้า" emoji="📅" prefix="shipplan" fields={["id","date","soId","customer","area","vehicle","driver","departTime","status"]} labels={["รหัส","วันที่","SO","ลูกค้า","พื้นที่","รถ","คนขับ","เวลาออก","สถานะ"]} setModal={setModal} />;
  if (page === "ship_loading") return <DataPage title="LOADING PRODUCT" emoji="📦" subtitle="บันทึกการขึ้นสินค้า" prefix="loading" fields={["id","date","soId","vehicle","items","totalWeight","temp","loader","checker","status"]} labels={["รหัส","วันที่","SO","รถ","รายการ","น้ำหนักรวม","อุณหภูมิ","ผู้ขึ้นสินค้า","ผู้ตรวจ","สถานะ"]} setModal={setModal} />;
  if (page === "ship_doc") return <DataPage title="ระบบใบขนส่งสินค้า" emoji="📄" prefix="shipdoc" fields={["id","date","soId","customer","vehicle","driver","items","totalValue","receivedBy","status"]} labels={["เลขที่","วันที่","SO","ลูกค้า","รถ","คนขับ","รายการ","มูลค่า","ผู้รับ","สถานะ"]} setModal={setModal} />;

  // === ENGINEERING ===
  if (page === "eng_repair") return <DataPage title="ใบแจ้งซ่อม/สร้าง" emoji="🔧" prefix="maint" fields={["id","equipName","date","type","desc","priority","assignee","cost","status"]} labels={["เลขที่","เครื่องจักร","วันที่","ประเภท","รายละเอียด","ความสำคัญ","ผู้รับผิดชอบ","ค่าใช้จ่าย","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="งานซ่อมทั้งหมด" value={d.length} unit="รายการ" color={C.blue} icon="🔧" />, <StatCard key="p" label="รอดำเนินการ" value={d.filter(m=>m.status==="รอดำเนินการ"||m.status==="วางแผน").length} unit="รายการ" color={C.orange} icon="⏳" />, <StatCard key="c" label="ค่าซ่อมรวม" value={`฿${d.reduce((s,i)=>s+(+i.cost||0),0).toLocaleString()}`} unit="บาท" color={C.red} icon="💸" />]} />;
  if (page === "eng_maint") return <DataPage title="แผนซ่อมบำรุงรักษา" emoji="📅" subtitle="Preventive Maintenance Plan" prefix="maintplan" fields={["id","equipName","frequency","lastDate","nextDate","type","scope","status"]} labels={["รหัส","เครื่องจักร","ความถี่","วันที่ล่าสุด","วันที่ถัดไป","ประเภท","ขอบเขตงาน","สถานะ"]} setModal={setModal} />;
  if (page === "eng_issue") return <DataPage title="การจัดการเหตุขัดข้อง" emoji="⚠️" subtitle="Incident Management" prefix="engissue" fields={["id","date","location","equipment","issue","impact","rootCause","action","assignee","status"]} labels={["รหัส","วันที่","ตำแหน่ง","เครื่องจักร","ปัญหา","ผลกระทบ","สาเหตุ","แนวทาง","ผู้รับผิดชอบ","สถานะ"]} setModal={setModal} />;

  // === ASSETS ===
  if (page === "asset_register") return <DataPage title="ทะเบียนทรัพย์สิน" emoji="🏢" prefix="assets" fields={["id","name","category","value","depreciation","currentValue","purchaseDate","dept","status"]} labels={["รหัส","ชื่อ","ประเภท","มูลค่าเดิม","ค่าเสื่อม","มูลค่าปัจจุบัน","วันที่ซื้อ","แผนก","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="ทรัพย์สินทั้งหมด" value={d.length} unit="รายการ" color={C.blue} icon="🏢" />, <StatCard key="v" label="มูลค่ารวม" value={`฿${(d.reduce((s,i)=>s+(+i.currentValue||0),0)/1e6).toFixed(1)}M`} unit="บาท" color={C.green} icon="💰" />]} />;
  if (page === "asset_count") return <DataPage title="ตรวจนับทรัพย์สิน" emoji="📋" prefix="assetcount" fields={["id","date","counter","totalAssets","found","missing","damaged","notes","status"]} labels={["รหัส","วันที่","ผู้ตรวจนับ","รายการทั้งหมด","พบ","สูญหาย","ชำรุด","หมายเหตุ","สถานะ"]} setModal={setModal} />;
  if (page === "asset_transfer") return <DataPage title="โอนย้ายทรัพย์สิน" emoji="🔄" prefix="assettransfer" fields={["id","date","assetId","assetName","fromDept","toDept","reason","approver","status"]} labels={["รหัส","วันที่","รหัสทรัพย์สิน","ชื่อ","แผนกเดิม","แผนกใหม่","เหตุผล","ผู้อนุมัติ","สถานะ"]} setModal={setModal} />;
  if (page === "asset_damage") return <DataPage title="ทรัพย์สินชำรุด" emoji="🔨" prefix="assetdamage" fields={["id","date","assetId","assetName","damage","repairCost","action","status"]} labels={["รหัส","วันที่","รหัสทรัพย์สิน","ชื่อ","ความเสียหาย","ค่าซ่อม","แนวทาง","สถานะ"]} setModal={setModal} />;
  if (page === "asset_dispose") return <DataPage title="ทรัพย์สินรอจำหน่าย" emoji="🗑️" prefix="assetdisposal" fields={["id","date","assetName","originalValue","bookValue","disposalMethod","disposalValue","approver","status"]} labels={["รหัส","วันที่","ชื่อ","มูลค่าเดิม","มูลค่าตามบัญชี","วิธีจำหน่าย","มูลค่าจำหน่าย","ผู้อนุมัติ","สถานะ"]} setModal={setModal} />;

  // === FINANCE ===
  if (page === "finance") return <DataPage title="ระบบบัญชีและการเงิน" emoji="💰" subtitle="บันทึกรายรับ-รายจ่าย" prefix="finance" fields={["id","date","type","category","desc","amount","payMethod","ref","status"]} labels={["รหัส","วันที่","ประเภท","หมวด","รายละเอียด","จำนวนเงิน","วิธีชำระ","อ้างอิง","สถานะ"]} setModal={setModal}
    stats={d => { const inc=d.filter(f=>f.type==="รายรับ").reduce((s,f)=>s+(+f.amount||0),0); const exp=d.filter(f=>f.type==="รายจ่าย").reduce((s,f)=>s+Math.abs(+f.amount||0),0); return [<StatCard key="i" label="รายรับ" value={`฿${inc.toLocaleString()}`} unit="บาท" color={C.green} icon="📈" />, <StatCard key="e" label="รายจ่าย" value={`฿${exp.toLocaleString()}`} unit="บาท" color={C.red} icon="📉" />, <StatCard key="n" label="คงเหลือ" value={`฿${(inc-exp).toLocaleString()}`} unit="บาท" color={C.blue} icon="💰" />]; }} />;

  // === HR ===
  if (page === "hr_info") return <DataPage title="ข้อมูลพนักงาน" emoji="👥" prefix="employees" fields={["id","name","dept","position","phone","startDate","salary","status"]} labels={["รหัส","ชื่อ-สกุล","แผนก","ตำแหน่ง","โทร","วันเริ่มงาน","เงินเดือน","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="พนักงานทั้งหมด" value={d.length} unit="คน" color={C.blue} icon="👥" />, <StatCard key="a" label="ใช้งาน" value={d.filter(e=>e.status==="active").length} unit="คน" color={C.green} icon="✅" />]} />;
  if (page === "hr_leave") return <DataPage title="ระบบวันลา-วันหยุด" emoji="📅" prefix="leave" fields={["id","empName","type","startDate","endDate","days","reason","approver","status"]} labels={["รหัส","พนักงาน","ประเภท","วันเริ่ม","วันสิ้นสุด","จำนวนวัน","เหตุผล","ผู้อนุมัติ","สถานะ"]} setModal={setModal} />;
  if (page === "hr_kpi") return <DataPage title="ระบบประเมิน KPI" emoji="📊" prefix="kpi" fields={["id","empName","period","score","grade","target","actual","evaluator","status"]} labels={["รหัส","พนักงาน","รอบ","คะแนน","เกรด","เป้าหมาย","ผลจริง","ผู้ประเมิน","สถานะ"]} setModal={setModal} />;
  if (page === "hr_payroll") return <DataPage title="เงินเดือนและผลตอบแทน" emoji="💵" prefix="payroll" fields={["id","month","empName","baseSalary","ot","bonus","deduction","socialSec","tax","netPay","status"]} labels={["รหัส","เดือน","พนักงาน","เงินเดือน","OT","โบนัส","หักอื่นๆ","ประกันสังคม","ภาษี","สุทธิ","สถานะ"]} setModal={setModal}
    stats={d => [<StatCard key="t" label="ค่าจ้างเดือนนี้" value={`฿${d.filter(p=>p.month==="ส.ค. 2568").reduce((s,p)=>s+(+p.netPay||0),0).toLocaleString()}`} unit="บาท" color={C.orange} icon="💵" />]} />;
  if (page === "hr_recruit") return <DataPage title="รับสมัครพนักงาน" emoji="📢" prefix="recruit" fields={["id","position","dept","qty","salary","requirement","postDate","closeDate","applicants","status"]} labels={["รหัส","ตำแหน่ง","แผนก","จำนวน","เงินเดือน","คุณสมบัติ","วันประกาศ","วันปิดรับ","ผู้สมัคร","สถานะ"]} setModal={setModal} />;

  // === REPORTS ===
  if (page.startsWith("rpt_")) return <ReportPage type={page} />;

  return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>หน้า {page} กำลังพัฒนา</div>;
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardPage({ setPage }) {
  const batches = DB.getAll("batches");
  const totalProd = batches.reduce((s, b) => s + (+b.chickenCount || 0), 0);
  const activeFarms = DB.getAll("farms").filter(f => f.status === "active").length;
  const shops = DB.getAll("customers").length;
  const sos = DB.getAll("so");
  const todayRevenue = sos.reduce((s, o) => s + (+o.total || 0), 0);

  const yieldData = [{ m: "ม.ค.", f: 92, r: 88, p: 85 }, { m: "ก.พ.", f: 94, r: 90, p: 87 }, { m: "มี.ค.", f: 93, r: 89, p: 86 }, { m: "เม.ย.", f: 95, r: 91, p: 88 }, { m: "พ.ค.", f: 94, r: 90, p: 87 }, { m: "มิ.ย.", f: 96, r: 92, p: 89 }];
  const costData = [{ n: "ฟาร์ม", r: 65, p: 12, o: 8, l: 15 }, { n: "โรงเชือด", r: 45, p: 18, o: 15, l: 22 }, { n: "ค้าปลีก", r: 30, p: 25, o: 20, l: 25 }];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>🐔</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e3a5f" }}>Dashboard ธุรกิจ</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>ระบบติดตามและวิเคราะห์การดำเนินงานแบบเรียลไทม์</p>
          </div>
        </div>
        <div style={{ textAlign: "right", color: "#64748b", fontSize: 13 }}>
          <div style={{ fontWeight: 600, color: "#1e3a5f" }}>{new Date().toLocaleDateString("th-TH")}</div>
          <div>{new Date().toLocaleTimeString("th-TH")}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="ผลิตรวมวันนี้" value={totalProd} unit="ตัว/กิโลกรัม" color={C.green} icon="📦" />
        <StatCard label="ฟาร์มที่ใช้งาน" value={activeFarms} unit="ฟาร์ม" color={C.blue} icon="🏠" />
        <StatCard label="สายการผลิต" value={4} unit="สาย" color={C.purple} icon="⚙️" />
        <StatCard label="ร้านค้า" value={shops} unit="สาขา" color={C.orange} icon="🏪" />
        <StatCard label="รายได้วันนี้" value={`฿${(todayRevenue / 1e6).toFixed(1)}M`} unit="บาท" color={C.cyan} icon="💰" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e3a5f" }}>✅ Yield Analysis</h3>
          <div style={{ height: 180 }}>
            <svg viewBox="0 0 500 180" style={{ width: "100%", height: "100%" }}>
              {[0, 25, 50, 75, 100].map((v, i) => <g key={i}><line x1="40" y1={160 - v * 1.4} x2="490" y2={160 - v * 1.4} stroke="#e2e8f0" strokeWidth="0.5" /><text x="35" y={164 - v * 1.4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text></g>)}
              {yieldData.map((d, i) => <text key={i} x={65 + i * 80} y="178" textAnchor="middle" fontSize="9" fill="#94a3b8">{d.m}</text>)}
              {[{ k: "f", c: "#f97316" }, { k: "r", c: "#22c55e" }, { k: "p", c: "#3b82f6" }].map(l => (
                <g key={l.k}>
                  <polyline points={yieldData.map((d, i) => `${65 + i * 80},${160 - d[l.k] * 1.4}`).join(" ")} fill="none" stroke={l.c} strokeWidth="2" />
                  {yieldData.map((d, i) => <circle key={i} cx={65 + i * 80} cy={160 - d[l.k] * 1.4} r="3" fill={l.c} />)}
                </g>
              ))}
            </svg>
          </div>
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e3a5f" }}>⚙️ Cost per Unit (Cp)</h3>
          <div style={{ height: 180, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 40, paddingBottom: 24 }}>
            {costData.map((d, i) => {
              const t = d.r + d.p + d.o + d.l;
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column-reverse", height: 120, width: 50 }}>
                    {[{ v: d.r, c: "#22c55e" }, { v: d.p, c: "#f97316" }, { v: d.o, c: "#a855f7" }, { v: d.l, c: "#ef4444" }].map((s, j) => (
                      <div key={j} style={{ height: `${(s.v / t) * 100}%`, background: s.c, borderRadius: j === 3 ? "6px 6px 0 0" : j === 0 ? "0 0 6px 6px" : 0 }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>{d.n}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#1e3a5f" }}>🏭 การผลิตล่าสุด</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>{["Batch", "วันที่", "ตัว", "กก.", "Yield%", "สถานะ"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>{batches.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "6px 4px", fontWeight: 600 }}>{b.id}</td><td style={{ padding: "6px 4px" }}>{b.date}</td>
                <td style={{ padding: "6px 4px" }}>{(+b.chickenCount).toLocaleString()}</td><td style={{ padding: "6px 4px" }}>{(+b.weight).toLocaleString()}</td>
                <td style={{ padding: "6px 4px" }}>{b.yieldRate || "-"}</td><td style={{ padding: "6px 4px" }}><Badge text={sText(b.status)} color={sColor(b.status)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#1e3a5f" }}>📋 คำสั่งขายล่าสุด</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>{["เลขที่", "วันที่", "ลูกค้า", "ยอดรวม", "สถานะ"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>{sos.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "6px 4px", fontWeight: 600 }}>{s.id}</td><td style={{ padding: "6px 4px" }}>{s.date}</td>
                <td style={{ padding: "6px 4px" }}>{s.customerName}</td><td style={{ padding: "6px 4px" }}>฿{(+s.total).toLocaleString()}</td>
                <td style={{ padding: "6px 4px" }}><Badge text={sText(s.status)} color={sColor(s.status)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCTION FLOW PAGE
// ============================================================
function ProductionFlowPage({ setModal }) {
  const STEPS = DB.get("production_steps") || [];
  const batches = DB.getAll("batches");
  const [selBatch, setSelBatch] = useState("B002");
  const batch = batches.find(b => b.id === selBatch);
  const cur = batch?.status === "completed" ? 12 : (+batch?.currentStep || 0);
  const icons = ["🐔", "🏠", "💤", "🔪", "♨️", "🪶", "🫀", "🚿", "❄️", "✂️", "📦", "🚛"];
  const colors = ["#22c55e", "#3b82f6", "#8b5cf6", "#ef4444", "#f97316", "#eab308", "#ec4899", "#06b6d4", "#0ea5e9", "#14b8a6", "#6366f1", "#84cc16"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>🏭 ขั้นตอนการผลิต - โรงเชือดไก่</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>รับไก่ → พักไก่ → ทำให้สลบ → เชือด → ลวก → ถอนขน → เอาเครื่องใน → ล้าง → แช่เย็น → ตัดแต่ง → แพ็ค → เก็บ/ขนส่ง</p>
        </div>
        <select value={selBatch} onChange={e => setSelBatch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit" }}>
          {batches.map(b => <option key={b.id} value={b.id}>Batch {b.id} - {b.date}</option>)}
        </select>
      </div>
      <Card style={{ marginBottom: 20, overflow: "auto" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Production Flow Diagram</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0", minWidth: 1100 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                onClick={() => setModal({ title: `ขั้นตอนที่ ${i + 1}: ${step}`, content: <StepDetail step={i} stepName={step} batchId={selBatch} /> })}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: i < cur ? `linear-gradient(135deg, ${colors[i]}, ${colors[i]}cc)` : i === cur ? "#fbbf24" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: i < cur ? `0 3px 10px ${colors[i]}40` : "none", border: i === cur ? "3px solid #f59e0b" : "none" }}>
                  {i < cur ? "✅" : icons[i]}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, textAlign: "center", maxWidth: 60, color: i < cur ? colors[i] : i === cur ? "#f59e0b" : "#94a3b8" }}>{step}</div>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 2, background: i < cur ? colors[i] : "#e2e8f0", marginBottom: 20 }} />}
            </div>
          ))}
        </div>
      </Card>
      {batch && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Card><div style={{ fontSize: 12, color: "#64748b" }}>Batch</div><div style={{ fontSize: 18, fontWeight: 700 }}>{batch.id}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>วันที่: {batch.date} | {batch.line}</div></Card>
          <Card><div style={{ fontSize: 12, color: "#64748b" }}>จำนวน</div><div style={{ fontSize: 18, fontWeight: 700 }}>{(+batch.chickenCount).toLocaleString()} ตัว</div><div style={{ fontSize: 12, color: "#94a3b8" }}>น้ำหนัก: {(+batch.weight).toLocaleString()} กก.</div></Card>
          <Card><div style={{ fontSize: 12, color: "#64748b" }}>ความคืบหน้า</div><Badge text={sText(batch.status)} color={sColor(batch.status)} /><div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 3, marginTop: 8 }}><div style={{ width: `${(cur / 12) * 100}%`, height: "100%", background: "#22c55e", borderRadius: 3 }} /></div><div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{Math.round((cur / 12) * 100)}%</div></Card>
        </div>
      )}
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>📋 บันทึกขั้นตอน</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>{["#", "ขั้นตอน", "เริ่ม", "สิ้นสุด", "ผู้ปฏิบัติ", "QC", "สถานะ"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: "#64748b" }}>{h}</th>)}</tr></thead>
          <tbody>{STEPS.map((step, i) => {
            const log = DB.get(`steplog_${selBatch}_${i}`);
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i === cur ? "#fffbeb" : "transparent" }}>
                <td style={{ padding: "6px 4px" }}>{icons[i]}</td><td style={{ padding: "6px 4px", fontWeight: 500 }}>{step}</td>
                <td style={{ padding: "6px 4px" }}>{log?.startTime || "-"}</td><td style={{ padding: "6px 4px" }}>{log?.endTime || "-"}</td>
                <td style={{ padding: "6px 4px" }}>{log?.operator || "-"}</td>
                <td style={{ padding: "6px 4px" }}>{log?.qcPass ? <Badge text="ผ่าน" color="#22c55e" /> : log ? <Badge text="ไม่ผ่าน" color="#ef4444" /> : "-"}</td>
                <td style={{ padding: "6px 4px" }}>{i < cur ? <Badge text="เสร็จ" color="#22c55e" /> : i === cur ? <Badge text="กำลังทำ" color="#f59e0b" /> : <Badge text="รอ" color="#94a3b8" />}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
    </div>
  );
}

function StepDetail({ step, stepName, batchId }) {
  const log = DB.get(`steplog_${batchId}_${step}`);
  const descs = ["รับไก่มีชีวิตจากฟาร์ม ตรวจนับจำนวน ชั่งน้ำหนัก ตรวจสุขภาพเบื้องต้น", "พักไก่ในคอกพัก ให้น้ำ ลดความเครียด 2-4 ชม.", "ทำให้ไก่สลบด้วยไฟฟ้า (Electrical Stunning) ตามมาตรฐาน Halal", "เชือดคอไก่ตามหลักศาสนา ปล่อยเลือดออกให้หมด", "ลวกในน้ำร้อน 58-62°C เป็นเวลา 90-120 วินาที", "ถอนขนด้วยเครื่องถอนขนอัตโนมัติ ตรวจขนเหลือด้วยมือ", "ผ่าท้อง นำเครื่องในออก แยกตับ หัวใจ กึ๋น ทำความสะอาด", "ล้างซากไก่ด้วยน้ำสะอาด ใช้คลอรีน 20-50 ppm ฆ่าเชื้อ", "แช่ในน้ำเย็น 0-4°C เป็นเวลา 45-60 นาที", "ตัดแต่งชิ้นส่วน แยกเป็น อก น่อง ปีก ขา สะโพก", "บรรจุถุง/ถาด ชั่งน้ำหนัก ติดฉลาก ตรวจวันหมดอายุ", "จัดเก็บในห้องเย็น -18°C หรือจัดส่งด้วยรถห้องเย็น"];
  const params = ["อุณหภูมิไก่, สภาพทั่วไป, ใบรับรองสุขภาพ", "ระยะเวลาพัก, อุณหภูมิคอก", "แรงดันไฟฟ้า, ระยะเวลาช็อก", "เวลาปล่อยเลือด, Halal certified", "อุณหภูมิน้ำ, ระยะเวลาลวก, pH", "ประสิทธิภาพเครื่อง, ขนที่เหลือ%", "น้ำหนักเครื่องใน, สภาพ", "ความเข้มข้นคลอรีน, อุณหภูมิน้ำ", "อุณหภูมิน้ำแช่, เวลา, อุณหภูมิซากหลังแช่", "จำนวนชิ้นส่วน, น้ำหนัก, Yield%", "น้ำหนัก/แพ็ค, จำนวน, ประเภทบรรจุ", "อุณหภูมิห้องเย็น, ทะเบียนรถ, เวลาออก"];
  return (
    <div>
      <p style={{ color: "#374151", lineHeight: 1.8 }}>{descs[step]}</p>
      <div style={{ background: "#f0f4fa", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>พารามิเตอร์:</div>
        <div style={{ fontSize: 13, color: "#374151" }}>{params[step]}</div>
      </div>
      {log && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
          <div><span style={{ color: "#64748b" }}>เริ่ม:</span> {log.startTime}</div>
          <div><span style={{ color: "#64748b" }}>สิ้นสุด:</span> {log.endTime}</div>
          <div><span style={{ color: "#64748b" }}>ผู้ปฏิบัติ:</span> {log.operator}</div>
          <div><span style={{ color: "#64748b" }}>QC:</span> {log.qcPass ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORT PAGE
// ============================================================
function ReportPage({ type }) {
  const titles = { rpt_purchase: "รายงานจัดซื้อ", rpt_sales: "รายงานงานขาย", rpt_raw_wh: "รายงานคลังวัตถุดิบ", rpt_prod_wh: "รายงานคลังสินค้า", rpt_shipping: "รายงานขนส่ง", rpt_production: "รายงานการผลิต", rpt_cost: "รายงานต้นทุน", rpt_pnl: "กำไร-ขาดทุน", rpt_kpi: "KPI" };

  const configs = {
    rpt_purchase: { prefix: "po", fields: ["id","date","supplierName","item","total","status"], labels: ["เลขที่","วันที่","ผู้จำหน่าย","รายการ","ยอดรวม","สถานะ"] },
    rpt_sales: { prefix: "so", fields: ["id","date","customerName","item","total","deliveryDate","status"], labels: ["เลขที่","วันที่","ลูกค้า","รายการ","ยอดรวม","กำหนดส่ง","สถานะ"] },
    rpt_raw_wh: { prefix: "materials", fields: ["id","name","unit","stock","minStock","price","category"], labels: ["รหัส","ชื่อ","หน่วย","คงเหลือ","จุดสั่งซื้อ","ราคา","หมวด"] },
    rpt_prod_wh: { prefix: "products", fields: ["id","name","unit","price","stock","category"], labels: ["รหัส","ชื่อ","หน่วย","ราคา","คงเหลือ","หมวด"] },
    rpt_shipping: { prefix: "shipdoc", fields: ["id","date","customer","vehicle","items","totalValue","status"], labels: ["เลขที่","วันที่","ลูกค้า","รถ","รายการ","มูลค่า","สถานะ"] },
    rpt_production: { prefix: "batches", fields: ["id","date","farmName","chickenCount","weight","line","yieldRate","status"], labels: ["Batch","วันที่","ฟาร์ม","ตัว","กก.","สาย","Yield%","สถานะ"] },
    rpt_cost: { prefix: "batches", fields: ["id","date","chickenCount","weight","yieldRate","line","status"], labels: ["Batch","วันที่","ตัว","กก.","Yield%","สาย","สถานะ"] },
  };

  if (type === "rpt_kpi") {
    const kpiData = [{ n: "Yield Rate", t: 95, a: 93.2, u: "%" }, { n: "OEE", t: 85, a: 88.5, u: "%" }, { n: "ของเสีย", t: 3, a: 2.1, u: "%" }, { n: "หยุดเครื่อง", t: 5, a: 4.2, u: "%" }, { n: "ส่งตรงเวลา", t: 98, a: 96.5, u: "%" }];
    return (
      <div>
        <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>📊 KPI Dashboard</h1>
        <Card>
          {kpiData.map(k => {
            const good = (k.n === "ของเสีย" || k.n === "หยุดเครื่อง") ? k.a <= k.t : k.a >= k.t;
            return (
              <div key={k.n} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 140, fontWeight: 600, fontSize: 13 }}>{k.n}</div>
                <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 4 }}><div style={{ width: `${Math.min((k.a / k.t) * 100, 100)}%`, height: "100%", background: good ? "#22c55e" : "#ef4444", borderRadius: 4 }} /></div>
                <div style={{ width: 70, textAlign: "right", fontWeight: 700, color: good ? "#22c55e" : "#ef4444" }}>{k.a}{k.u}</div>
                <div style={{ width: 80, textAlign: "right", fontSize: 12, color: "#94a3b8" }}>เป้า: {k.t}{k.u}</div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  if (type === "rpt_pnl") {
    const fin = DB.getAll("finance");
    const inc = fin.filter(f => f.type === "รายรับ").reduce((s, f) => s + (+f.amount || 0), 0);
    const exp = fin.filter(f => f.type === "รายจ่าย").reduce((s, f) => s + Math.abs(+f.amount || 0), 0);
    return (
      <div>
        <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>📊 กำไร-ขาดทุน</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Card style={{ textAlign: "center", background: "#f0fdf4" }}><div style={{ fontSize: 12, color: "#64748b" }}>รายได้</div><div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>฿{inc.toLocaleString()}</div></Card>
          <Card style={{ textAlign: "center", background: "#fef2f2" }}><div style={{ fontSize: 12, color: "#64748b" }}>ค่าใช้จ่าย</div><div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>฿{exp.toLocaleString()}</div></Card>
          <Card style={{ textAlign: "center", background: "#eff6ff" }}><div style={{ fontSize: 12, color: "#64748b" }}>กำไรสุทธิ</div><div style={{ fontSize: 24, fontWeight: 700, color: inc - exp >= 0 ? "#2563eb" : "#ef4444" }}>฿{(inc - exp).toLocaleString()}</div></Card>
        </div>
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>รายการการเงินทั้งหมด</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>{["รหัส","วันที่","ประเภท","หมวด","รายละเอียด","จำนวนเงิน","สถานะ"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: "#64748b" }}>{h}</th>)}</tr></thead>
            <tbody>{fin.map(f => (
              <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "6px 4px" }}>{f.id}</td><td style={{ padding: "6px 4px" }}>{f.date}</td>
                <td style={{ padding: "6px 4px" }}><Badge text={f.type} color={f.type === "รายรับ" ? "#22c55e" : "#ef4444"} /></td>
                <td style={{ padding: "6px 4px" }}>{f.category}</td><td style={{ padding: "6px 4px" }}>{f.desc}</td>
                <td style={{ padding: "6px 4px", fontWeight: 600, color: +f.amount >= 0 ? "#22c55e" : "#ef4444" }}>฿{(+f.amount).toLocaleString()}</td>
                <td style={{ padding: "6px 4px" }}><Badge text={sText(f.status)} color={sColor(f.status)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    );
  }

  const cfg = configs[type];
  if (!cfg) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>ไม่พบข้อมูลรายงาน</div>;
  const data = DB.getAll(cfg.prefix);

  return (
    <div>
      <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>📊 {titles[type]}</h1>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ borderBottom: "2px solid #e2e8f0" }}>{cfg.labels.map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: "#64748b" }}>{h}</th>)}</tr></thead>
          <tbody>{data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              {cfg.fields.map(f => <td key={f} style={{ padding: "6px 4px" }}>
                {f === "status" ? <Badge text={sText(row[f])} color={sColor(row[f])} /> : typeof row[f] === "number" ? row[f].toLocaleString() : String(row[f] ?? "")}
              </td>)}
            </tr>
          ))}</tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>ทั้งหมด {data.length} รายการ</div>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [openMenus, setOpenMenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { SEED(); }, []);

  const toggleMenu = (key) => setOpenMenus(p => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", background: C.body, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, background: C.sidebar, color: "#fff", display: "flex", flexDirection: "column", transition: "all 0.3s", overflow: "hidden", boxShadow: "2px 0 10px rgba(0,0,0,0.2)", zIndex: 100 }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e3a5f" }}>
          <div style={{ background: "#e0e7ff", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: C.accent }}>ERP</div>
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}><Icon name="menu" size={18} /></button>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e3a5f" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="user" size={18} /></div>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>son</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Admin</div></div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {MENU.map(item => (
            <div key={item.key}>
              <button onClick={() => item.children ? toggleMenu(item.key) : setPage(item.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", border: "none", cursor: "pointer", background: page === item.key ? C.sideActive : "transparent", color: page === item.key ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 500, textAlign: "left", transition: "all 0.2s", fontFamily: "inherit", borderLeft: page === item.key ? "3px solid #3b82f6" : "3px solid transparent" }}
                onMouseEnter={e => { if (page !== item.key) e.currentTarget.style.background = C.sideHover; }}
                onMouseLeave={e => { if (page !== item.key) e.currentTarget.style.background = "transparent"; }}>
                <Icon name={item.icon} size={16} /><span style={{ flex: 1 }}>{item.label}</span>
                {item.children && <span style={{ transform: openMenus[item.key] ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><Icon name="chevron" size={14} /></span>}
              </button>
              {item.children && openMenus[item.key] && (
                <div style={{ background: "#0d1f3c" }}>
                  {item.children.map(child => (
                    <button key={child.key} onClick={() => setPage(child.key)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "7px 18px 7px 48px", border: "none", cursor: "pointer", background: page === child.key ? C.sideActive : "transparent", color: page === child.key ? "#fff" : "#64748b", fontSize: 11, fontWeight: 400, textAlign: "left", transition: "all 0.2s", fontFamily: "inherit" }}
                      onMouseEnter={e => { if (page !== child.key) e.currentTarget.style.background = C.sideHover; }}
                      onMouseLeave={e => { if (page !== child.key) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: page === child.key ? "#3b82f6" : "#475569" }} />{child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "none", cursor: "pointer", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 500, fontFamily: "inherit", borderTop: "1px solid #1e3a5f" }}>
          <Icon name="logout" size={16} /> ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: C.header, padding: "0 20px", height: 50, display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #d1d5db" }}>
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151" }}><Icon name="menu" size={20} /></button>}
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative", cursor: "pointer" }}><Icon name="bell" size={18} /><span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="user" size={14} /></div>
            <Icon name="chevron" size={14} />
          </div>
        </header>
        <main style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <PageRouter page={page} setPage={setPage} setModal={setModal} />
        </main>
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 700, width: "100%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{modal.title}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} /></button>
            </div>
            {modal.content}
          </div>
        </div>
      )}
    </div>
  );
}
