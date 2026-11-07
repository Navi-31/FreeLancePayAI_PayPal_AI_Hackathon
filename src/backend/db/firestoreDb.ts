import { firestore } from "@/backend/firebase/admin";
import { DocumentData, Query, FieldValue } from "firebase-admin/firestore";

// Helper to convert Firestore Timestamps or ISO strings to Date or string
function serializeDoc<T = Record<string, unknown>>(data: DocumentData | undefined, id: string): T {
  if (!data) return null as unknown as T;
  const result: Record<string, unknown> = { id, ...data };

  for (const [key, val] of Object.entries(result)) {
    if (val && typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
      result[key] = (val as { toDate: () => Date }).toDate();
    }
  }

  return result as T;
}

// Clean and convert values for Firestore serialization (e.g. Decimal -> number, increment/decrement)
function cleanValue(val: unknown): unknown {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (val instanceof Date) return val;
  if (typeof val === "object") {
    if ("increment" in val && typeof (val as { increment: unknown }).increment !== "undefined") {
      const inc = (val as { increment: unknown }).increment;
      const num = typeof inc === "object" && inc !== null && "toNumber" in inc ? (inc as { toNumber: () => number }).toNumber() : Number(inc) || 0;
      return FieldValue.increment(num);
    }
    if ("decrement" in val && typeof (val as { decrement: unknown }).decrement !== "undefined") {
      const dec = (val as { decrement: unknown }).decrement;
      const num = typeof dec === "object" && dec !== null && "toNumber" in dec ? (dec as { toNumber: () => number }).toNumber() : Number(dec) || 0;
      return FieldValue.increment(-num);
    }
    if ("toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
      return (val as { toNumber: () => number }).toNumber();
    }
    if (Array.isArray(val)) {
      return val.map(cleanValue);
    }
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        res[k] = cleanValue(v);
      }
    }
    return res;
  }
  return val;
}

function cleanData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    cleaned[key] = cleanValue(val);
  }
  return cleaned;
}

// Evaluates whether an in-memory document matches a Prisma-style filter
function matchesWhere(doc: Record<string, unknown>, where?: Record<string, unknown>): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, condition] of Object.entries(where)) {
    if (condition === undefined) continue;

    if (key === "OR" && Array.isArray(condition)) {
      const anyMatch = condition.some((cond) => matchesWhere(doc, cond as Record<string, unknown>));
      if (!anyMatch) return false;
      continue;
    }

    if (key === "AND" && Array.isArray(condition)) {
      const allMatch = condition.every((cond) => matchesWhere(doc, cond as Record<string, unknown>));
      if (!allMatch) return false;
      continue;
    }

    if (key === "NOT") {
      if (Array.isArray(condition)) {
        const anyMatch = condition.some((cond) => matchesWhere(doc, cond as Record<string, unknown>));
        if (anyMatch) return false;
      } else if (typeof condition === "object" && condition !== null) {
        if (matchesWhere(doc, condition as Record<string, unknown>)) return false;
      }
      continue;
    }

    if (key === "project" && typeof condition === "object" && condition !== null) {
      const cond = condition as Record<string, unknown>;
      if (cond.userId) {
        // For milestones: check denormalized userId on the doc, fail if missing or mismatched
        if (!doc.userId || doc.userId !== cond.userId) return false;
      }
      if (cond.code) {
        // project.code filter — skip, can't resolve without project lookup
        // The caller should resolve these to projectIds before calling deleteMany
      }
      continue;
    }

    const val = doc[key];

    if (condition === null) {
      if (val !== null && val !== undefined) return false;
      continue;
    }

    if (typeof condition === "object" && condition !== null && !(condition instanceof Date) && !Array.isArray(condition)) {
      const cond = condition as Record<string, unknown>;

      if ("equals" in cond && val !== cond.equals) return false;
      if ("not" in cond && val === cond.not) return false;
      if ("in" in cond && Array.isArray(cond.in) && !cond.in.includes(val)) return false;
      if ("notIn" in cond && Array.isArray(cond.notIn) && cond.notIn.includes(val)) return false;
      if ("lt" in cond && !((val as string | number | Date) < (cond.lt as string | number | Date))) return false;
      if ("lte" in cond && !((val as string | number | Date) <= (cond.lte as string | number | Date))) return false;
      if ("gt" in cond && !((val as string | number | Date) > (cond.gt as string | number | Date))) return false;
      if ("gte" in cond && !((val as string | number | Date) >= (cond.gte as string | number | Date))) return false;
      if ("contains" in cond && (typeof val !== "string" || !val.includes(cond.contains as string))) return false;
      if ("startsWith" in cond && (typeof val !== "string" || !val.startsWith(cond.startsWith as string))) return false;
      if ("endsWith" in cond && (typeof val !== "string" || !val.endsWith(cond.endsWith as string))) return false;
      if ("mode" in cond && cond.mode === "insensitive" && typeof val === "string" && typeof cond.equals === "string") {
        if (val.toLowerCase() !== (cond.equals as string).toLowerCase()) return false;
      }
      continue;
    }

    // Direct equality (with support for Date comparisons)
    if (condition instanceof Date && val instanceof Date) {
      if (condition.getTime() !== val.getTime()) return false;
      continue;
    }

    if (val !== condition) {
      return false;
    }
  }

  return true;
}

// Applies Prisma-style orderBy
function applyOrderBy<T extends Record<string, unknown>>(
  items: T[],
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>
): T[] {
  if (!orderBy) return items;

  const orderRules = Array.isArray(orderBy) ? orderBy : [orderBy];

  return items.sort((a, b) => {
    for (const rule of orderRules) {
      const [field, direction] = Object.entries(rule)[0] || [];
      if (!field) continue;

      const valA = a[field];
      const valB = b[field];

      if (valA === valB) continue;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const compare = valA > valB ? 1 : -1;
      return direction === "desc" ? -compare : compare;
    }
    return 0;
  });
}

// Base Firestore Collection Wrapper
export class FirestoreCollection<T extends Record<string, unknown> = Record<string, unknown>> {
  constructor(public readonly collectionName: string) {}

  protected get col() {
    return firestore.collection(this.collectionName);
  }

  async findUnique(params: {
    where: { id?: string; email?: string; [key: string]: unknown };
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }): Promise<T | null> {
    const { where, select, include } = params;

    if (where.id && typeof where.id === "string") {
      const snap = await this.col.doc(where.id).get();
      if (!snap.exists) return null;
      const data = serializeDoc<T>(snap.data(), snap.id);
      if (!matchesWhere(data as Record<string, unknown>, where)) return null;
      return this.postProcess(data, include, select);
    }

    if (where.email && typeof where.email === "string") {
      const snap = await this.col.where("email", "==", where.email.toLowerCase()).limit(1).get();
      if (snap.empty) {
        // Fallback for case-sensitive match
        const snapExact = await this.col.where("email", "==", where.email).limit(1).get();
        if (snapExact.empty) return null;
        const data = serializeDoc<T>(snapExact.docs[0].data(), snapExact.docs[0].id);
        return this.postProcess(data, include, select);
      }
      const data = serializeDoc<T>(snap.docs[0].data(), snap.docs[0].id);
      return this.postProcess(data, include, select);
    }

    return this.findFirst({ where, select, include });
  }

  async findFirst(params: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }): Promise<T | null> {
    const items = await this.findMany({ ...params, take: 1 });
    return items.length > 0 ? items[0] : null;
  }

  async findMany(params: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
    skip?: number;
    take?: number;
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  } = {}): Promise<T[]> {
    const { where, orderBy, skip = 0, take, select, include } = params;

    // Direct ID lookup optimization
    if (where && typeof where.id === "string") {
      const doc = await this.col.doc(where.id).get();
      if (!doc.exists) return [];
      const item = serializeDoc<T>(doc.data(), doc.id);
      if (matchesWhere(item as Record<string, unknown>, where)) {
        const processed = await this.postProcess(item, include, select);
        return [processed];
      }
      return [];
    }

    let query: Query = this.col;

    // Direct equality optimizations for Firestore index querying
    if (where) {
      for (const [key, val] of Object.entries(where)) {
        if (key === "OR" || key === "AND" || key === "NOT" || key === "id") continue;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          query = query.where(key, "==", val);
        }
      }
    }

    const snap = await query.get();
    let results: T[] = snap.docs.map((d) => serializeDoc<T>(d.data(), d.id));

    // In-memory filter for complex Prisma predicates
    if (where) {
      results = results.filter((doc) => matchesWhere(doc as Record<string, unknown>, where));
    }

    // Apply sorting
    if (orderBy) {
      results = applyOrderBy(results, orderBy);
    }

    // Apply pagination
    if (skip > 0 || take !== undefined) {
      results = results.slice(skip, take !== undefined ? skip + take : undefined);
    }

    // Post-process includes & selects
    return Promise.all(results.map((item) => this.postProcess(item, include, select)));
  }

  async create(params: { data: Record<string, unknown>; select?: Record<string, boolean> }): Promise<T> {
    const now = new Date();
    const data = cleanData({
      ...params.data,
      createdAt: params.data.createdAt ?? now,
      updatedAt: params.data.updatedAt ?? now,
    });

    const docId = (data.id as string) || this.col.doc().id;
    delete data.id;

    await this.col.doc(docId).set(data);
    const created = serializeDoc<T>(data, docId);
    return this.postProcess(created, undefined, params.select);
  }

  async update(params: {
    where: { id: string; [key: string]: unknown };
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<T> {
    const id = params.where.id;
    if (!id) throw new Error("Update requires document id in where clause");

    const data = cleanData({
      ...params.data,
      updatedAt: params.data.updatedAt ?? new Date(),
    });
    delete data.id;

    await this.col.doc(id).set(data, { merge: true });
    const snap = await this.col.doc(id).get();
    const updated = serializeDoc<T>(snap.data(), snap.id);
    return this.postProcess(updated, undefined, params.select);
  }

  async upsert(params: {
    where: { id?: string; userId?: string; [key: string]: unknown };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<T> {
    // Flatten Prisma composite unique keys (e.g. { userId_code: { userId, code } })
    const flatWhere: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(params.where)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        // Composite key — spread its inner fields
        Object.assign(flatWhere, val as Record<string, unknown>);
      } else {
        flatWhere[key] = val;
      }
    }
    const existing = await this.findFirst({ where: flatWhere });
    if (existing && (existing as unknown as { id: string }).id) {
      return this.update({
        where: { id: (existing as unknown as { id: string }).id },
        data: params.update,
        select: params.select,
      });
    } else {
      return this.create({
        data: { ...flatWhere, ...params.create },
        select: params.select,
      });
    }
  }

  async updateMany(params: {
    where?: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }> {
    const items = await this.findMany({ where: params.where });
    if (items.length === 0) return { count: 0 };

    const batch = firestore.batch();
    const updateData = cleanData({
      ...params.data,
      updatedAt: params.data.updatedAt ?? new Date(),
    });

    for (const item of items) {
      const docRef = this.col.doc((item as { id: string }).id);
      batch.set(docRef, updateData, { merge: true });
    }

    await batch.commit();
    return { count: items.length };
  }

  async delete(params: { where: { id: string; [key: string]: unknown } }): Promise<T> {
    const id = params.where.id;
    if (!id) throw new Error("Delete requires document id in where clause");

    const snap = await this.col.doc(id).get();
    const data = serializeDoc<T>(snap.data(), snap.id);
    await this.col.doc(id).delete();
    return data;
  }

  async deleteMany(params: { where?: Record<string, unknown> } = {}): Promise<{ count: number }> {
    const items = await this.findMany({ where: params.where });
    if (items.length === 0) return { count: 0 };

    const batch = firestore.batch();
    for (const item of items) {
      batch.delete(this.col.doc((item as { id: string }).id));
    }
    await batch.commit();
    return { count: items.length };
  }

  async count(params: { where?: Record<string, unknown> } = {}): Promise<number> {
    const items = await this.findMany({ where: params.where });
    return items.length;
  }

  // Hook for post-processing joins and selects
  protected async postProcess(
    item: T,
    include?: Record<string, boolean>,
    select?: Record<string, boolean>
  ): Promise<T> {
    if (!item) return item;
    let processed: Record<string, unknown> = { ...item };

    // Apply includes if handled in sub-classes
    if (include) {
      processed = await this.resolveIncludes(processed, include);
    }

    // Apply projection selects
    if (select && Object.keys(select).length > 0) {
      const filtered: Record<string, unknown> = {};
      for (const [key, shouldInclude] of Object.entries(select)) {
        if (shouldInclude) {
          filtered[key] = processed[key];
        }
      }
      return filtered as T;
    }

    return processed as T;
  }

  protected async resolveIncludes(
    item: Record<string, unknown>,
    _include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return item;
  }
}

// User Collection with Profile & Financial Settings joins
export class UserCollection extends FirestoreCollection {
  constructor() {
    super("users");
  }

  override async create(params: { data: Record<string, unknown>; select?: Record<string, boolean> }) {
    const data = { ...params.data };
    if (data.email && typeof data.email === "string") {
      data.email = data.email.toLowerCase();
    }

    let profileData: Record<string, unknown> | null = null;
    if (data.profile && typeof data.profile === "object") {
      const p = data.profile as Record<string, unknown>;
      if ("create" in p && typeof p.create === "object") {
        profileData = p.create as Record<string, unknown>;
      } else {
        profileData = p;
      }
      delete data.profile;
    }

    let settingsData: Record<string, unknown> | null = null;
    if (data.financialSettings && typeof data.financialSettings === "object") {
      const s = data.financialSettings as Record<string, unknown>;
      if ("create" in s && typeof s.create === "object") {
        settingsData = s.create as Record<string, unknown>;
      } else {
        settingsData = s;
      }
      delete data.financialSettings;
    }

    const created = await super.create({ data, select: params.select });
    const userId = (created as { id: string }).id;

    if (profileData) {
      await firestore.collection("profiles").doc(userId).set({
        ...profileData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      (created as Record<string, unknown>).profile = profileData;
    }

    if (settingsData) {
      await firestore.collection("financialSettings").doc(userId).set({
        ...settingsData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      (created as Record<string, unknown>).financialSettings = settingsData;
    }

    return created;
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const userId = item.id as string;
    if (!userId) return item;

    if (include.profile) {
      const profileSnap = await firestore.collection("profiles").doc(userId).get();
      item.profile = profileSnap.exists
        ? serializeDoc(profileSnap.data(), profileSnap.id)
        : (item.profile || null);
    }

    if (include.financialSettings) {
      const settingsSnap = await firestore.collection("financialSettings").doc(userId).get();
      item.financialSettings = settingsSnap.exists
        ? serializeDoc(settingsSnap.data(), settingsSnap.id)
        : (item.financialSettings || null);
    }

    return item;
  }
}

// Invoices Collection with Line Items
export class InvoiceCollection extends FirestoreCollection {
  constructor() {
    super("invoices");
  }

  override async create(params: {
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }) {
    const data = { ...params.data };
    let lineItemsToCreate: Array<Record<string, unknown>> = [];

    if (data.lineItems && typeof data.lineItems === "object") {
      const li = data.lineItems as Record<string, unknown>;
      if ("create" in li && Array.isArray(li.create)) {
        lineItemsToCreate = li.create as Array<Record<string, unknown>>;
      } else if (Array.isArray(li)) {
        lineItemsToCreate = li as Array<Record<string, unknown>>;
      }
    }

    const docId = (data.id as string) || this.col.doc().id;
    data.id = docId;

    const formattedLines = lineItemsToCreate.map((item, idx) => cleanData({
      id: (item.id as string) || `line-${docId}-${idx + 1}`,
      invoiceId: docId,
      ...item,
    }));
    data.lineItems = formattedLines;

    const created = await super.create({ data, select: params.select });

    if (formattedLines.length > 0) {
      const batch = firestore.batch();
      for (const line of formattedLines) {
        batch.set(firestore.collection("invoiceLineItems").doc(line.id as string), cleanData(line), { merge: true });
      }
      await batch.commit();
    }

    return this.postProcess(created, params.include, params.select);
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const invoiceId = item.id as string;
    if (!invoiceId) return item;

    if (include.lineItems && !item.lineItems) {
      const linesSnap = await firestore.collection("invoiceLineItems").where("invoiceId", "==", invoiceId).get();
      item.lineItems = linesSnap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    if (include.client && item.clientId) {
      const clientSnap = await firestore.collection("clients").doc(item.clientId as string).get();
      item.client = clientSnap.exists ? serializeDoc(clientSnap.data(), clientSnap.id) : null;
    }

    if (include.user && item.userId) {
      const userSnap = await firestore.collection("users").doc(item.userId as string).get();
      if (userSnap.exists) {
        const u = serializeDoc<Record<string, unknown>>(userSnap.data(), userSnap.id);
        const profileSnap = await firestore.collection("profiles").doc(item.userId as string).get();
        u.profile = profileSnap.exists ? serializeDoc(profileSnap.data(), profileSnap.id) : (u.profile || null);
        item.user = u;
      } else {
        item.user = null;
      }
    }

    if (include.reminders) {
      const remSnap = await firestore.collection("paymentReminders").where("invoiceId", "==", invoiceId).get();
      item.reminders = remSnap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    return item;
  }
}

// Projects Collection with Milestones
export class ProjectCollection extends FirestoreCollection {
  constructor() {
    super("projects");
  }

  override async create(params: {
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
    include?: Record<string, unknown>;
  }) {
    const data = { ...params.data };
    let milestonesToCreate: Array<Record<string, unknown>> = [];

    if (data.milestones && typeof data.milestones === "object") {
      const ms = data.milestones as Record<string, unknown>;
      if ("create" in ms && Array.isArray(ms.create)) {
        milestonesToCreate = ms.create as Array<Record<string, unknown>>;
      } else if (Array.isArray(ms)) {
        milestonesToCreate = ms as Array<Record<string, unknown>>;
      }
    }

    const docId = (data.id as string) || this.col.doc().id;
    data.id = docId;

    const formattedMilestones = milestonesToCreate.map((item, idx) => cleanData({
      id: (item.id as string) || `ms-${docId}-${idx + 1}`,
      projectId: docId,
      userId: data.userId,
      ...item,
    }));
    data.milestones = formattedMilestones;

    const created = await super.create({ data, select: params.select });

    if (formattedMilestones.length > 0) {
      const batch = firestore.batch();
      for (const m of formattedMilestones) {
        batch.set(firestore.collection("milestones").doc(m.id as string), cleanData(m), { merge: true });
      }
      await batch.commit();
    }

    return this.postProcess(created, params.include, params.select);
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const projectId = item.id as string;
    if (!projectId) return item;

    if (include.milestones) {
      const snap = await firestore.collection("milestones").where("projectId", "==", projectId).get();
      item.milestones = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    return item;
  }
}

// Milestones Collection with History
export class MilestoneCollection extends FirestoreCollection {
  constructor() {
    super("milestones");
  }

  // Denormalize userId from parent project onto milestone for ownership queries
  override async create(params: { data: Record<string, unknown>; select?: Record<string, boolean> }) {
    const data = { ...params.data };
    if (!data.userId && data.projectId && typeof data.projectId === "string") {
      const projectSnap = await firestore.collection("projects").doc(data.projectId).get();
      if (projectSnap.exists) {
        data.userId = projectSnap.data()?.userId;
      }
    }
    return super.create({ data, select: params.select });
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const milestoneId = item.id as string;
    if (!milestoneId) return item;

    if (include.history && !item.history) {
      const snap = await firestore.collection("milestoneHistories").where("milestoneId", "==", milestoneId).get();
      item.history = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    if (include.project && item.projectId) {
      const snap = await firestore.collection("projects").doc(item.projectId as string).get();
      if (snap.exists) {
        const prj = serializeDoc<Record<string, unknown>>(snap.data(), snap.id);
        if (prj.clientId) {
          const clientSnap = await firestore.collection("clients").doc(prj.clientId as string).get();
          prj.client = clientSnap.exists ? serializeDoc(clientSnap.data(), clientSnap.id) : null;
        }
        item.project = prj;
      } else {
        item.project = null;
      }
    }

    return item;
  }
}

// Payment Reminders Collection with History
export class ReminderCollection extends FirestoreCollection {
  constructor() {
    super("paymentReminders");
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const reminderId = item.id as string;
    if (!reminderId) return item;

    if (include.history && !item.history) {
      const snap = await firestore.collection("reminderHistories").where("reminderId", "==", reminderId).get();
      item.history = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    if (include.invoice && item.invoiceId) {
      const snap = await firestore.collection("invoices").doc(item.invoiceId as string).get();
      if (snap.exists) {
        const inv = serializeDoc<Record<string, unknown>>(snap.data(), snap.id);
        if (inv.clientId) {
          const clientSnap = await firestore.collection("clients").doc(inv.clientId as string).get();
          inv.client = clientSnap.exists ? serializeDoc(clientSnap.data(), clientSnap.id) : null;
        }
        item.invoice = inv;
      } else {
        item.invoice = null;
      }
    }

    return item;
  }
}

// Clients Collection with Invoices and PaymentHistories
export class ClientCollection extends FirestoreCollection {
  constructor() {
    super("clients");
  }

  protected override async resolveIncludes(
    item: Record<string, unknown>,
    include: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const clientId = item.id as string;
    if (!clientId) return item;

    if (include.invoices) {
      const snap = await firestore.collection("invoices").where("clientId", "==", clientId).get();
      item.invoices = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    if (include.paymentHistories) {
      const snap = await firestore.collection("clientPaymentHistories").where("clientId", "==", clientId).get();
      item.paymentHistories = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    if (include.projects) {
      const snap = await firestore.collection("projects").where("clientId", "==", clientId).get();
      item.projects = snap.docs.map((d) => serializeDoc(d.data(), d.id));
    }

    return item;
  }
}

// Complete Unified Firestore Database Adapter
export class FirestoreDatabase {
  readonly user = new UserCollection();
  readonly profile = new FirestoreCollection("profiles");
  readonly client = new ClientCollection();
  readonly clientPaymentHistory = new FirestoreCollection("clientPaymentHistories");
  readonly project = new ProjectCollection();
  readonly milestone = new MilestoneCollection();
  readonly milestoneHistory = new FirestoreCollection("milestoneHistories");
  readonly invoice = new InvoiceCollection();
  readonly invoiceLineItem = new FirestoreCollection("invoiceLineItems");
  readonly transaction = new FirestoreCollection("transactions");
  readonly paymentReminder = new ReminderCollection();
  readonly reminderHistory = new FirestoreCollection("reminderHistories");
  readonly expense = new FirestoreCollection("expenses");
  readonly subscription = new FirestoreCollection("subscriptions");
  readonly taxEstimate = new FirestoreCollection("taxEstimates");
  readonly financialSettings = new FirestoreCollection("financialSettings");
  readonly notification = new FirestoreCollection("notifications");
  readonly auditLog = new FirestoreCollection("auditLogs");
  readonly emailDelivery = new FirestoreCollection("emailDeliveries");
  readonly emailOtp = new FirestoreCollection("emailOtps");
  readonly passwordResetToken = new FirestoreCollection("passwordResetTokens");
  readonly document = new FirestoreCollection("documents");
  readonly backgroundJob = new FirestoreCollection("backgroundJobs");
  readonly payPalWebhookEvent = new FirestoreCollection("paypalWebhookEvents");

  // Healthcheck ping for database connectivity
  async $queryRaw(_query: TemplateStringsArray | string): Promise<unknown> {
    await firestore.collection("_healthcheck").doc("ping").set({
      pingAt: new Date().toISOString(),
      provider: "firestore",
    });
    return [{ "?column?": 1 }];
  }

  // Transactions handler (supports both interactive callback and Promise.all array)
  async $transaction<T>(input: ((tx: FirestoreDatabase) => Promise<T>) | Promise<unknown>[], _options?: Record<string, unknown>): Promise<T> {
    if (Array.isArray(input)) {
      return Promise.all(input) as unknown as T;
    }
    if (typeof input === "function") {
      return input(this);
    }
    return input as T;
  }

  async $disconnect(): Promise<void> {
    // Firestore Admin manages its own gRPC connections
  }
}

export const firestoreDb = new FirestoreDatabase();

export class Decimal {
  private value: number;
  constructor(val: number | string | Decimal | unknown) {
    if (typeof val === "object" && val !== null && "toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
      this.value = (val as { toNumber: () => number }).toNumber();
    } else {
      this.value = Number(val) || 0;
    }
  }
  toNumber(): number {
    return this.value;
  }
  toString(): string {
    return this.value.toString();
  }
  toFixed(digits?: number): string {
    return this.value.toFixed(digits);
  }
  valueOf(): number {
    return this.value;
  }
  [Symbol.toPrimitive](): number {
    return this.value;
  }
}

const _Decimal = Decimal;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  export type ClientWhereInput = Record<string, unknown>;
  export type InvoiceWhereInput = Record<string, unknown>;
  export type ProjectWhereInput = Record<string, unknown>;
  export type TransactionWhereInput = Record<string, unknown>;
  export type MilestoneWhereInput = Record<string, unknown>;
  export type ExpenseWhereInput = Record<string, unknown>;
  export type DecimalJsLike = { toNumber(): number; toString(): string; valueOf(): number };
  // Re-export Decimal as a type + value constructor
  export const Decimal = _Decimal;
}

export class PrismaClient extends FirestoreDatabase {}

